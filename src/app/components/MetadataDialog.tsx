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
  Typography,
  Box,
  SelectChangeEvent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Collapse
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, ExpandMore, ExpandLess, Delete as DeleteIcon } from '@mui/icons-material';

interface MetadataDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (metadata: FileMetadata) => void;
  fileName: string | null;
  initialMetadata?: FileMetadata;
}

interface Section {
  id: string;
  title: string;
  questions: Question[];
}

interface Question {
  id: string;
  number: string;
  text: string;
  marks: number;
  markingScheme: string;
  subQuestions?: Question[];
}

export interface FileMetadata {
  format: 'latex' | 'markdown';
  numberOfQuestions: number;
  structure: Section[];
}

const generateUniqueId = (prefix: string): string => {
  const uuid = Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  
  return `${prefix}-${uuid}`;
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
    numberOfQuestions: 0,
    structure: []
  });

  // Add useEffect to update metadata when initialMetadata changes
  useEffect(() => {
    if (initialMetadata) {
      setMetadata(initialMetadata);
      // Automatically expand sections that have questions
      const sectionsWithQuestions = initialMetadata.structure
        .filter(section => section.questions.length > 0)
        .map(section => section.id);
      setExpandedSections(sectionsWithQuestions);
    }
  }, [initialMetadata]);

  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);

  const handleSave = () => {
    onSave(metadata);
    onClose();
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const addSection = () => {
    const newSection: Section = {
      id: generateUniqueId('section'),
      title: `Section ${metadata.structure.length + 1}`,
      questions: []
    };
    setMetadata(prev => ({
      ...prev,
      structure: [...prev.structure, newSection]
    }));
    // Automatically expand the new section
    setExpandedSections(prev => [...prev, newSection.id]);
  };

  const addQuestion = (sectionId: string, parentQuestionId?: string) => {
    const newQuestion: Question = {
      id: generateUniqueId('question'),
      number: '',
      text: '',
      marks: 0,
      markingScheme: '',
      subQuestions: []
    };

    setMetadata(prev => {
      // Create a deep copy of the structure
      const newStructure = JSON.parse(JSON.stringify(prev.structure));
      const section = newStructure.find((s: Section) => s.id === sectionId);
      
      if (!section) return prev;

      if (parentQuestionId) {
        // Add as sub-question
        const addSubQuestion = (questions: Question[]): Question[] => {
          return questions.map(q => {
            if (q.id === parentQuestionId) {
              return {
                ...q,
                subQuestions: [...(q.subQuestions || []), newQuestion]
              };
            }
            if (q.subQuestions) {
              return {
                ...q,
                subQuestions: addSubQuestion(q.subQuestions)
              };
            }
            return q;
          });
        };
        section.questions = addSubQuestion(section.questions);
      } else {
        // Add as main question
        section.questions = [...section.questions, newQuestion];
      }

      return {
        ...prev,
        structure: newStructure
      };
    });

    // Automatically expand the new question and ensure parent section is expanded
    setExpandedQuestions(prev => [...prev, newQuestion.id]);
    setExpandedSections(prev => 
      prev.includes(sectionId) ? prev : [...prev, sectionId]
    );
  };

  const updateQuestion = (
    sectionId: string, 
    questionId: string, 
    updates: Partial<Question>,
    parentQuestionId?: string
  ) => {
    setMetadata(prev => {
      const newStructure = prev.structure.map(section => {
        if (section.id !== sectionId) return section;

        const updateQuestionInArray = (questions: Question[]): Question[] => {
          return questions.map(q => {
            if (q.id === questionId) {
              return { ...q, ...updates };
            }
            if (q.subQuestions) {
              return {
                ...q,
                subQuestions: updateQuestionInArray(q.subQuestions)
              };
            }
            return q;
          });
        };

        return {
          ...section,
          questions: updateQuestionInArray(section.questions)
        };
      });

      return { ...prev, structure: newStructure };
    });
  };

  const renderQuestion = (question: Question, sectionId: string, depth = 0, parentQuestionId?: string) => {
    const isExpanded = expandedQuestions.includes(question.id);
    const questionKey = parentQuestionId ? `${parentQuestionId}-${question.id}` : question.id;

    return (
      <Box key={questionKey} sx={{ ml: depth * 2 }}>
        <ListItem>
          <IconButton size="small" onClick={() => toggleQuestion(question.id)}>
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
          <ListItemText primary={`Question ${question.number || '[Untitled]'}`} />
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              addQuestion(sectionId, question.id);
            }}
          >
            <AddIcon />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              deleteQuestion(sectionId, question.id, parentQuestionId);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </ListItem>
        <Collapse in={isExpanded}>
          <Box sx={{ pl: 4, pr: 2 }}>
            <TextField
              fullWidth
              margin="dense"
              label="Question Number"
              value={question.number}
              onChange={(e) => updateQuestion(sectionId, question.id, { number: e.target.value }, parentQuestionId)}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Question Text"
              value={question.text}
              onChange={(e) => updateQuestion(sectionId, question.id, { text: e.target.value }, parentQuestionId)}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Marks"
              type="number"
              value={question.marks}
              onChange={(e) => updateQuestion(sectionId, question.id, { marks: parseInt(e.target.value) || 0 }, parentQuestionId)}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Marking Scheme"
              multiline
              rows={2}
              value={question.markingScheme}
              onChange={(e) => updateQuestion(sectionId, question.id, { markingScheme: e.target.value }, parentQuestionId)}
            />
          </Box>
          {question.subQuestions && (
            <List>
              {question.subQuestions.map((subQuestion, index) => 
                renderQuestion(
                  subQuestion, 
                  sectionId, 
                  depth + 1, 
                  question.id
                )
              )}
            </List>
          )}
        </Collapse>
      </Box>
    );
  };

  const deleteSection = (sectionId: string) => {
    setMetadata(prev => ({
      ...prev,
      structure: prev.structure.filter(s => s.id !== sectionId)
    }));
  };

  const deleteQuestion = (sectionId: string, questionId: string, parentQuestionId?: string) => {
    setMetadata(prev => {
      const newStructure = prev.structure.map(section => {
        if (section.id !== sectionId) return section;

        const deleteQuestionFromArray = (questions: Question[]): Question[] => {
          return questions.map(q => {
            if (q.id === parentQuestionId) {
              return {
                ...q,
                subQuestions: q.subQuestions?.filter(sq => sq.id !== questionId) || []
              };
            }
            if (q.subQuestions) {
              return {
                ...q,
                subQuestions: deleteQuestionFromArray(q.subQuestions)
              };
            }
            return q;
          }).filter(q => q.id !== questionId);
        };

        return {
          ...section,
          questions: deleteQuestionFromArray(section.questions)
        };
      });

      return { ...prev, structure: newStructure };
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit File Metadata</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2, mt: 1 }}>
          <Typography variant="subtitle2" color="textSecondary">
            File: {fileName || 'Untitled'}
          </Typography>
        </Box>
        <FormControl fullWidth margin="normal">
          <InputLabel>Format</InputLabel>
          <Select
            value={metadata.format}
            label="Format"
            onChange={(e) => setMetadata({ ...metadata, format: e.target.value as 'latex' | 'markdown' })}
          >
            <MenuItem value="latex">LaTeX</MenuItem>
            <MenuItem value="markdown">Markdown</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          margin="normal"
          label="Number of Questions"
          type="number"
          value={metadata.numberOfQuestions}
          onChange={(e) => setMetadata({ 
            ...metadata, 
            numberOfQuestions: parseInt(e.target.value) || 0 
          })}
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">
            Structure
            <IconButton size="small" onClick={addSection} sx={{ ml: 1 }}>
              <AddIcon />
            </IconButton>
          </Typography>
          <List>
            {metadata.structure.map(section => (
              <Box key={section.id}>
                <ListItem>
                  <IconButton size="small" onClick={() => toggleSection(section.id)}>
                    {expandedSections.includes(section.id) ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                  <TextField
                    value={section.title}
                    onChange={(e) => {
                      const newStructure = metadata.structure.map(s => 
                        s.id === section.id ? { ...s, title: e.target.value } : s
                      );
                      setMetadata({ ...metadata, structure: newStructure });
                    }}
                  />
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      addQuestion(section.id);
                    }}
                    sx={{ ml: 1 }}
                  >
                    <AddIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => deleteSection(section.id)}
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
                <Collapse in={expandedSections.includes(section.id)}>
                  <List>
                    {section.questions.map(question => 
                      renderQuestion(question, section.id)
                    )}
                  </List>
                </Collapse>
              </Box>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
} 