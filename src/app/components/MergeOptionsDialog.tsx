import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Collapse,
  ListItemIcon,
  FormGroup
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { QuestionGroup } from '../types/metadata';
import { validateMergeableGroups } from '../utils/mergeUtils';
import { getFile } from '../api';
import { PDFDocument } from 'pdf-lib';
import MarkdownIt from 'markdown-it';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const md = new MarkdownIt({
  html: true,
  breaks: true
});

type DocumentType = 'question' | 'answer' | 'marking_scheme';

interface MergeOptionsDialogProps {
  open: boolean;
  groups: QuestionGroup[];
  onClose: () => void;
}

const MergeOptionsDialog: React.FC<MergeOptionsDialogProps> = ({
  open,
  groups,
  onClose,
}) => {
  const [selectedGroups, setSelectedGroups] = useState<QuestionGroup[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  // Group questions by their main number
  const groupedQuestions = React.useMemo(() => {
    const result: Record<number, QuestionGroup[]> = {};
    
    groups.forEach(group => {
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
  }, [groups]);

  // Check if a main question has all its sub-questions selected
  const isMainQuestionFullySelected = (mainNumber: number): boolean => {
    const mainQuestionGroups = groupedQuestions[mainNumber] || [];
    return mainQuestionGroups.length > 0 && 
           mainQuestionGroups.every(group => 
             selectedGroups.some(g => g.label === group.label)
           );
  };

  // Check if a main question has any of its sub-questions selected
  const isMainQuestionPartiallySelected = (mainNumber: number): boolean => {
    const mainQuestionGroups = groupedQuestions[mainNumber] || [];
    return mainQuestionGroups.some(group => 
      selectedGroups.some(g => g.label === group.label)
    ) && !isMainQuestionFullySelected(mainNumber);
  };

  // Toggle expansion state for a question group
  const toggleExpanded = (mainNumber: number) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [mainNumber]: !prev[mainNumber]
    }));
  };

  // Handle toggling a main question and all its sub-questions
  const handleToggleMainQuestion = (mainNumber: number) => {
    const mainQuestionGroups = groupedQuestions[mainNumber] || [];
    
    if (isMainQuestionFullySelected(mainNumber)) {
      // Deselect all in this group
      setSelectedGroups(prev => 
        prev.filter(g => !mainQuestionGroups.some(mg => mg.label === g.label))
      );
    } else {
      // Select all in this group
      const newSelectedGroups = [...selectedGroups];
      
      mainQuestionGroups.forEach(group => {
        if (!newSelectedGroups.some(g => g.label === group.label)) {
          newSelectedGroups.push(group);
        }
      });
      
      setSelectedGroups(newSelectedGroups);
    }
  };

  // Toggle a single group
  const handleToggleGroup = (group: QuestionGroup) => {
    setSelectedGroups(prev => {
      const exists = prev.find(g => g.label === group.label);
      if (exists) {
        return prev.filter(g => g.label !== group.label);
      }
      return [...prev, group];
    });
  };

  // Handle select all functionality
  const handleSelectAll = () => {
    if (selectAllChecked) {
      // Deselect all
      setSelectedGroups([]);
    } else {
      // Select all main questions
      const allMainQuestions: QuestionGroup[] = [];
      Object.keys(groupedQuestions).forEach(mainNumber => {
        const mainGroups = groupedQuestions[parseInt(mainNumber)];
        // For each main question, only add groups that have no sub-question
        // or just the first sub-question if all have sub-questions
        const noSubQuestions = mainGroups.filter(g => !g.metadata.questionNumbering?.subQuestion);
        
        if (noSubQuestions.length > 0) {
          allMainQuestions.push(...noSubQuestions);
        } else {
          // If all have sub-questions, just select the first one
          allMainQuestions.push(mainGroups[0]);
        }
      });
      setSelectedGroups(allMainQuestions);
    }
  };

  // Update select all state when selection changes
  useEffect(() => {
    // Check if all main questions are selected
    const allMainQuestionsSelected = Object.keys(groupedQuestions).every(mainNumber => {
      const mainGroups = groupedQuestions[parseInt(mainNumber)];
      const noSubQuestions = mainGroups.filter(g => !g.metadata.questionNumbering?.subQuestion);
      
      if (noSubQuestions.length > 0) {
        return noSubQuestions.every(group => 
          selectedGroups.some(g => g.label === group.label)
        );
      } else {
        // If all have sub-questions, check if at least the first one is selected
        return selectedGroups.some(g => g.label === mainGroups[0].label);
      }
    });
    
    setSelectAllChecked(allMainQuestionsSelected && Object.keys(groupedQuestions).length > 0);
  }, [selectedGroups, groupedQuestions]);

  const handleToggleType = (type: DocumentType) => {
    setSelectedTypes(prev => {
      const exists = prev.includes(type);
      if (exists) {
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  const validateSelection = (): boolean => {
    if (selectedGroups.length < 2) {
      setError('Please select at least 2 question groups');
      return false;
    }

    if (selectedTypes.length === 0) {
      setError('Please select at least one document type');
      return false;
    }

    // Check if selected groups have the required document types
    const missingTypes = selectedTypes.filter(type => {
      const fileKey = type === 'marking_scheme' ? 'markingScheme' : type;
      return !selectedGroups.every(group => group.files[fileKey]);
    });

    if (missingTypes.length > 0) {
      setError(`Some selected groups are missing ${missingTypes.join(', ')} files`);
      return false;
    }

    if (!validateMergeableGroups(selectedGroups)) {
      setError('Some selected groups have invalid metadata');
      return false;
    }

    setError(null);
    return true;
  };

  const generatePDFFromLatex = async (content: string): Promise<Uint8Array> => {
    try {
      const response = await fetch('/api/latex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latexText: content }),
      });

      if (!response.ok) {
        throw new Error('LaTeX compilation failed');
      }

      return new Uint8Array(await response.arrayBuffer());
    } catch (error) {
      console.error('Error generating PDF from LaTeX:', error);
      throw error;
    }
  };

  const generatePDFFromMarkdown = async (content: string): Promise<Uint8Array> => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.className = 'pdf-export-container';
      tempDiv.innerHTML = md.render(content);
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm';
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight
      });

      document.body.removeChild(tempDiv);

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(canvas, 'JPEG', 0, 0, imgWidth, imgHeight, '', 'FAST');

      return new Uint8Array(pdf.output('arraybuffer'));
    } catch (error) {
      console.error('Error generating PDF from Markdown:', error);
      throw error;
    }
  };

  const handleMerge = async () => {
    if (!validateSelection()) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const mergedPdf = await PDFDocument.create();
      
      // Sort groups by question number
      const sortedGroups = [...selectedGroups].sort((a, b) => {
        const numA = a.metadata.questionNumbering?.mainNumber || 0;
        const numB = b.metadata.questionNumbering?.mainNumber || 0;
        return numA - numB;
      });

      // Process each group in order: question -> answer -> marking scheme
      for (const group of sortedGroups) {
        // Fixed order of document types
        const orderedTypes: DocumentType[] = ['question', 'answer', 'marking_scheme'];
        
        // Only process selected types, but maintain order
        const typesToProcess = orderedTypes.filter(type => selectedTypes.includes(type));

        for (const type of typesToProcess) {
          const fileKey = type === 'marking_scheme' ? 'markingScheme' : type;
          const fileId = group.files[fileKey];
          
          if (!fileId) continue;

          // Get file content and format
          const fileResponse = await getFile(fileId);
          const fileData = fileResponse.data.editor_files[0];
          const content = fileData.content;
          const format = fileData.metadata.format;

          try {
            // Generate PDF based on format
            const pdfBytes = format === 'latex' 
              ? await generatePDFFromLatex(content)
              : await generatePDFFromMarkdown(content);

            // Load and merge the PDF
            const pdf = await PDFDocument.load(pdfBytes);
            const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            pages.forEach(page => mergedPdf.addPage(page));
          } catch (error) {
            console.error(`Error processing ${type} for question ${group.metadata.questionLabel}:`, error);
            throw new Error(`Failed to process ${type} for question ${group.metadata.questionLabel}`);
          }
        }
      }

      // Save and download the merged PDF
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged-document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Error merging PDFs:', error);
      setError(typeof error === 'string' ? error : 'Failed to merge PDFs. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Merge Options</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Document Types</Typography>
          <FormControl component="fieldset">
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedTypes.includes('question')}
                    onChange={() => handleToggleType('question')}
                  />
                }
                label="Questions"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedTypes.includes('answer')}
                    onChange={() => handleToggleType('answer')}
                  />
                }
                label="Answers"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedTypes.includes('marking_scheme')}
                    onChange={() => handleToggleType('marking_scheme')}
                  />
                }
                label="Marking Schemes"
              />
            </Box>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1">Select Question Groups</Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={selectAllChecked}
                onChange={handleSelectAll}
                disabled={Object.keys(groupedQuestions).length === 0}
              />
            }
            label="Select All"
          />
        </Box>

        <List>
          {Object.keys(groupedQuestions)
            .map(key => parseInt(key))
            .sort((a, b) => a - b)
            .map(mainNumber => {
              const mainQuestionGroups = groupedQuestions[mainNumber];
              const hasSubQuestions = mainQuestionGroups.some(
                g => !!g.metadata.questionNumbering?.subQuestion
              );
              
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
                  >
                    <ListItemText 
                      primary={mainLabel}
                    />
                    {hasSubQuestions && (
                      <IconButton 
                        edge="end" 
                        onClick={() => toggleExpanded(mainNumber)}
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
                              onClick={() => handleToggleGroup(group)}
                              sx={{ pl: 4, cursor: 'pointer' }}
                            >
                              <ListItemText 
                                primary={group.metadata.questionLabel}
                                secondary={`Sub-question ${group.metadata.questionNumbering?.subQuestion || ''}`}
                              />
                              <Checkbox
                                edge="end"
                                checked={selectedGroups.some(g => g.label === group.label)}
                              />
                            </ListItem>
                          ))}
                      </List>
                    </Collapse>
                  )}
                </Box>
              );
            })}
        </List>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {isProcessing && (
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            zIndex: 1
          }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>
              Generating PDFs...
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleMerge}
          variant="contained"
          disabled={selectedGroups.length < 2 || selectedTypes.length === 0 || isProcessing}
        >
          {isProcessing ? 'Merging...' : 'Merge'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MergeOptionsDialog; 