import React from 'react';
import { Box, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import SaveIcon from '@mui/icons-material/Save';
import ShareIcon from '@mui/icons-material/Share';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import EditIcon from '@mui/icons-material/Edit';

interface EditorToolbarProps {
  showPreview: boolean;
  isPdfLoading: boolean;
  isSelectionMode: boolean;
  onSave: () => void;
  onShare: () => void;
  onTogglePreview: () => void;
  onInsertClick: () => void;
  onMetadataOpen: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  showPreview,
  isPdfLoading,
  isSelectionMode,
  onSave,
  onShare,
  onTogglePreview,
  onInsertClick,
  onMetadataOpen,
}) => {
  return (
    <Box sx={{ 
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      ml: 1.5,
    }}>
      {/* Save button - Most important action first */}
      <Tooltip title="Save">
        <IconButton 
          onClick={onSave}
          size="small"
          sx={{ ml: 0.5 }}
        >
          <SaveIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Preview toggle - Second most important for editing */}
      <Tooltip title={showPreview ? "Hide Preview" : "Show Preview"}>
        <IconButton 
          onClick={onTogglePreview} 
          size="small"
          sx={{ ml: 0.5 }}
        >
          {showPreview ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
        </IconButton>
      </Tooltip>

      {/* Insert file - Content manipulation */}
      <Tooltip title={isSelectionMode ? "Cancel Insert" : "Insert File Content"}>
        <IconButton 
          onClick={onInsertClick}
          color={isSelectionMode ? "primary" : "default"}
          size="small"
          sx={{ ml: 0.5 }}
          data-insert-mode="true"
          data-active={isSelectionMode}
        >
          <InsertDriveFileIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Metadata editing */}
      <Tooltip title="Edit Metadata">
        <IconButton 
          onClick={onMetadataOpen}
          size="small"
          sx={{ ml: 0.5 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Share/Export - Last as it's an output action */}
      <Tooltip title={isPdfLoading ? "Generating PDF..." : "Share as PDF"}>
        <IconButton 
          onClick={onShare} 
          size="small"
          sx={{ ml: 0.5 }}
          disabled={isPdfLoading}
        >
          {isPdfLoading ? (
            <CircularProgress size={20} />
          ) : (
            <ShareIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default EditorToolbar; 