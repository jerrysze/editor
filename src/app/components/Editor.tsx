import React, { Component } from 'react';
import MarkdownLatexEditor from 'markdown-latex';
import LaTeXEditor from './LaTeXEditor';
import { Box, IconButton, Tabs, Tab, Tooltip, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { saveFile, getFile } from '@/app/api';
import { ActiveFileContext } from '../contexts/ActiveFileContext';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import ShareIcon from '@mui/icons-material/Share';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MarkdownEditor from './MarkdownEditor';

interface AppState {
  markdownValue: string;
  latexValue: string;
  testResult: string;
  isLoading: boolean;
  activeTab: number;
  showPreview: boolean;
  isPdfLoading: boolean;
}

interface EditorProps {
  collectionId: string | null;
  fileId: string | null;
  fileName: string | null;
}

const getEditorTypeFromFileName = (fileName: string | null): number => {
  if (!fileName) return 0; // Default to LaTeX
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension === 'md' ? 1 : 0; // 1 for Markdown, 0 for LaTeX
};

export default class Editor extends Component<EditorProps, AppState> {
  static contextType = ActiveFileContext;
  context!: React.ContextType<typeof ActiveFileContext>;

  constructor(props: EditorProps) {
    super(props);
    this.state = {
      markdownValue: '',
      latexValue: '',
      testResult: '',
      isLoading: false,
      activeTab: 0,
      showPreview: false,
      isPdfLoading: false
    };
    this.handleMarkdownChange = this.handleMarkdownChange.bind(this);
    this.handleLatexChange = this.handleLatexChange.bind(this);
  }

  componentDidMount() {
    this.loadFileContent();
  }

  componentDidUpdate(prevProps: EditorProps, prevState: AppState) {
    if (prevProps.fileId !== this.props.fileId || prevProps.fileName !== this.props.fileName) {
      this.loadFileContent();
    }

    // Handle selected files only in insert mode
    const { selectedFiles, setSelectedFiles, setSelectionMode, selectionType } = this.context;
    if (selectedFiles.length > 0 && selectionType === 'insert') {
      this.insertSelectedFilesContent(selectedFiles).then(() => {
        setSelectedFiles([]);
        setSelectionMode(false);
      });
    }
  }

  loadFileContent = async () => {
    const { fileId, fileName } = this.props;
    if (fileId) {
      this.setState({ isLoading: true });
      try {
        const fileData = await getFile(fileId);
        if (fileData && fileData.data && fileData.data.editor_files && fileData.data.editor_files[0]) {
          const content = fileData.data.editor_files[0].content;
          // Set the active tab based on file extension
          const newActiveTab = getEditorTypeFromFileName(fileName);
          this.setState({ 
            markdownValue: content,
            latexValue: content,
            activeTab: newActiveTab // Set the correct editor type
          });
        } else {
          this.setState({ 
            markdownValue: '',
            latexValue: '',
            activeTab: getEditorTypeFromFileName(fileName) // Set even if no content
          });
        }
      } catch (error) {
        console.error("Error loading file content:", error);
        this.setState({ 
          markdownValue: '',
          latexValue: '',
          activeTab: getEditorTypeFromFileName(fileName) // Set even on error
        });
      } finally {
        this.setState({ isLoading: false });
      }
    } else {
      this.setState({ 
        markdownValue: '',
        latexValue: '',
        activeTab: getEditorTypeFromFileName(fileName) // Set even when no fileId
      });
    }
  }

  handleMarkdownChange(value: string) {
    this.setState({ markdownValue: value, latexValue: value });
  }

  handleLatexChange(value: string) {
    this.setState({ latexValue: value, markdownValue: value });
  }

  handleSave = async () => {
    const { collectionId, fileId, fileName } = this.props;
    const { activeTab, markdownValue, latexValue } = this.state;

    if (!collectionId || !fileName) {
      console.error('Collection ID or file name is missing');
      return;
    }

    const contentToSave = activeTab === 0 ? latexValue : markdownValue;

    try {
      const response = await saveFile(collectionId, fileId, fileName, contentToSave);

      if (response && response.success) {
        console.log('File saved successfully!');
        this.setState({ testResult: 'File saved successfully!' });
      } else {
        console.error('Failed to save the file. Please try again.');
        this.setState({ testResult: 'Failed to save the file. Please try again.' });
      }
    } catch (error) {
      console.error("Error saving file:", error);
      this.setState({ testResult: 'An error occurred while saving the file. Please try again.' });
    }
  };

  handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    this.setState({ activeTab: newValue });
  };

  togglePreview = () => {
    this.setState(prevState => ({ showPreview: !prevState.showPreview }));
  };

  handleShare = async () => {
    if (this.state.activeTab === 0) {  // LaTeX mode
      try {
        this.setState({ isPdfLoading: true });
        
        // First ensure preview is visible
        if (!this.state.showPreview) {
          await new Promise<void>(resolve => {
            this.setState({ showPreview: true }, () => {
              setTimeout(resolve, 500);
            });
          });
        }
      
        const previewElement = document.querySelector(
          this.state.activeTab === 0 ? '.latex-preview' : '.markdown-preview'
        );
      
      if (!previewElement) {
        console.error('No preview element found');
        return;
      }

        const htmlElement = previewElement as HTMLElement;
        
        // Create PDF with A4 dimensions
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });

        // Get the total height of the content
        const contentHeight = htmlElement.offsetHeight;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        // Calculate number of pages needed
        const totalPages = Math.ceil(contentHeight / pageHeight);
        
        // Create canvas for each page
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
          }

          const canvas = await html2canvas(htmlElement, {
            y: page * pageHeight,
            height: pageHeight,
            windowHeight: contentHeight
          });

          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }
        
        // Save the PDF
        const fileName = this.props.fileName?.replace(/\.[^/.]+$/, "") || 'document';
        pdf.save(`${fileName}.pdf`);

        // Restore preview state if needed
        if (!this.state.showPreview) {
          this.setState({ showPreview: false });
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        this.setState({ isPdfLoading: false });
      }
    }
  };

  handleInsertClick = () => {
    const { setSelectionMode, setSelectionType } = this.context;
    const newSelectionMode = !this.context.isSelectionMode;
    setSelectionMode(newSelectionMode);
    setSelectionType(newSelectionMode ? 'insert' : 'none');
  };

  insertSelectedFilesContent = async (selectedFiles: any[]) => {
    try {
      const contents = await Promise.all(
        selectedFiles.map(async (file) => {
          const fileData = await getFile(file.fileId);
          if (fileData?.data?.editor_files?.[0]?.content) {
            return {
              fileName: file.fileName,
              content: fileData.data.editor_files[0].content
            };
          }
          return { fileName: file.fileName, content: '' };
        })
      );

      const insertText = contents
        .map(({ fileName, content }) => `% ============ ${fileName} ============\n${content}\n\n`)
        .join('');

      // Get cursor position or end of content
      const currentContent = this.state.activeTab === 0 ? this.state.latexValue : this.state.markdownValue;
      const newContent = currentContent + '\n' + insertText;

      if (this.state.activeTab === 0) {
        this.setState({ latexValue: newContent, markdownValue: newContent });
      } else {
        this.setState({ markdownValue: newContent, latexValue: newContent });
      }
    } catch (error) {
      console.error('Error inserting files:', error);
    }
  };

  render() {
    const { markdownValue, latexValue, isLoading, activeTab, showPreview, isPdfLoading } = this.state;
    const { collectionId, fileId, fileName } = this.props;
    const { isSelectionMode } = this.context;

    return(
      <Box sx={{ 
        flexGrow: 1, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        maxWidth: '100%',
        overflow: 'hidden', // Prevent horizontal scrolling
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 1,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          minHeight: '48px',
          width: '100%',
        }}>
          <Box sx={{ 
            minWidth: 0, // Allow tabs to shrink if needed
            flex: '0 1 auto',
          }}>
            <Tabs 
              value={activeTab} 
              onChange={this.handleTabChange}
              sx={{
                minHeight: '36px',
                '& .MuiTab-root': {
                  minHeight: '36px',
                  padding: '6px 12px',
                }
              }}
            >
              <Tab label="LaTeX" />
              <Tab label="Markdown" />
            </Tabs>
          </Box>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            ml: 1,
            flexShrink: 0, // Prevent buttons from shrinking
          }}>
            <Tooltip title={isPdfLoading ? "Generating PDF..." : "Share as PDF"}>
              <IconButton 
                onClick={this.handleShare} 
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
            <Tooltip title={showPreview ? "Hide Preview" : "Show Preview"}>
              <IconButton 
                onClick={this.togglePreview} 
                size="small"
                sx={{ ml: 0.5 }}
              >
                {showPreview ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Tooltip title={isSelectionMode ? "Cancel Insert" : "Insert File Content"}>
              <IconButton 
                onClick={this.handleInsertClick}
                color={isSelectionMode ? "primary" : "default"}
                size="small"
                sx={{ ml: 0.5 }}
                data-insert-mode="true"
                data-active={isSelectionMode}
              >
                <InsertDriveFileIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save">
              <IconButton 
                onClick={this.handleSave}
                size="small"
                sx={{ ml: 0.5 }}
              >
                <SaveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Box sx={{ 
          flexGrow: 1, 
          overflow: 'hidden',
          width: '100%',
          display: 'flex',
        }}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>Loading...</Box>
          ) : (
            <>
              <Box sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: activeTab === 0 ? 'block' : 'none'
              }}>
                <LaTeXEditor
                  collectionId={collectionId}
                  fileId={fileId}
                  fileName={fileName}
                  value={latexValue}
                  onContentChange={this.handleLatexChange}
                  showPreview={showPreview}
                />
              </Box>
              <Box sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: activeTab === 1 ? 'block' : 'none'
              }}>
                <MarkdownEditor
                  collectionId={collectionId}
                  fileId={fileId}
                  fileName={fileName}
                  value={markdownValue}
                  onContentChange={this.handleMarkdownChange}
                  showPreview={showPreview}
                />
              </Box>
            </>
          )}
        </Box>
      </Box>
    )
  }
}
