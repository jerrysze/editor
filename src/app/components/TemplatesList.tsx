import React, { useState } from 'react';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, IconButton, TextField, Button, Menu, MenuItem, useTheme } from '@mui/material';
import { MoreVert, Description, Add, ExpandMore, KeyboardArrowRight } from '@mui/icons-material';

interface Template {
  id: string;
  name: string;
}

interface TemplatesListProps {
  templates: Template[];
  setTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  activeItem: { id: string; type: 'collection' | 'file' | 'template' } | null;
  setActiveItem: React.Dispatch<React.SetStateAction<{ id: string; type: 'collection' | 'file' | 'template' } | null>>;
  templatesVisible: boolean;
  setTemplatesVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

const sortByName = <T extends { name: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
};

const TemplatesList: React.FC<TemplatesListProps> = ({ 
  templates, 
  setTemplates, 
  activeItem, 
  setActiveItem,
  templatesVisible,
  setTemplatesVisible
}) => {
  const theme = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'template' } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [addingItem, setAddingItem] = useState<{ type: 'template'; parentId: null } | null>(null);
  const [renamingItem, setRenamingItem] = useState<{ id: string; type: 'template' } | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom,
      left: rect.right,
    });
    setSelectedItem({ id, type: 'template' });
  };

  const handleMenuClose = () => {
    setMenuPosition(null);
    setSelectedItem(null);
  };

  const handleItemClick = (id: string) => {
    setActiveItem({ id, type: 'template' });
    console.log(`Clicked on template with id: ${id}`);
  };

  const addTemplate = () => {
    if (newItemName.trim()) {
      const newTemplate = { id: Date.now().toString(), name: newItemName };
      setTemplates(prevTemplates => [...prevTemplates, newTemplate].sort((a, b) => a.name.localeCompare(b.name)));
      setNewItemName('');
      setAddingItem(null);
    }
  };

  const startRenaming = () => {
    if (selectedItem) {
      setRenamingItem(selectedItem);
      setNewItemName(templates.find(t => t.id === selectedItem.id)?.name || '');
      handleMenuClose();
    }
  };

  const renameItem = () => {
    if (renamingItem && newItemName.trim()) {
      setTemplates(prevTemplates =>
        prevTemplates.map(template =>
          template.id === renamingItem.id ? { ...template, name: newItemName } : template
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewItemName('');
      setRenamingItem(null);
    }
  };

  const handleDeleteClick = () => {
    if (selectedItem) {
      setTemplates(prevTemplates => prevTemplates.filter(template => template.id !== selectedItem.id));
    }
    handleMenuClose();
  };

  return (
    <>
      <ListItem>
        <IconButton onClick={() => setTemplatesVisible(!templatesVisible)} size="small">
          {templatesVisible ? <ExpandMore fontSize="small" /> : <KeyboardArrowRight fontSize="small" />}
        </IconButton>
        <Description fontSize="small" sx={{ mr: 1, color: theme.palette.warning.main }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>TEMPLATES</Typography>
      </ListItem>
      {templatesVisible && (
        <List>
          {sortByName(templates).map(template => (
            <ListItemButton
              key={template.id}
              onClick={() => handleItemClick(template.id)}
              selected={activeItem?.id === template.id && activeItem?.type === 'template'}
              sx={{ pl: 4 }}
              onMouseEnter={() => setHoveredItem(template.id)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <ListItemIcon>
                <Description fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={template.name} primaryTypographyProps={{ variant: 'body2' }} />
              {hoveredItem === template.id && (
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(e) => handleMenuOpen(e, template.id)}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              )}
            </ListItemButton>
          ))}
          {renamingItem?.type === 'template' && (
            <ListItem sx={{ pl: 4 }}>
              <TextField
                size="small"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    renameItem();
                  }
                }}
                placeholder="New name"
                autoFocus
              />
              <Button size="small" onClick={renameItem}>
                Rename
              </Button>
            </ListItem>
          )}
          <ListItemButton onClick={() => setAddingItem({ type: 'template', parentId: null })}>
            <ListItemIcon>
              <Add fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="New Template" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItemButton>
          {addingItem?.type === 'template' && (
            <ListItem>
              <TextField
                size="small"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addTemplate();
                  }
                }}
                placeholder="New template name"
                autoFocus
              />
              <Button size="small" onClick={addTemplate}>
                Add
              </Button>
            </ListItem>
          )}
        </List>
      )}
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={menuPosition ?? undefined}
        open={Boolean(menuPosition)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={startRenaming}>Rename</MenuItem>
        <MenuItem onClick={handleDeleteClick}>Delete</MenuItem>
      </Menu>
    </>
  );
};

export default TemplatesList;