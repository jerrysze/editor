import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  useTheme, 
  Button, 
  Box, 
  FormControl, 
  Select, 
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ListItemIcon,
  ListItemText,
  ListItemButton
} from '@mui/material';

import { 
  ExpandMore, 
  KeyboardArrowRight, 
  FolderSpecial, 
  PersonAdd, 
  Add, 
  MoreVert, 
  InsertDriveFile, 
  Menu as MenuIcon, 
  Description, 
  QuestionAnswer, 
  Assignment, 
  ExpandLess, 
  Delete,
  Edit
} from '@mui/icons-material';

import SearchBar from './SearchBar';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { ActiveFileContext } from '../contexts/ActiveFileContext';
import { 
  getCollectionStructure, 
  saveCollectionStructure,
  deleteFile, 
  deleteCollection, 
  renameCollection,
} from '@/app/api';
import { Collection, File } from '@/app/types';
import MergeFilesButton from './MergeFilesButton';
import ResizeHandle from './ResizeHandle';
import { 
  Checkbox,
} from '@mui/material';
import { TransferToExamButton } from './TransferToExamButton';
import AddQuestionDialog from './AddQuestionDialog';
import { FileMetadata, QuestionNumbering, QuestionGroup } from '../types/metadata';
import { serverPostResource } from '@/app/api';

const MIN_DRAWER_WIDTH = 200;
const MAX_DRAWER_WIDTH = 600;
const DEFAULT_DRAWER_WIDTH = 200;

const FILE_TYPE_COLORS = {
  question: '#2196f3',    // Blue
  answer: '#4caf50',      // Green
  marking: '#ff9800'      // Orange
};

export interface Template {
  id: string;
  name: string;
}

export const sortByName = <T extends { name: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
};

const generateFileName = (numbering: QuestionNumbering, type: 'question' | 'answer' | 'marking_scheme'): string => {
  let baseName = `Question-${numbering.mainNumber}`;
  if (numbering.subQuestion) {
    baseName += `-${numbering.subQuestion}`;
  }
  if (numbering.subSubQuestion) {
    baseName += `-${numbering.subSubQuestion}`;
  }
  
  switch (type) {
    case 'answer':
      return `${baseName}-answer`;
    case 'marking_scheme':
      return `${baseName}-marking`;
    default:
      return baseName;
  }
};

const generateQuestionLabel = (numbering: QuestionNumbering): string => {
  let label = `Question ${numbering.mainNumber}`;
  if (numbering.subQuestion) {
    label += `${numbering.subQuestion}`;
  }
  if (numbering.subSubQuestion) {
    label += `${numbering.subSubQuestion}`;
  }
  return label;
};

const groupFilesByQuestion = (files: File[]): QuestionGroup[] => {
  const groups: { [key: string]: QuestionGroup } = {};

  files.forEach(file => {
    const match = file.name.match(/Question-(\d+)(?:-([a-z]))?(?:-([a-z]))?(?:-(answer|marking))?$/i);
    if (!match) return;

    const [, mainNumber, subQuestion, subSubQuestion, type] = match;
    let label = `Question ${mainNumber}`;
    if (subQuestion) label += subQuestion.toUpperCase();
    if (subSubQuestion) label += subSubQuestion.toUpperCase();

    if (!groups[label]) {
      groups[label] = {
        label,
        files: {
          question: undefined,
          answer: undefined,
          markingScheme: undefined
        },
        metadata: {
          documentType: 'question',
          format: 'markdown',
          score: 0,
          questionLabel: label,
          questionNumbering: {
            mainNumber: parseInt(mainNumber),
            subQuestion,
            subSubQuestion
          }
        }
      };
    }

    if (type === 'answer') {
      groups[label].files.answer = file.id;
    } else if (type === 'marking') {
      groups[label].files.markingScheme = file.id;
    } else {
      groups[label].files.question = file.id;
    }
  });

  return Object.values(groups).sort((a, b) => {
    const aMatch = a.label.match(/Question (\d+)([a-z])?([a-z])?/i);
    const bMatch = b.label.match(/Question (\d+)([a-z])?([a-z])?/i);
    if (!aMatch || !bMatch) return 0;
    
    const aNum = parseInt(aMatch[1]);
    const bNum = parseInt(bMatch[1]);
    if (aNum !== bNum) return aNum - bNum;
    
    return (aMatch[2] || '').localeCompare(bMatch[2] || '');
  });
};

