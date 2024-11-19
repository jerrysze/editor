import React, { Component } from 'react';
import MarkdownLatexEditor from 'markdown-latex';
import LaTeXEditor from './LaTeXEditor';
import { Box, IconButton, Tabs, Tab, Tooltip } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { saveFile, getFile } from '@/app/api';
import { ActiveFileContext } from '../contexts/ActiveFileContext';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import ShareIcon from '@mui/icons-material/Share';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

interface AppState {
  markdownValue: string;
  latexValue: string;
  testResult: string;
  isLoading: boolean;
  activeTab: number;
  showPreview: boolean;
}

interface EditorProps {
  collectionId: string | null;
  fileId: string | null;
  fileName: string | null;
}

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
      showPreview: false
    };
    this.handleMarkdownChange = this.handleMarkdownChange.bind(this);
    this.handleLatexChange = this.handleLatexChange.bind(this);
  }

  componentDidMount() {
    this.loadFileContent();
  }

  componentDidUpdate(prevProps: EditorProps, prevState: AppState) {
    if (prevProps.fileId !== this.props.fileId) {
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
    const { fileId } = this.props;
    if (fileId) {
      this.setState({ isLoading: true });
      try {
        const fileData = await getFile(fileId);
        if (fileData && fileData.data && fileData.data.editor_files && fileData.data.editor_files[0]) {
          const content = fileData.data.editor_files[0].content;
          this.setState({ 
            markdownValue: content,
            latexValue: content
          });
        } else {
          this.setState({ 
            markdownValue: '',
            latexValue: ''
          });
        }
      } catch (error) {
        console.error("Error loading file content:", error);
        this.setState({ 
          markdownValue: '',
          latexValue: ''
        });
      } finally {
        this.setState({ isLoading: false });
      }
    } else {
      this.setState({ 
        markdownValue: '',
        latexValue: ''
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
        // First ensure preview is visible
        if (!this.state.showPreview) {
          await new Promise<void>(resolve => {
            this.setState({ showPreview: true }, () => {
              setTimeout(resolve, 500);
            });
          });
        }
        
        const previewElement = document.querySelector('.latex-preview');
        if (!previewElement) {
          console.error('No preview element found');
          return;
        }

        const htmlElement = previewElement as HTMLElement;
        const contentDiv = htmlElement.querySelector('div') as HTMLElement;
        
        if (!contentDiv) {
          console.error('No content element found');
          return;
        }

        // Create PDF with A4 dimensions
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });

        // Get the total height of the content
        const contentHeight = contentDiv.offsetHeight;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        // Calculate number of pages needed
        const totalPages = Math.ceil(contentHeight / pageHeight);
        
        // Create canvas for each page
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage();
          }

          const canvas = await html2canvas(contentDiv, {
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
      }
    } else {
      console.log('PDF export not implemented for Markdown mode');
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
    const { markdownValue, latexValue, isLoading, activeTab, showPreview } = this.state;
    const { collectionId, fileId, fileName } = this.props;
    const { isSelectionMode } = this.context;

    return(
      <Box sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
          <Tabs value={activeTab} onChange={this.handleTabChange}>
            <Tab label="LaTeX" />
            <Tab label="Markdown" />
          </Tabs>
          <Box>
            <Tooltip title="Share as PDF">
              <IconButton onClick={this.handleShare} sx={{ mr: 1 }}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={showPreview ? "Hide Preview" : "Show Preview"}>
              <IconButton onClick={this.togglePreview} sx={{ mr: 1 }}>
                {showPreview ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </Tooltip>
            <Tooltip title={isSelectionMode ? "Cancel Insert" : "Insert File Content"}>
              <IconButton 
                onClick={this.handleInsertClick}
                color={isSelectionMode ? "primary" : "default"}
                sx={{ mr: 1 }}
                data-insert-mode="true"
                data-active={isSelectionMode}
              >
                <InsertDriveFileIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save">
              <IconButton onClick={this.handleSave}>
                <SaveIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              {activeTab === 0 && (
                <LaTeXEditor
                  collectionId={collectionId}
                  fileId={fileId}
                  fileName={fileName}
                  value={latexValue}
                  onContentChange={this.handleLatexChange}
                  showPreview={showPreview}
                />
              )}
              {activeTab === 1 && (
                <MarkdownLatexEditor 
                  value={markdownValue} 
                  onChange={this.handleMarkdownChange} 
                  language='en'
                  style={{ height: '100%' }}
                  toolbar={{
                    h1: true, 
                    h2: true, 
                    h3: true, 
                    h4: true, 
                    img: true, 
                    link: true, 
                    code: true, 
                    preview: true, 
                    expand: true, 
                    undo: true, 
                    redo: true, 
                    save: false,
                    subfield: true, 
                  }}
                />
              )}
            </>
          )}
        </Box>
      </Box>
    )
  }
}
