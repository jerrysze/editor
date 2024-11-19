import React, { useState, useEffect, useRef, useContext } from 'react';
import { Drawer, List, ListItem, Typography, IconButton, Menu, MenuItem, useTheme, Button, Box } from '@mui/material';
import { ExpandMore, KeyboardArrowRight, FolderSpecial, PersonAdd } from '@mui/icons-material';
import SearchBar from './SearchBar';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import TemplatesList from './TemplatesList';
import CollectionsList from './CollectionsList';
import { ActiveFileContext } from '../contexts/ActiveFileContext';
import { getCollectionStructure, saveCollectionStructure, deleteFile, deleteCollection, renameCollection } from '@/app/api';
import { Collection, File } from '@/app/types';
import MergeFilesButton from './MergeFilesButton';
import ResizeHandle from './ResizeHandle';

const MIN_DRAWER_WIDTH = 200;
const MAX_DRAWER_WIDTH = 600;
const DEFAULT_DRAWER_WIDTH = 240;

export interface Template {
  id: string;
  name: string;
}

export const sortByName = <T extends { name: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
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
  const { setActiveFile } = useContext(ActiveFileContext);
  const [drawerWidth, setDrawerWidth] = useState(DEFAULT_DRAWER_WIDTH);
  const [highlightedCollection, setHighlightedCollection] = useState<string | null>(null);

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

  const addItem = async (type: 'collection' | 'file', parentId: string | null) => {
    if (newItemName.trim()) {
      const newItem = { id: Date.now().toString(), name: newItemName };
      let updatedCollections: Collection[];
      if (parentId === null) {
        if (type === 'collection') {
          updatedCollections = [...collections, { ...newItem, files: [], collections: [], isOpen: true }];
        } else {
          console.error("Cannot add a file without a parent collection");
          return;
        }
      } else {
        updatedCollections = updateCollections(collections, parentId, type, newItem);
      }
      updatedCollections.sort((a, b) => a.name.localeCompare(b.name));
      setCollections(updatedCollections);
      setNewItemName('');
      setAddingItem(null);

      // Save the updated structure
      try {
        await saveCollectionStructure(updatedCollections);
        console.log("Collection structure saved successfully");
      } catch (error) {
        console.error("Failed to save collection structure:", error);
        // Optionally, you can add some user feedback here
      }
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
          // Delete single file
          await deleteFile(itemToDelete.id);
          setCollections(deleteItemFromCollections(collections, itemToDelete.id, itemToDelete.type, itemToDelete.parentId));
        } else if (itemToDelete.type === 'collection') {
          // Find the collection to delete
          const collectionToDelete = findCollectionById(collections, itemToDelete.id);
          if (collectionToDelete) {
            try {
              // First delete all files in the collection and its subcollections
              await deleteAllFilesInCollection(collectionToDelete);
              
              // Then delete the collection itself
              await deleteCollection(itemToDelete.id);
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
        // Optionally show an error message to the user
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

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          position: 'relative',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            position: 'static',
            height: '100%',
            backgroundColor: theme.palette.background.sidebar,
            display: 'flex',
            flexDirection: 'column',
            transition: 'none', // Remove transition for smooth resizing
          },
        }}
      >
        <List sx={{ overflowY: 'auto', flexGrow: 1 }} ref={sidebarRef}>
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
          <ListItem>
            <IconButton onClick={() => setCollectionsVisible(!collectionsVisible)} size="small">
              {collectionsVisible ? <ExpandMore fontSize="small" /> : <KeyboardArrowRight fontSize="small" />}
            </IconButton>
            <FolderSpecial fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
            <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>COLLECTIONS</Typography>
          </ListItem>
          {collectionsVisible && (
            <>
              {collections.length > 0 ? (
                <CollectionsList
                  collections={collections}
                  filteredCollections={filteredCollections}
                  searchTerm={searchTerm}
                  activeItem={activeItem}
                  addingItem={addingItem}
                  renamingItem={renamingItem}
                  newItemName={newItemName}
                  handleItemClick={handleItemClick}
                  handleMenuOpen={handleMenuOpen}
                  toggleCollection={toggleCollection}
                  setAddingItem={setAddingItem}
                  setNewItemName={setNewItemName}
                  addItem={addItem}
                  renameItem={renameItem}
                  highlightedCollection={highlightedCollection}
                />
              ) : (
                <ListItem>
                  <Typography variant="body2">No collections found</Typography>
                </ListItem>
              )}
            </>
          )}
          <TemplatesList
            templates={templates}
            setTemplates={setTemplates}
            activeItem={activeItem}
            setActiveItem={setActiveItem}
            templatesVisible={templatesVisible}
            setTemplatesVisible={setTemplatesVisible}
          />
        </List>
        <Box sx={{ 
          borderTop: 1, 
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 1,
          gap: 1,
          width: '100%'
        }}>
          <Box sx={{ width: '100%' }}>
            <MergeFilesButton 
              onRefresh={loadCollectionStructure} 
              onNewCollection={handleNewCollection}
            />
          </Box>
          <Button
            startIcon={<PersonAdd />}
            onClick={handleInvitePeople}
            fullWidth
            variant="outlined"
          >
            Invite People
          </Button>
        </Box>
        <ResizeHandle onResize={handleResize} initialWidth={drawerWidth} />
      </Drawer>
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={menuPosition ?? undefined}
        open={Boolean(menuPosition)}
        onClose={handleMenuClose}
      >
        {selectedItem?.type === 'collection' && (
          <>
            <MenuItem onClick={() => {
              setAddingItem({ type: 'file', parentId: selectedItem?.id ?? null });
              handleMenuClose();
            }}>
              Add File
            </MenuItem>
            <MenuItem onClick={() => {
              setAddingItem({ type: 'collection', parentId: selectedItem?.id ?? null });
              handleMenuClose();
            }}>
              Add Subcollection
            </MenuItem>
          </>
        )}
        <MenuItem onClick={startRenaming}>Rename</MenuItem>
        <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
      </Menu>
      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        itemName={itemToDelete?.name || ""}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
};

export default Sidebar;