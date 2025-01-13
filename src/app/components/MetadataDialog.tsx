import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Grid,
  Typography
} from '@mui/material';
import { FileMetadata, QuestionNumbering } from '../types/metadata';

interface MetadataDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (metadata: FileMetadata) => void;
  initialMetadata?: FileMetadata;
  fileName?: string;
}

const defaultMetadata: FileMetadata = {
  documentType: 'question',
  format: 'markdown',
  score: 1,
  questionLabel: '',
};

const MetadataDialog: React.FC<MetadataDialogProps> = ({
  open,
  onClose,
  onSave,
  initialMetadata,
  fileName
}) => {
  const [metadata, setMetadata] = useState<FileMetadata>(initialMetadata || defaultMetadata);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editorMode, setEditorMode] = useState<FileMetadata['format']>('markdown');
  const [questionNumbering, setQuestionNumbering] = useState<QuestionNumbering>({
    mainNumber: 1,
  });

  const generateQuestionLabel = (numbering: QuestionNumbering): string => {
    let label = `Question ${numbering.mainNumber}`;
    if (numbering.subQuestion) {
      label += `-${numbering.subQuestion}`;
    }
    if (numbering.subSubQuestion) {
      label += `-${numbering.subSubQuestion}`;
    }
    return label;
  };

  useEffect(() => {
    if (initialMetadata) {
      setMetadata(initialMetadata);
      setEditorMode(initialMetadata.format || 'markdown');
      if (initialMetadata.questionNumbering) {
        setQuestionNumbering(initialMetadata.questionNumbering);
      }
    } else {
      setMetadata(defaultMetadata);
      setEditorMode('markdown');
    }
  }, [initialMetadata, open]);

  useEffect(() => {
    setMetadata(prev => ({
      ...prev,
      questionLabel: generateQuestionLabel(questionNumbering)
    }));
  }, [questionNumbering]);

  const validateMetadata = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!metadata.questionLabel.trim()) {
      newErrors.questionLabel = 'Question label is required';
    }
    
    // Always ensure there's a valid score
    if (typeof metadata.score !== 'number' || metadata.score <= 0) {
      if (metadata.documentType === 'question') {
        newErrors.score = 'Score must be greater than 0';
      } else {
        // For non-question types, set a default score of 1 if invalid
        setMetadata(prev => ({ ...prev, score: 1 }));
      }
    }
    
    if (!metadata.documentType) {
      newErrors.documentType = 'Document type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateMetadata()) {
      const finalScore = typeof metadata.score === 'number' && metadata.score > 0 
        ? metadata.score 
        : 1;

      const updatedMetadata: FileMetadata = {
        ...metadata,
        score: finalScore,
        format: editorMode,
        questionNumbering,
      };
      
      await onSave(updatedMetadata);
      onClose();
    }
  };

  const handleScoreChange = (value: string) => {
    const numberValue = Number(value);
    setMetadata(prev => ({
      ...prev,
      score: isNaN(numberValue) ? 1 : Math.max(1, numberValue)
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {fileName ? `Edit Metadata: ${fileName}` : 'New Question Document'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <FormControl fullWidth error={!!errors.documentType}>
            <InputLabel>Document Type</InputLabel>
            <Select
              value={metadata.documentType}
              label="Document Type"
              onChange={(e) => setMetadata(prev => ({
                ...prev,
                documentType: e.target.value as FileMetadata['documentType']
              }))}
            >
              <MenuItem value="question">Question</MenuItem>
              <MenuItem value="answer">Answer</MenuItem>
              <MenuItem value="marking_scheme">Marking Scheme</MenuItem>
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <TextField
                label="Question Number"
                type="number"
                value={questionNumbering.mainNumber}
                onChange={(e) => setQuestionNumbering({
                  ...questionNumbering,
                  mainNumber: parseInt(e.target.value)
                })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Sub-Question"
                value={questionNumbering.subQuestion || ''}
                onChange={(e) => setQuestionNumbering({
                  ...questionNumbering,
                  subQuestion: e.target.value
                })}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Sub-Sub-Question"
                value={questionNumbering.subSubQuestion || ''}
                onChange={(e) => setQuestionNumbering({
                  ...questionNumbering,
                  subSubQuestion: e.target.value
                })}
                fullWidth
              />
            </Grid>
          </Grid>

          <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 2 }}>
            Question Label: {generateQuestionLabel(questionNumbering)}
          </Typography>

          <TextField
            label="Score"
            type="number"
            value={metadata.score}
            onChange={(e) => handleScoreChange(e.target.value)}
            error={!!errors.score}
            helperText={errors.score || (metadata.documentType !== 'question' ? 'Score will be copied from question' : '')}
            required={metadata.documentType === 'question'}
            disabled={metadata.documentType !== 'question'}
            inputProps={{ min: 1 }}
          />

          <FormControl fullWidth>
            <InputLabel>Format</InputLabel>
            <Select
              value={editorMode}
              label="Format"
              onChange={(e) => {
                const newFormat = e.target.value as 'markdown' | 'latex';
                setEditorMode(newFormat);
                setMetadata(prev => ({
                  ...prev,
                  format: newFormat
                }));
              }}
            >
              <MenuItem value="markdown">Markdown</MenuItem>
              <MenuItem value="latex">LaTeX</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MetadataDialog; 