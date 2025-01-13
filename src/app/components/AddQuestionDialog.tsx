import React, { useState } from 'react';
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
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { QuestionNumbering, FileMetadata } from '../types/metadata';

interface AddQuestionDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (metadata: FileMetadata, files: string[]) => Promise<void>;
}

export default function AddQuestionDialog({ open, onClose, onAdd }: AddQuestionDialogProps) {
  const [numbering, setNumbering] = useState<QuestionNumbering>({
    mainNumber: 1,
  });
  const [format, setFormat] = useState<'markdown' | 'latex'>('markdown');
  const [score, setScore] = useState<number>(0);
  const [createFiles, setCreateFiles] = useState({
    question: true,
    answer: false,
    markingScheme: false,
  });

  const handleAdd = async () => {
    try {
      console.log('Generating files with numbering:', numbering);
      const label = generateQuestionLabel(numbering);
      console.log('Generated label:', label);
      
      const files = Object.entries(createFiles)
        .filter(([_, value]) => value)
        .map(([type]) => generateFileName(label, type));
      
      console.log('Files to create:', files);

      const metadata: FileMetadata = {
        documentType: 'question',
        format,
        score,
        questionLabel: label,
        questionNumbering: numbering,
        groupId: label,
      };
      
      console.log('Metadata:', metadata);
      await onAdd(metadata, files);
      onClose();
    } catch (error) {
      console.error('Error in handleAdd:', error);
    }
  };

  const generateQuestionLabel = (numbering: QuestionNumbering): string => {
    let label = `Q${numbering.mainNumber}`;
    if (numbering.subQuestion) label += `.${numbering.subQuestion}`;
    if (numbering.subSubQuestion) label += `.${numbering.subSubQuestion}`;
    return label;
  };

  const generateFileName = (label: string, type: string): string => {
    const base = `Question-${label.replace(/\./g, '-')}`;
    switch (type) {
      case 'answer':
        return `${base}-answer`;
      case 'markingScheme':
        return `${base}-marking`;
      default:
        return base;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Question</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={4}>
            <TextField
              label="Question Number"
              type="number"
              value={numbering.mainNumber}
              onChange={(e) => setNumbering({
                ...numbering,
                mainNumber: parseInt(e.target.value)
              })}
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Sub-Question"
              value={numbering.subQuestion || ''}
              onChange={(e) => setNumbering({
                ...numbering,
                subQuestion: e.target.value
              })}
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Sub-Sub-Question"
              value={numbering.subSubQuestion || ''}
              onChange={(e) => setNumbering({
                ...numbering,
                subSubQuestion: e.target.value
              })}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={createFiles.question}
                  onChange={(e) => setCreateFiles(prev => ({
                    ...prev,
                    question: e.target.checked
                  }))}
                />
              }
              label="Create Question File"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={createFiles.answer}
                  onChange={(e) => setCreateFiles(prev => ({
                    ...prev,
                    answer: e.target.checked
                  }))}
                />
              }
              label="Create Answer File"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={createFiles.markingScheme}
                  onChange={(e) => setCreateFiles(prev => ({
                    ...prev,
                    markingScheme: e.target.checked
                  }))}
                />
              }
              label="Create Marking Scheme"
            />
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>Format</InputLabel>
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'markdown' | 'latex')}
                label="Format"
              >
                <MenuItem value="markdown">Markdown</MenuItem>
                <MenuItem value="latex">LaTeX</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Score"
              type="number"
              value={score}
              onChange={(e) => setScore(parseInt(e.target.value))}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAdd} variant="contained" color="primary">
          Add Question
        </Button>
      </DialogActions>
    </Dialog>
  );
} 