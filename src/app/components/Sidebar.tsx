import React, { useState, useEffect, useRef } from 'react';
import { Drawer, List, ListItem, Typography, IconButton, Menu, MenuItem, useTheme, Button } from '@mui/material';
import { ExpandMore, KeyboardArrowRight, FolderSpecial, PersonAdd } from '@mui/icons-material';
import SearchBar from './SearchBar';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import TemplatesList from './TemplatesList';
import CollectionsList from './CollectionsList';

const drawerWidth = 240;

export interface File {
  id: string;
  name: string;
}

export interface Collection {
  id: string;
  name: string;
  files: File[];
  collections: Collection[];
  isOpen?: boolean;
}

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

  const addItem = (type: 'collection' | 'file', parentId: string | null) => {
    if (newItemName.trim()) {
      const newItem = { id: Date.now().toString(), name: newItemName };
      if (parentId === null) {
        if (type === 'collection') {
          setCollections(prevCollections => [...prevCollections, { ...newItem, files: [], collections: [], isOpen: true }].sort((a, b) => a.name.localeCompare(b.name)));
        }
      } else {
        setCollections(prevCollections => updateCollections(prevCollections, parentId, type, newItem));
      }
      setNewItemName('');
      setAddingItem(null);
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

  const renameItem = () => {
    if (renamingItem && newItemName.trim()) {
      if (renamingItem.type === 'template') {
        setTemplates(prevTemplates =>
          prevTemplates.map(template =>
            template.id === renamingItem.id ? { ...template, name: newItemName } : template
          ).sort((a, b) => a.name.localeCompare(b.name))
        );
      } else {
        setCollections(renameItemInCollections(collections, renamingItem.id, renamingItem.type, newItemName));
      }
      setNewItemName('');
      setRenamingItem(null);
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

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'template') {
        deleteTemplate(itemToDelete.id);
      } else {
        setCollections(deleteItemFromCollections(collections, itemToDelete.id, itemToDelete.type, itemToDelete.parentId));
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
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
    console.log(`Clicked on ${type} with id: ${id}`);
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

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            position: 'static',
            height: '100%',
            backgroundColor: theme.palette.background.sidebar,
            display: 'flex',
            flexDirection: 'column',
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
            />
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
        <ListItem sx={{ justifyContent: 'center', borderTop: 1, borderColor: 'divider' }}>
          <Button
            startIcon={<PersonAdd />}
            onClick={handleInvitePeople}
            fullWidth
            variant="outlined"
            sx={{ mt: 1, mb: 1 }}
          >
            Invite People
          </Button>
        </ListItem>
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