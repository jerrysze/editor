import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  Typography,
  Box,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Code as CodeIcon,
  Description as DescriptionIcon,
  QuestionMark as QuestionIcon,
  Assignment as AssignmentIcon,
  Grading as GradingIcon,
} from '@mui/icons-material';

interface MetadataDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (metadata: FileMetadata) => void;
  fileName: string | null;
  initialMetadata?: FileMetadata;
}

export interface FileMetadata {
  format: 'latex' | 'markdown';
  score: number;
  documentType: 'question' | 'answer' | 'marking_scheme';
}

const buttonGroupStyles = {
  '& .MuiToggleButton-root': {
    py: 0.75,
    px: 2,
    textTransform: 'none',
    fontSize: '0.875rem',
    '&.Mui-selected': {
      backgroundColor: 'primary.main',
      color: 'white',
      '&:hover': {
        backgroundColor: 'primary.dark',
        color: 'white',
      },
    },
  },
};

export default function MetadataDialog({ 
  open, 
  onClose, 
  onSave, 
  fileName,
  initialMetadata 
}: MetadataDialogProps) {
  
  const [metadata, setMetadata] = useState<FileMetadata>(initialMetadata || {
    format: 'latex',
    score: 0,
    documentType: 'question'
  });

  useEffect(() => {
    if (initialMetadata) {
      setMetadata(initialMetadata);
    }
  }, [initialMetadata]);

  const handleSave = () => {
    onSave(metadata);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '1px solid #e0e0e0',
        pb: 2
      }}>
        Edit File Metadata
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            File: {fileName || 'Untitled'}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <Typography variant="subtitle2" gutterBottom>
              Format
            </Typography>
            <ToggleButtonGroup
              value={metadata.format}
              exclusive
              onChange={(_, value) => value && setMetadata({ 
                ...metadata, 
                format: value as 'latex' | 'markdown' 
              })}
              fullWidth
              size="small"
              sx={buttonGroupStyles}
            >
              <ToggleButton value="latex">
                <CodeIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                LaTeX
              </ToggleButton>
              <ToggleButton value="markdown">
                <DescriptionIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Markdown
              </ToggleButton>
            </ToggleButtonGroup>
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <Typography variant="subtitle2" gutterBottom>
              Document Type
            </Typography>
            <ToggleButtonGroup
              value={metadata.documentType}
              exclusive
              onChange={(_, value) => value && setMetadata({
                ...metadata,
                documentType: value as 'question' | 'answer' | 'marking_scheme'
              })}
              fullWidth
              size="small"
              sx={buttonGroupStyles}
            >
              <ToggleButton value="question">
                <QuestionIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Question Paper
              </ToggleButton>
              <ToggleButton value="answer">
                <AssignmentIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Answer
              </ToggleButton>
              <ToggleButton value="marking_scheme">
                <GradingIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Marking Scheme
              </ToggleButton>
            </ToggleButtonGroup>
          </FormControl>
        </Box>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Score"
            type="number"
            value={metadata.score}
            onChange={(e) => setMetadata({ 
              ...metadata, 
              score: parseInt(e.target.value) || 0 
            })}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        borderTop: '1px solid #e0e0e0',
        p: 2
      }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
} 