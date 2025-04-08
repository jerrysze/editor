import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Snackbar,
  FormControlLabel,
  IconButton,
  Collapse
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getExams, transferCollectionToExam, validateCollectionMetadata, getFile } from '../api';
import { FileMetadata } from '../types/metadata';

interface TransferToExamButtonProps {
  selectedCollectionId: string | null;
}

interface FileOption {
  id: string;
  name: string;
  metadata: FileMetadata;
}

interface QuestionNumbering {
  mainNumber: number;
  subQuestion?: string;
  subSubQuestion?: string;
}

interface TransferFileMetadata {
  groupId: string;
  documentType: 'question' | 'answer' | 'marking_scheme';
  format: 'markdown' | 'latex';
  score: number;
  questionLabel: string;
  questionNumbering?: QuestionNumbering;
}

interface QuestionGroup {
  label: string;
  files: {
    question?: string;
    answer?: string;
    markingScheme?: string;
  };
  metadata: FileMetadata;
}

export const TransferToExamButton: React.FC<TransferToExamButtonProps> = ({ selectedCollectionId }) => {
  const [open, setOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<number | ''>('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const queryClient = useQueryClient();

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: getExams,
    enabled: open,
  });

  const { data: files, isLoading: filesLoading, error: filesError } = useQuery({
    queryKey: ['collectionFiles', selectedCollectionId],
    queryFn: async () => {
      if (!selectedCollectionId) {
        return [];
      }
      
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collectionId: selectedCollectionId })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch files');
      }

      const fileData = await response.json();
      const groups = groupFilesByQuestionLabel(fileData);
      return groups;
    },
    enabled: open && !!selectedCollectionId,
  });

  const groupFilesByQuestionLabel = (files: FileOption[]): QuestionGroup[] => {
    const groups: { [key: string]: QuestionGroup } = {};

    files.forEach(file => {
      if (!file.metadata?.questionLabel) return;

      const label = file.metadata.questionLabel;
      if (!groups[label]) {
        groups[label] = {
          label,
          files: {},
          metadata: {
            ...file.metadata,
            documentType: 'question',
          }
        };
      }

      switch (file.metadata.documentType) {
        case 'question':
          groups[label].files.question = file.id;
          break;
        case 'answer':
          groups[label].files.answer = file.id;
          break;
        case 'marking_scheme':
          groups[label].files.markingScheme = file.id;
          break;
      }
    });

    return Object.values(groups).sort((a, b) => {
      const aNum = a.metadata.questionNumbering?.mainNumber || 0;
      const bNum = b.metadata.questionNumbering?.mainNumber || 0;
      return aNum - bNum;
    });
  };

  const transferMutation = useMutation({
    mutationFn: async ({ examId, selectedGroups }: {
      examId: number;
      selectedGroups: QuestionGroup[];
    }) => {
      const fileContents = await Promise.all(
        selectedGroups.flatMap(async (group) => {
          const groupFiles = [];
          
          for (const [type, fileId] of Object.entries(group.files)) {
            if (!fileId) continue;

            const fileData = await getFile(fileId);
            if (!fileData?.data?.editor_files?.[0]) {
              throw new Error(`File data not found for ${fileId}`);
            }

            const fileMetadata = fileData.data.editor_files[0].metadata;
            if (!fileMetadata) {
              throw new Error(`Metadata not found for file ${fileId}`);
            }

            const transferMetadata: TransferFileMetadata = {
              groupId: group.label,
              documentType: fileMetadata.documentType,
              format: fileMetadata.format,
              score: fileMetadata.score,
              questionLabel: group.metadata.questionLabel,
              questionNumbering: group.metadata.questionNumbering
            };
            
            groupFiles.push({
              fileId,
              content: fileData.data.editor_files[0].content,
              metadata: transferMetadata
            });
          }
          
          return groupFiles;
        })
      );

      return transferCollectionToExam({
        examId,
        files: fileContents.flat()
      });
    },
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Collection successfully transferred to exam',
        severity: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setOpen(false);
      setSelectedExam('');
      setSelectedFiles([]);
    },
    onError: (error: Error) => {
      setSnackbar({
        open: true,
        message: `Transfer failed: ${error.message}`,
        severity: 'error'
      });
    }
  });

  const handleTransfer = async () => {
    if (!selectedExam || selectedFiles.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select an exam and at least one question group',
        severity: 'error'
      });
      return;
    }

    try {
      const selectedGroups = selectedFiles
        .map(label => files?.find(group => group.label === label))
        .filter((group): group is QuestionGroup => group !== undefined);

      // Validate each group has required files
      const invalidGroups = selectedGroups.filter(group => {
        return !group.files.question || !group.files.markingScheme; // Only check for question and marking scheme
      });

      if (invalidGroups.length > 0) {
        setSnackbar({
          open: true,
          message: `Missing required files for questions: ${invalidGroups.map(g => g.label).join(', ')}`,
          severity: 'error'
        });
        return;
      }

      await transferMutation.mutateAsync({
        examId: selectedExam as number,
        selectedGroups
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Transfer failed',
        severity: 'error'
      });
    }
  };

  const handleFileToggle = (groupLabel: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(groupLabel)) {
        return prev.filter(label => label !== groupLabel);
      }
      return [...prev, groupLabel];
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const isGroupComplete = (group: QuestionGroup): boolean => {
    return !!(group.files.question && group.files.markingScheme); // Only require question and marking scheme
  };

  // Group questions by their main number
  const groupedQuestions = React.useMemo(() => {
    if (!files) return {};
    
    const result: Record<number, QuestionGroup[]> = {};
    
    files.forEach(group => {
      const mainNumber = group.metadata.questionNumbering?.mainNumber || 0;
      if (!result[mainNumber]) {
        result[mainNumber] = [];
      }
      result[mainNumber].push(group);
    });
    
    // Sort each group internally by sub-question
    Object.keys(result).forEach(key => {
      const numKey = parseInt(key);
      result[numKey].sort((a, b) => {
        const subA = a.metadata.questionNumbering?.subQuestion || '';
        const subB = b.metadata.questionNumbering?.subQuestion || '';
        return subA.localeCompare(subB);
      });
    });
    
    return result;
  }, [files]);

  // Check if a main question has all its sub-questions selected
  const isMainQuestionFullySelected = (mainNumber: number): boolean => {
    const mainQuestionGroups = groupedQuestions[mainNumber] || [];
    return mainQuestionGroups.length > 0 && 
           mainQuestionGroups.every(group => 
             selectedFiles.includes(group.label)
           );
  };

  // Check if a main question has any of its sub-questions selected
  const isMainQuestionPartiallySelected = (mainNumber: number): boolean => {
    const mainQuestionGroups = groupedQuestions[mainNumber] || [];
    return mainQuestionGroups.some(group => 
      selectedFiles.includes(group.label)
    ) && !isMainQuestionFullySelected(mainNumber);
  };

  // Toggle expansion state for a question group
  const toggleExpanded = (mainNumber: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedQuestions(prev => ({
      ...prev,
      [mainNumber]: !prev[mainNumber]
    }));
  };

  // Handle toggling a main question and all its sub-questions
  const handleToggleMainQuestion = (mainNumber: number) => {
    const mainQuestionGroups = groupedQuestions[mainNumber] || [];
    const groupLabels = mainQuestionGroups.map(g => g.label);
    
    if (isMainQuestionFullySelected(mainNumber)) {
      // Deselect all in this group
      setSelectedFiles(prev => 
        prev.filter(label => !groupLabels.includes(label))
      );
    } else {
      // Select all in this group
      const newSelectedFiles = [...selectedFiles];
      
      groupLabels.forEach(label => {
        if (!newSelectedFiles.includes(label)) {
          newSelectedFiles.push(label);
        }
      });
      
      setSelectedFiles(newSelectedFiles);
    }
  };

  // Handle select all functionality - selects all questions including sub-questions
  const handleSelectAll = () => {
    if (selectAllChecked) {
      // Deselect all
      setSelectedFiles([]);
    } else {
      // Select all questions including sub-questions
      if (!files) return;
      
      const allQuestionLabels = files.map(group => group.label);
      setSelectedFiles(allQuestionLabels);
    }
  };

  // Update select all state when selection changes
  useEffect(() => {
    if (!files || files.length === 0) {
      setSelectAllChecked(false);
      return;
    }
    
    const allComplete = files.filter(isGroupComplete);
    const allCompleteLabels = allComplete.map(group => group.label);
    
    // Check if all valid files are selected
    setSelectAllChecked(
      allCompleteLabels.length > 0 && 
      allCompleteLabels.every(label => selectedFiles.includes(label))
    );
  }, [selectedFiles, files]);

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        fullWidth
        disabled={!selectedCollectionId}
        onClick={() => setOpen(true)}
      >
        Transfer to MAGE
      </Button>

      <Dialog 
        open={open} 
        onClose={() => {
          setOpen(false);
          setSelectedExam('');
          setSelectedFiles([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Transfer to MAGE</DialogTitle>
        <DialogContent>
          {filesError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to load files
            </Alert>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1">
                1. Select Questions to Transfer
              </Typography>
              {files && files.length > 0 && !filesLoading && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectAllChecked}
                      onChange={handleSelectAll}
                      disabled={!files.some(isGroupComplete)}
                    />
                  }
                  label="Select All"
                />
              )}
            </Box>
            
            {filesLoading ? (
              <CircularProgress size={24} sx={{ m: 2 }} />
            ) : !files?.length ? (
              <Typography color="text.secondary" sx={{ my: 2 }}>
                No questions found in this collection.
              </Typography>
            ) : (
              <List>
                {Object.keys(groupedQuestions)
                  .map(key => parseInt(key))
                  .sort((a, b) => a - b)
                  .map(mainNumber => {
                    const mainQuestionGroups = groupedQuestions[mainNumber];
                    const hasSubQuestions = mainQuestionGroups.some(
                      g => !!g.metadata.questionNumbering?.subQuestion
                    );
                    
                    // Find a group that has no sub-question to represent the main question
                    const mainGroup = mainQuestionGroups.find(g => !g.metadata.questionNumbering?.subQuestion) 
                      || mainQuestionGroups[0]; // fallback to first in group
                    
                    // Get the main question label (without sub-question part)
                    const mainLabel = `Question ${mainNumber}`;
                    
                    return (
                      <Box key={mainNumber}>
                        <ListItem 
                          sx={{ 
                            bgcolor: 'rgba(0, 0, 0, 0.03)', 
                            cursor: 'pointer',
                            borderRadius: 1
                          }}
                          onClick={() => handleToggleMainQuestion(mainNumber)}
                        >
                          <ListItemText 
                            primary={mainLabel}
                            secondary={
                              <>
                                Score: {mainGroup.metadata.score}
                                {!isGroupComplete(mainGroup) && (
                                  <Typography component="span" color="error" sx={{ ml: 1 }}>
                                    (Missing required files)
                                  </Typography>
                                )}
                              </>
                            }
                          />
                          {hasSubQuestions && (
                            <IconButton 
                              edge="end" 
                              onClick={(e) => toggleExpanded(mainNumber, e)}
                              aria-expanded={expandedQuestions[mainNumber]}
                              aria-label="show more"
                            >
                              {expandedQuestions[mainNumber] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          )}
                          <Checkbox
                            edge="end"
                            checked={isMainQuestionFullySelected(mainNumber)}
                            indeterminate={isMainQuestionPartiallySelected(mainNumber)}
                            onChange={() => handleToggleMainQuestion(mainNumber)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={!mainQuestionGroups.some(isGroupComplete)}
                          />
                        </ListItem>
                        
                        {hasSubQuestions && (
                          <Collapse in={expandedQuestions[mainNumber]} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                              {mainQuestionGroups
                                .filter(group => !!group.metadata.questionNumbering?.subQuestion)
                                .map((group) => (
                                  <ListItem 
                                    key={group.label}
                                    onClick={() => handleFileToggle(group.label)}
                                    sx={{ pl: 4, cursor: 'pointer' }}
                                  >
                                    <ListItemText 
                                      primary={group.metadata.questionLabel}
                                      secondary={
                                        <>
                                          Score: {group.metadata.score} | Files: {Object.values(group.files).filter(Boolean).length}/3
                                          {!group.files.question && (
                                            <Typography component="span" color="error" sx={{ ml: 1 }}>
                                              (Question required)
                                            </Typography>
                                          )}
                                          {!group.files.markingScheme && (
                                            <Typography component="span" color="error" sx={{ ml: 1 }}>
                                              (Marking scheme required)
                                            </Typography>
                                          )}
                                        </>
                                      }
                                    />
                                    <Checkbox
                                      edge="end"
                                      checked={selectedFiles.includes(group.label)}
                                      onChange={() => handleFileToggle(group.label)}
                                      onClick={(e) => e.stopPropagation()}
                                      disabled={!isGroupComplete(group)}
                                    />
                                  </ListItem>
                                ))}
                            </List>
                          </Collapse>
                        )}
                      </Box>
                    );
                  })
                }
              </List>
            )}
          </Box>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              2. Select Target Exam
            </Typography>
            {examsLoading ? (
              <CircularProgress size={24} sx={{ m: 2 }} />
            ) : !exams?.length ? (
              <Typography color="text.secondary" sx={{ my: 2 }}>
                No exams available. Please create an exam first.
              </Typography>
            ) : (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Exam</InputLabel>
                <Select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value as number)}
                  label="Select Exam"
                >
                  {exams?.map((exam) => (
                    <MenuItem key={exam.id} value={exam.id}>
                      <Box>
                        <Typography variant="subtitle1">
                          {exam.exam_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {exam.course_code}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpen(false);
            setSelectedExam('');
            setSelectedFiles([]);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleTransfer}
            disabled={!selectedExam || selectedFiles.length === 0 || transferMutation.isPending}
            variant="contained"
          >
            {transferMutation.isPending ? (
              <CircularProgress size={24} />
            ) : (
              'Transfer'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}; 