const Sidebar = () => {
  const theme = useTheme();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [addingItem, setAddingItem] = useState<{ type: 'collection' | 'file' | 'template', parentId: string | null } | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: string, type: 'collection' | 'file' | 'template', parentId: string | null } | null>(null);
  const [renamingItem, setRenamingItem] = useState<{ id: string, type: 'collection' | 'file' | 'template', parentId: string | null } | null>(null);
  const [activeItem, setActiveItem] = useState<{ id: string, type: 'collection' | 'file' | 'template' } | null>(null);
  const [collectionsVisible, setCollectionsVisible] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'collection' | 'file' | 'template', parentId: string | null, name: string } | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const sidebarRef = useRef<HTMLUListElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [templatesVisible, setTemplatesVisible] = useState(true);
  const { 
    setActiveFile,
    isSelectionMode,
    setSelectionMode,
    selectedFiles,
    setSelectedFiles,
    selectionType,
    setSelectionType
  } = useContext(ActiveFileContext);
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);
  const [highlightedCollection, setHighlightedCollection] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [groupMenuAnchor, setGroupMenuAnchor] = useState<{ element: HTMLElement; group: QuestionGroup } | null>(null);
  const [renamingGroup, setRenamingGroup] = useState<QuestionGroup | null>(null);
  const [newQuestionNumbering, setNewQuestionNumbering] = useState<QuestionNumbering>({
    mainNumber: 1,
    subQuestion: '',
    subSubQuestion: ''
  });

  const HASURA_ENDPOINT = process.env.NEXT_PUBLIC_HASURA_ENDPOINT || 'http://localhost:8080/v1/graphql';

  useEffect(() => {
    loadCollectionStructure();
  }, []);

  const loadCollectionStructure = async () => {
    try {
      console.log("Loading collection structure...");
      const structure = await getCollectionStructure();
      console.log("Received structure:", structure);
      if (structure && structure.length > 0) {
        setCollections(structure);
        setFilteredCollections(structure);
      } else {
        console.log("Received empty or invalid structure");
        setCollections([]);
        setFilteredCollections([]);
      }
    } catch (error) {
      console.error("Error loading collection structure:", error);
      setCollections([]);
      setFilteredCollections([]);
    }
  };

  useEffect(() => {
    setFilteredCollections(searchTerm ? filterCollections(collections, searchTerm) : collections);
  }, [searchTerm, collections]);

  const filterCollections = (cols: Collection[], term: string): Collection[] => {
    return cols.reduce((acc: Collection[], col) => {
      const matchingFiles = col.files.filter(file => file.name.toLowerCase().includes(term.toLowerCase()));
      const matchingCollections = filterCollections(col.collections, term);
      
      if (col.name.toLowerCase().includes(term.toLowerCase()) || matchingFiles.length > 0 || matchingCollections.length > 0) {
        acc.push({
          ...col,
          files: matchingFiles,
          collections: matchingCollections,
          isOpen: true
        });
      }
      return acc;
    }, []);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, id: string, type: 'collection' | 'file' | 'template', parentId: string | null) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom,
      left: rect.right,
    });
    setSelectedItem({ id, type, parentId });
  };

  const handleMenuClose = () => {
    setMenuPosition(null);
    setSelectedItem(null);
  };

  const addItem = async (
    type: 'collection' | 'file', 
    parentId: string | null, 
    name?: string,
    metadata?: FileMetadata
  ) => {
    try {
      const itemName = name || newItemName;
      if (!itemName) {
        console.error('No item name provided');
        return;
      }
      
      if (!parentId && type === 'file') {
        console.error('Cannot create file without parent collection');
        return;
      }

      console.log(`Creating ${type} "${itemName}" in collection ${parentId} with metadata:`, metadata);

      if (type === 'collection') {
        // Create new collection
        const newCollection: Collection = {
          id: Date.now().toString(),
          name: itemName,
          files: [],
          collections: [],
          isOpen: true
        };
        
        // Create a new array with the updated structure
        let updatedCollections: Collection[];
        
        if (parentId) {
          // Add to specific parent collection
          updatedCollections = collections.map(col => {
            if (col.id === parentId) {
              return {
                ...col,
                collections: [...col.collections, newCollection].sort((a, b) => 
                  a.name.localeCompare(b.name)
                )
              };
            } else {
              return col;
            }
          });
        } else {
          // Add to root level
          updatedCollections = [...collections, newCollection].sort((a, b) => 
            a.name.localeCompare(b.name)
          );
        }
        
        // Save the updated structure
        await saveCollectionStructure(updatedCollections);
        
        // Update local state
        setCollections(updatedCollections);
      } else {
        // Handle file creation using the API route
        const fileId = Date.now().toString();
        const response = await fetch('/api/files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_id: fileId,
            file_name: itemName,
            collection_id: parentId,
            content: '',
            metadata: metadata || null
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create file');
        }

        const data = await response.json();
        console.log('File creation response:', data);

        // Refresh the collection structure after successful file creation
        await loadCollectionStructure();
        return data;
      }

      setAddingItem(null);
      setNewItemName('');
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      throw error;
    }
  };

  const updateCollections = (cols: Collection[], parentId: string, type: 'collection' | 'file', newItem: { id: string, name: string }): Collection[] => {
    return cols.map(col => {
      if (col.id === parentId) {
        if (type === 'collection') {
          return { 
            ...col, 
            collections: [...col.collections, { ...newItem, files: [], collections: [], isOpen: true }].sort((a, b) => a.name.localeCompare(b.name))
          };
        } else {
          return { 
            ...col, 
            files: [...col.files, newItem as File].sort((a, b) => a.name.localeCompare(b.name))
          };
        }
      } else if (col.collections.length > 0) {
        return { ...col, collections: updateCollections(col.collections, parentId, type, newItem) };
      }
      return col;
    });
  };

  const startRenaming = () => {
    if (selectedItem) {
      setRenamingItem(selectedItem);
      setNewItemName(getItemName(selectedItem.id, selectedItem.type));
      handleMenuClose();
    }
  };

  const getItemName = (id: string, type: 'collection' | 'file' | 'template'): string => {
    if (type === 'template') {
      return templates.find(t => t.id === id)?.name || '';
    }
    
    const findItemName = (cols: Collection[]): string => {
      for (const col of cols) {
        if (col.id === id) return col.name;
        if (type === 'file') {
          const file = col.files.find(f => f.id === id);
          if (file) return file.name;
        }
        const result = findItemName(col.collections);
        if (result) return result;
      }
      return '';
    };
    
    return findItemName(collections);
  };

  const renameItem = async () => {
    if (renamingItem && newItemName.trim()) {
      try {
        if (renamingItem.type === 'template') {
          setTemplates(prevTemplates =>
            prevTemplates.map(template =>
              template.id === renamingItem.id ? { ...template, name: newItemName } : template
            ).sort((a, b) => a.name.localeCompare(b.name))
          );
        } else if (renamingItem.type === 'collection') {
          // Update the collection name in the database
          await renameCollection(renamingItem.id, newItemName);
          // Then update local state
          setCollections(renameItemInCollections(collections, renamingItem.id, renamingItem.type, newItemName));
        } else {
          // Handle file renaming (if needed)
          setCollections(renameItemInCollections(collections, renamingItem.id, renamingItem.type, newItemName));
        }
        setNewItemName('');
        setRenamingItem(null);
      } catch (error) {
        console.error("Error renaming item:", error);
        // Optionally show an error message to the user
      }
    }
  };

  const renameItemInCollections = (cols: Collection[], id: string, type: 'collection' | 'file', newName: string): Collection[] => {
    return cols.map(col => {
      if (col.id === id && type === 'collection') {
        return { ...col, name: newName };
      } else if (col.files.some(f => f.id === id) && type === 'file') {
        return { 
          ...col, 
          files: col.files.map(f => f.id === id ? { ...f, name: newName } : f).sort((a, b) => a.name.localeCompare(b.name))
        };
      } else if (col.collections.length > 0) {
        return { 
          ...col, 
          collections: renameItemInCollections(col.collections, id, type, newName).sort((a, b) => a.name.localeCompare(b.name))
        };
      }
      return col;
    });
  };

  const handleDeleteClick = () => {
    if (selectedItem) {
      const itemName = getItemName(selectedItem.id, selectedItem.type);
      setItemToDelete({ ...selectedItem, name: itemName });
    }
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const deleteAllFilesInCollection = async (collection: Collection) => {
    // Delete files in current collection
    for (const file of collection.files) {
      try {
        await deleteFile(file.id);
      } catch (error) {
        console.error(`Error deleting file ${file.name}:`, error);
        throw error; // Propagate error up
      }
    }

    // Recursively delete files in subcollections
    for (const subCollection of collection.collections) {
      await deleteAllFilesInCollection(subCollection);
    }
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        if (itemToDelete.type === 'template') {
          deleteTemplate(itemToDelete.id);
        } else if (itemToDelete.type === 'file') {
          await deleteFile(itemToDelete.id);
          setCollections(deleteItemFromCollections(collections, itemToDelete.id, itemToDelete.type, itemToDelete.parentId));
        } else if (itemToDelete.type === 'collection') {
          const collectionToDelete = findCollectionById(collections, itemToDelete.id);
          if (collectionToDelete) {
            try {
              await deleteAllFilesInCollection(collectionToDelete);
              await deleteCollection(itemToDelete.id);
              
              // If we're deleting the currently selected collection
              if (selectedCollectionId === itemToDelete.id) {
                // Find another collection to select
                const remainingCollections = collections.filter(c => c.id !== itemToDelete.id);
                if (remainingCollections.length > 0) {
                  setSelectedCollectionId(remainingCollections[0].id);
                } else {
                  setSelectedCollectionId(null);
                }
              }
              
              setCollections(deleteItemFromCollections(collections, itemToDelete.id, itemToDelete.type, itemToDelete.parentId));
            } catch (error) {
              console.error("Error during collection deletion:", error);
              throw error;
            }
          }
        }
        
        // Clear the active file if it was deleted or if its parent collection was deleted
        if (itemToDelete.type === 'file' || itemToDelete.type === 'collection') {
          setActiveFile({
            collectionId: null,
            fileId: null,
            fileName: null,
          });
        }
        
        setDeleteConfirmOpen(false);
        setItemToDelete(null);

        // Refresh the collection structure
        await loadCollectionStructure();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const deleteItemFromCollections = (cols: Collection[], id: string, type: 'collection' | 'file', parentId: string | null): Collection[] => {
    if (parentId === null) {
      return cols.filter(col => col.id !== id);
    }
    return cols.map(col => {
      if (col.id === parentId) {
        if (type === 'collection') {
          return { ...col, collections: col.collections.filter(c => c.id !== id) };
        } else {
          return { ...col, files: col.files.filter(f => f.id !== id) };
        }
      } else if (col.collections.length > 0) {
        return { ...col, collections: deleteItemFromCollections(col.collections, id, type, parentId) };
      }
      return col;
    });
  };

  const handleItemClick = (id: string, type: 'collection' | 'file' | 'template') => {
    setActiveItem({ id, type });
    if (type === 'file') {
      const file = findFileById(id, collections);
      if (file) {
        setActiveFile({
          collectionId: file.collectionId,
          fileId: file.id,
          fileName: file.name,
        });
      }
    } else if (type === 'collection') {
      setActiveFile({
        collectionId: id,
        fileId: null,
        fileName: null,
      });
    }
  };

  // Helper function to find a file by its ID
  const findFileById = (id: string, collections: Collection[]): { id: string, name: string, collectionId: string } | null => {
    for (const collection of collections) {
      const file = collection.files.find(f => f.id === id);
      if (file) {
        return { ...file, collectionId: collection.id };
      }
      const nestedResult = findFileById(id, collection.collections);
      if (nestedResult) {
        return nestedResult;
      }
    }
    return null;
  };

  const toggleCollection = (id: string) => {
    setCollections(prevCollections => {
      const toggleCollectionRecursive = (cols: Collection[]): Collection[] => {
        return cols.map(col => 
          col.id === id
            ? { ...col, isOpen: !col.isOpen }
            : col.collections.length > 0
              ? { ...col, collections: toggleCollectionRecursive(col.collections) }
              : col
        );
      };
      return toggleCollectionRecursive(prevCollections);
    });
  };

  const deleteTemplate = (id: string) => {
    setTemplates(prevTemplates => prevTemplates.filter(template => template.id !== id));
  };

  const handleInvitePeople = () => {
    console.log("Invite people clicked");
    // Implement the invite functionality here
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setAddingItem(null);
        setRenamingItem(null);
        setNewItemName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleResize = (newWidth: number) => {
    setDrawerWidth(Math.min(Math.max(newWidth, MIN_DRAWER_WIDTH), MAX_DRAWER_WIDTH));
  };

  const handleNewCollection = (collectionId: string) => {
    setHighlightedCollection(collectionId);
    setTimeout(() => {
      setHighlightedCollection(null);
    }, 4000); // Remove highlight after 4 seconds
  };

  // Helper function to find a collection by ID
  const findCollectionById = (collections: Collection[], id: string): Collection | null => {
    for (const collection of collections) {
      if (collection.id === id) {
        return collection;
      }
      const found = findCollectionById(collection.collections, id);
      if (found) {
        return found;
      }
    }
    return null;
  };

  useEffect(() => {
    if (collections.length > 0 && !selectedCollectionId) {
      setSelectedCollectionId(collections[0].id);
    }
  }, [collections]);

  const handleFileSelection = (
    file: { id: string; name: string },
    collectionId: string,
    event?: React.MouseEvent | React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedFiles(prev => {
      const isAlreadySelected = prev.some(f => f.fileId === file.id);
      
      if (isAlreadySelected) {
        // Remove file from selection and reorder remaining files
        const newSelection = prev
          .filter(f => f.fileId !== file.id)
          .map((f, index) => ({
            ...f,
            selectionOrder: index + 1
          }));
        return newSelection;
      } else {
        // Add new file to selection
        const newFile = {
          collectionId,
          fileId: file.id,
          fileName: file.name,
          selectionOrder: prev.length + 1
        };

        if (selectionType === 'insert') {
          // In insert mode, select only one file
          return [newFile];
        } else if (selectionType === 'merge') {
          // In merge mode, allow multiple selections
          return [...prev, newFile];
        } else {
          return prev; // No changes in other modes
        }
      }
    });

    // Only exit selection mode automatically in insert mode
    if (selectionType === 'insert') {
      setSelectionMode(false);
    }
  };

  // Add this effect to handle collection deletion
  useEffect(() => {
    // If the selected collection no longer exists, select another one
    if (selectedCollectionId && !collections.find(c => c.id === selectedCollectionId)) {
      if (collections.length > 0) {
        setSelectedCollectionId(collections[0].id);
      } else {
        setSelectedCollectionId(null);
      }
    }
  }, [collections, selectedCollectionId]);

  const handleAddQuestion = async (metadata: FileMetadata, files: string[]) => {
    try {
      console.log('Creating files:', files);
      console.log('With metadata:', metadata);
      
      // Create files with the generated names
      for (const fileName of files) {
        const documentType = fileName.endsWith('-answer') 
          ? 'answer' 
          : fileName.endsWith('-marking') 
            ? 'marking_scheme' 
            : 'question';

        // Update the metadata with the proper question label format
        const fileMetadata = {
          ...metadata,
          documentType,
          questionLabel: generateQuestionLabel(metadata.questionNumbering || { mainNumber: 1 })
        };
        
        // Generate the proper file name using the helper function
        const properFileName = generateFileName(
          metadata.questionNumbering || { mainNumber: 1 },
          documentType
        );
        
        console.log(`Creating file "${properFileName}" with metadata:`, fileMetadata);
        
        try {
          const response = await addItem('file', selectedCollectionId, properFileName, fileMetadata);
          
          if (response?.data?.insert_editor_files_one?.file_id) {
            const fileId = response.data.insert_editor_files_one.file_id;
            await serverPostResource('update_metadata', JSON.stringify({
              file_id: fileId,
              metadata: fileMetadata  // Using the updated metadata with proper question label
            }));
            console.log(`Updated metadata for file ${fileId}:`, fileMetadata);
          } else {
            console.error('Failed to get file ID from response:', response);
          }
        } catch (error) {
          console.error(`Failed to create/update file "${properFileName}":`, error);
          throw error;
        }
      }
      
      // Refresh the collection structure after creating all files
      console.log('Refreshing collection structure...');
      await loadCollectionStructure();
      
      // Close the dialog after successful creation
      setIsAddQuestionDialogOpen(false);
    } catch (error) {
      console.error('Error adding question files:', error);
    }
  };

  const toggleGroup = (groupLabel: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupLabel)) {
        newSet.delete(groupLabel);
      } else {
        newSet.add(groupLabel);
      }
      return newSet;
    });
  };

  const handleGroupMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, group: QuestionGroup) => {
    event.stopPropagation();
    setGroupMenuAnchor({ element: event.currentTarget, group });
  };

  const handleGroupMenuClose = () => {
    setGroupMenuAnchor(null);
  };

  const handleRenameGroup = async () => {
    if (!groupMenuAnchor?.group || !selectedCollectionId) return;
    
    const group = groupMenuAnchor.group;
    setRenamingGroup(group);
    setNewQuestionNumbering(group.metadata.questionNumbering || { mainNumber: 1 });
    handleGroupMenuClose();
  };

  const handleSaveGroupRename = async () => {
    if (!renamingGroup || !selectedCollectionId) return;
    
    try {
      const newLabel = generateQuestionLabel(newQuestionNumbering);
      
      // Update each file in the group
      const fileUpdates = Object.entries(renamingGroup.files).map(async ([type, fileId]) => {
        if (!fileId) return;

        const fileType = type === 'question' 
          ? 'question' 
          : type === 'answer' 
            ? 'answer' 
            : 'marking_scheme';

        const newFileName = generateFileName(newQuestionNumbering, fileType);
        
        // Update file metadata
        const updatedMetadata: FileMetadata = {
          ...renamingGroup.metadata,
          questionLabel: newLabel,
          questionNumbering: newQuestionNumbering
        };

        // Update file using the API route
        const response = await fetch('/api/files/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId,
            fileName: newFileName,
            metadata: updatedMetadata
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update file');
        }

        return response.json();
      });

      await Promise.all(fileUpdates);
      await loadCollectionStructure();
      setRenamingGroup(null);
    } catch (error) {
      console.error('Error renaming group:', error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupMenuAnchor?.group || !selectedCollectionId) return;
    
    const group = groupMenuAnchor.group;
    const filesToDelete = [
      group.files.question,
      group.files.answer,
      group.files.markingScheme
    ].filter(Boolean);

    for (const fileId of filesToDelete) {
      if (fileId) {
        await deleteFile(fileId);
      }
    }

    await loadCollectionStructure();
    handleGroupMenuClose();
  };

  const questionGroups = selectedCollectionId 
    ? groupFilesByQuestion(collections.flatMap(c => 
        c.id === selectedCollectionId ? c.files : []
      ))
    : [];

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: isOpen ? drawerWidth : theme.spacing(7),
          flexShrink: 0,
          position: 'relative',
          '& .MuiDrawer-paper': {
            width: isOpen ? drawerWidth : theme.spacing(7),
            boxSizing: 'border-box',
            position: 'static',
            height: '100%',
            backgroundColor: theme.palette.background.sidebar,
            display: 'flex',
            flexDirection: 'column',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: isOpen ? 'flex-end' : 'center',
          p: 1,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <IconButton onClick={() => setIsOpen(!isOpen)}>
            <MenuIcon />
          </IconButton>
        </Box>

        {isOpen && (
          <List sx={{ overflowY: 'auto', flexGrow: 1 }} ref={sidebarRef}>
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              p: 1.5,
            }}>
              <FormControl fullWidth size="small">
                <InputLabel>Collection</InputLabel>
                <Select
                  value={selectedCollectionId || ''}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  label="Collection"
                >
                  {collections.map((collection) => (
                    <MenuItem key={collection.id} value={collection.id}>
                      {collection.name}
                    </MenuItem>
                  ))}
                  <MenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddingItem({ type: 'collection', parentId: null });
                    }}
                    sx={{ 
                      color: 'primary.main',
                      borderTop: 1,
                      borderColor: 'divider'
                    }}
                  >
                    <Add fontSize="small" sx={{ mr: 1 }} />
                    New Collection
                  </MenuItem>
                </Select>
              </FormControl>
              {selectedCollectionId && (
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, selectedCollectionId, 'collection', null)}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              )}
            </Box>
            
            {selectedCollectionId && (
              <>
                {groupFilesByQuestion(collections.find(c => c.id === selectedCollectionId)?.files || []).map((group) => (
                  <Box 
                    key={group.label} 
                    sx={{ 
                      mb: 1,
                      borderLeft: 2,
                      borderColor: 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                      }
                    }}
                  >
                    <ListItemButton
                      onClick={() => toggleGroup(group.label)}
                      sx={{
                        pl: 2,
                        py: 0.5,
                        borderBottom: 1,
                        borderColor: 'divider',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.02)',
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark'
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                    >
                      <ListItemIcon>
                        {collapsedGroups.has(group.label) ? <ExpandMore /> : <ExpandLess />}
                      </ListItemIcon>
                      <ListItemText
                        primary={group.label}
                        primaryTypographyProps={{
                          variant: 'subtitle2',
                          fontWeight: 600,
                          color: 'text.primary'
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleGroupMenuOpen(e, group)}
                      >
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                    
                    {!collapsedGroups.has(group.label) && (
                      <>
                        {group.files.question && (
                          <ListItemButton
                            sx={{
                              pl: 3,
                              py: 0.5,
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark'
                                  ? 'rgba(33, 150, 243, 0.08)'
                                  : 'rgba(33, 150, 243, 0.04)',
                              },
                              ...(activeItem?.id === group.files.question && {
                                backgroundColor: theme.palette.mode === 'dark'
                                  ? 'rgba(33, 150, 243, 0.16)'
                                  : 'rgba(33, 150, 243, 0.08)',
                              })
                            }}
                            onClick={() => isSelectionMode
                              ? handleFileSelection({ id: group.files.question!, name: generateFileName(group.metadata.questionNumbering!, 'question') }, selectedCollectionId)
                              : handleItemClick(group.files.question!, 'file')
                            }
                            selected={activeItem?.id === group.files.question}
                          >
                            <ListItemIcon>
                              <Description sx={{ color: FILE_TYPE_COLORS.question }} fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Question"
                              primaryTypographyProps={{ 
                                variant: 'body2',
                                color: 'text.primary'
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, group.files.question!, 'file', selectedCollectionId)}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </ListItemButton>
                        )}

                        {group.files.answer && (
                          <ListItemButton
                            sx={{
                              pl: 3,
                              py: 0.5,
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark'
                                  ? 'rgba(76, 175, 80, 0.08)'
                                  : 'rgba(76, 175, 80, 0.04)',
                              },
                              ...(activeItem?.id === group.files.answer && {
                                backgroundColor: theme.palette.mode === 'dark'
                                  ? 'rgba(76, 175, 80, 0.16)'
                                  : 'rgba(76, 175, 80, 0.08)',
                              })
                            }}
                            onClick={() => isSelectionMode
                              ? handleFileSelection({ id: group.files.answer!, name: generateFileName(group.metadata.questionNumbering!, 'answer') }, selectedCollectionId)
                              : handleItemClick(group.files.answer!, 'file')
                            }
                            selected={activeItem?.id === group.files.answer}
                          >
                            <ListItemIcon>
                              <QuestionAnswer sx={{ color: FILE_TYPE_COLORS.answer }} fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Answer"
                              primaryTypographyProps={{ 
                                variant: 'body2',
                                color: 'text.primary'
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, group.files.answer!, 'file', selectedCollectionId)}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </ListItemButton>
                        )}

                        {group.files.markingScheme && (
                          <ListItemButton
                            sx={{
                              pl: 3,
                              py: 0.5,
                              '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark'
                                  ? 'rgba(255, 152, 0, 0.08)'
                                  : 'rgba(255, 152, 0, 0.04)',
                              },
                              ...(activeItem?.id === group.files.markingScheme && {
                                backgroundColor: theme.palette.mode === 'dark'
                                  ? 'rgba(255, 152, 0, 0.16)'
                                  : 'rgba(255, 152, 0, 0.08)',
                              })
                            }}
                            onClick={() => isSelectionMode
                              ? handleFileSelection({ id: group.files.markingScheme!, name: generateFileName(group.metadata.questionNumbering!, 'marking_scheme') }, selectedCollectionId)
                              : handleItemClick(group.files.markingScheme!, 'file')
                            }
                            selected={activeItem?.id === group.files.markingScheme}
                          >
                            <ListItemIcon>
                              <Assignment sx={{ color: FILE_TYPE_COLORS.marking }} fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary="Marking Scheme"
                              primaryTypographyProps={{ 
                                variant: 'body2',
                                color: 'text.primary'
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, group.files.markingScheme!, 'file', selectedCollectionId)}
                            >
                              <MoreVert fontSize="small" />
                            </IconButton>
                          </ListItemButton>
                        )}
                      </>
                    )}
                  </Box>
                ))}

                {/* Group actions menu */}
                <Menu
                  anchorEl={groupMenuAnchor?.element}
                  open={Boolean(groupMenuAnchor)}
                  onClose={handleGroupMenuClose}
                >
                  <MenuItem onClick={handleRenameGroup}>
                    <ListItemIcon>
                      <Edit fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Change Question Number" />
                  </MenuItem>
                  <MenuItem 
                    onClick={handleDeleteGroup}
                    sx={{ color: 'error.main' }}
                  >
                    <ListItemIcon>
                      <Delete fontSize="small" sx={{ color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText primary="Delete Question" />
                  </MenuItem>
                </Menu>

                {/* Add Question button */}
                <ListItemButton 
                  onClick={() => setIsAddQuestionDialogOpen(true)}
                  sx={{ pl: 3 }}
                >
                  <ListItemIcon>
                    <Add fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Add Question" 
                    primaryTypographyProps={{ variant: 'body2' }} 
                  />
                </ListItemButton>

                <AddQuestionDialog
                  open={isAddQuestionDialogOpen}
                  onClose={() => setIsAddQuestionDialogOpen(false)}
                  onAdd={handleAddQuestion}
                />
              </>
            )}

            {/* Add new item dialog */}
            {addingItem && (
              <ListItem sx={{ pl: 3 }}>
                <TextField
                  size="small"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      if (addingItem.type === 'collection') {
                        addItem('collection', null);
                      } else {
                        addItem('file', selectedCollectionId);
                      }
                    }
                  }}
                  placeholder={`New ${addingItem.type} name`}
                  autoFocus
                />
                <Button 
                  size="small" 
                  onClick={() => addItem(
                    addingItem.type as 'collection' | 'file',
                    addingItem.type === 'collection' ? null : selectedCollectionId
                  )}
                >
                  Add
                </Button>
              </ListItem>
            )}
          </List>
        )}

        {isOpen && (
          <Box sx={{ 
            borderTop: 1, 
            borderColor: 'divider',
            p: 1,
            gap: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <MergeFilesButton 
              onRefresh={loadCollectionStructure} 
              onNewCollection={handleNewCollection}
              selectedCollectionId={selectedCollectionId}
              groups={questionGroups}
            />
            <TransferToExamButton 
              selectedCollectionId={selectedCollectionId}
            />
          </Box>
        )}
        
        {isOpen && <ResizeHandle onResize={handleResize} initialWidth={drawerWidth} />}
      </Drawer>

      {/* Menus and dialogs remain the same */}
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={menuPosition ?? undefined}
        open={Boolean(menuPosition)}
        onClose={handleMenuClose}
      >
        {selectedItem?.type === 'collection' && (
          <MenuItem onClick={startRenaming}>Rename Collection</MenuItem>
        )}
        {selectedItem?.type === 'file' && (
          <MenuItem onClick={startRenaming}>Rename File</MenuItem>
        )}
        <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
      </Menu>
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        itemName={itemToDelete?.name || ""}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      {/* Add renaming dialog */}
      <Dialog 
        open={Boolean(renamingGroup)} 
        onClose={() => setRenamingGroup(null)}
      >
        <DialogTitle>Change Question Number</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Main Question Number"
              type="number"
              value={newQuestionNumbering.mainNumber}
              onChange={(e) => setNewQuestionNumbering(prev => ({
                ...prev,
                mainNumber: parseInt(e.target.value) || 1
              }))}
              fullWidth
            />
            <TextField
              label="Sub-Question Letter (optional)"
              value={newQuestionNumbering.subQuestion || ''}
              onChange={(e) => setNewQuestionNumbering(prev => ({
                ...prev,
                subQuestion: e.target.value.toLowerCase()
              }))}
              placeholder="e.g. a, b, c"
              fullWidth
            />
            <TextField
              label="Sub-Sub-Question Letter (optional)"
              value={newQuestionNumbering.subSubQuestion || ''}
              onChange={(e) => setNewQuestionNumbering(prev => ({
                ...prev,
                subSubQuestion: e.target.value.toLowerCase()
              }))}
              placeholder="e.g. i, ii, iii"
              fullWidth
            />
            <Typography variant="body2" color="textSecondary">
              Preview: {generateQuestionLabel(newQuestionNumbering)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenamingGroup(null)}>Cancel</Button>
          <Button onClick={handleSaveGroupRename} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar;