import React, { useState, useContext } from 'react';
import { ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, TextField, Button, Box } from '@mui/material';
import { MoreVert, Folder, InsertDriveFile, Add, KeyboardArrowRight, ExpandMore } from '@mui/icons-material';
import { Collection, File } from '@/app/types';
import { sortByName } from './Sidebar';
import { ActiveFileContext } from '../contexts/ActiveFileContext';
import { Checkbox } from '@mui/material';

interface CollectionsListProps {
  collections: Collection[];
  filteredCollections: Collection[];
  searchTerm: string;
  activeItem: { id: string, type: 'collection' | 'file' | 'template' } | null;
  addingItem: { type: 'collection' | 'file' | 'template', parentId: string | null } | null;
  renamingItem: { id: string, type: 'collection' | 'file' | 'template', parentId: string | null } | null;
  newItemName: string;
  handleItemClick: (id: string, type: 'collection' | 'file' | 'template') => void;
  handleMenuOpen: (event: React.MouseEvent<HTMLButtonElement>, id: string, type: 'collection' | 'file' | 'template', parentId: string | null) => void;
  toggleCollection: (id: string) => void;
  setAddingItem: React.Dispatch<React.SetStateAction<{ type: 'collection' | 'file' | 'template', parentId: string | null } | null>>;
  setNewItemName: React.Dispatch<React.SetStateAction<string>>;
  addItem: (type: 'collection' | 'file', parentId: string | null) => void;
  renameItem: () => void;
  highlightedCollection: string | null;
}

const CollectionsList: React.FC<CollectionsListProps> = ({
  filteredCollections,
  searchTerm,
  activeItem,
  addingItem,
  renamingItem,
  newItemName,
  handleItemClick,
  handleMenuOpen,
  toggleCollection,
  setAddingItem,
  setNewItemName,
  addItem,
  renameItem,
  highlightedCollection,
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { 
    isSelectionMode, 
    selectedFiles, 
    setSelectedFiles,
    setSelectionMode,
    selectionType 
  } = useContext(ActiveFileContext);

  const handleFileSelection = (
    file: { id: string, name: string },
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

  const renderCollectionItems = (collection: Collection, depth = 0) => (
    <React.Fragment key={collection.id}>
      <ListItemButton
        onClick={() => handleItemClick(collection.id, 'collection')}
        selected={activeItem?.id === collection.id && activeItem?.type === 'collection'}
        sx={{
          pl: 2 + depth * 2,
          backgroundColor: highlightedCollection === collection.id ? 
            'rgba(25, 118, 210, 0.12)' : 'transparent',
          transition: 'background-color 0.3s ease',
          '&:hover': {
            backgroundColor: highlightedCollection === collection.id ? 
              'rgba(25, 118, 210, 0.18)' : undefined,
          },
        }}
        onMouseEnter={() => setHoveredItem(collection.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <ListItemIcon onClick={(e) => {
          e.stopPropagation();
          toggleCollection(collection.id);
        }}>
          {collection.isOpen ? <ExpandMore fontSize="small" /> : <KeyboardArrowRight fontSize="small" />}
        </ListItemIcon>
        <ListItemIcon>
          <Folder fontSize="small" />
        </ListItemIcon>
        <ListItemText primary={collection.name} primaryTypographyProps={{ variant: 'body2' }} />
        {hoveredItem === collection.id && (
          <IconButton
            edge="end"
            size="small"
            onClick={(e) => handleMenuOpen(e, collection.id, 'collection', depth === 0 ? null : collection.id)}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        )}
      </ListItemButton>
      {collection.isOpen && (
        <>
          {sortByName(collection.files).map((file) => (
            <React.Fragment key={file.id}>
              <ListItemButton
                onClick={() => isSelectionMode 
                  ? handleFileSelection(file, collection.id)
                  : handleItemClick(file.id, 'file')
                }
                selected={activeItem?.id === file.id && activeItem?.type === 'file'}
                sx={{ pl: 6 + depth * 2 }}
                onMouseEnter={() => setHoveredItem(file.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {isSelectionMode && (
                  <ListItemIcon>
                    <Checkbox
                      checked={selectedFiles.some(f => f.fileId === file.id)}
                      onChange={(e) => handleFileSelection(file, collection.id, e)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </ListItemIcon>
                )}
                <ListItemIcon>
                  <InsertDriveFile fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                      {file.name}
                      {selectedFiles.some(f => f.fileId === file.id) && (
                        <Box
                          component="span"
                          sx={{
                            marginLeft: 1,
                            color: 'primary.main',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}
                        >
                          ({selectedFiles.find(f => f.fileId === file.id)?.selectionOrder})
                        </Box>
                      )}
                    </Box>
                  }
                  primaryTypographyProps={{ variant: 'body2' }} 
                />
                {hoveredItem === file.id && (
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleMenuOpen(e, file.id, 'file', collection.id)}
                  >
                    <MoreVert fontSize="small" />
                  </IconButton>
                )}
              </ListItemButton>
              {(addingItem?.parentId === file.id || renamingItem?.id === file.id) && (
                <ListItem sx={{ pl: 6 + depth * 2 }}>
                  <TextField
                    size="small"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        if (addingItem && ['collection', 'file'].includes(addingItem.type)) addItem(addingItem.type as "collection" | "file", addingItem.parentId);
                        if (renamingItem) renameItem();
                      }
                    }}
                    placeholder={renamingItem ? "New name" : `New ${addingItem?.type} name`}
                    autoFocus
                  />
                  <Button size="small" onClick={renamingItem ? renameItem : () => addItem(addingItem!.type as "collection" | "file", addingItem!.parentId as string)}>
                    {renamingItem ? 'Rename' : 'Add'}
                  </Button>
                </ListItem>
              )}
            </React.Fragment>
          ))}
          {sortByName(collection.collections).map(subCollection => renderCollectionItems(subCollection, depth + 1))}
          {(addingItem?.parentId === collection.id || renamingItem?.id === collection.id) && (
            <ListItem sx={{ pl: 2 + (depth + 1) * 2 }}>
              <TextField
                size="small"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (addingItem && ['collection', 'file'].includes(addingItem.type)) addItem(addingItem.type as "collection" | "file", addingItem.parentId);
                    if (renamingItem) renameItem();
                  }
                }}
                placeholder={renamingItem ? "New name" : `New ${addingItem?.type} name`}
                autoFocus
              />
              <Button size="small" onClick={renamingItem ? renameItem : () => addItem(addingItem!.type as "collection" | "file", addingItem!.parentId)}>
                {renamingItem ? 'Rename' : 'Add'}
              </Button>
            </ListItem>
          )}
        </>
      )}
    </React.Fragment>
  );

  return (
    <>
      {sortByName(filteredCollections).map(collection => renderCollectionItems(collection))}
      {!searchTerm && (
        <ListItemButton onClick={() => setAddingItem({ type: 'collection', parentId: null })}>
          <ListItemIcon>
            <Add fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="New Collection" primaryTypographyProps={{ variant: 'body2' }} />
        </ListItemButton>
      )}
      {addingItem?.parentId === null && addingItem.type === 'collection' && (
        <ListItem>
          <TextField
            size="small"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addItem('collection', null);
              }
            }}
            placeholder="New collection name"
            autoFocus
          />
          <Button size="small" onClick={() => addItem('collection', null)}>
            Add
          </Button>
        </ListItem>
      )}
    </>
  );
};

export default CollectionsList;