import React, { Component } from 'react';
import MarkdownLatexEditor from 'markdown-latex';
import LaTeXEditor from './LaTeXEditor';
import { Box, IconButton, Tooltip, CircularProgress } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { saveFile, getFile, updateFileMetadata } from '@/app/api';
import { ActiveFileContext } from '../contexts/ActiveFileContext';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import ShareIcon from '@mui/icons-material/Share';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MarkdownEditor from './MarkdownEditor';
import { splitContentByPages } from '../utils/pageBreakUtils';
import EditIcon from '@mui/icons-material/Edit';
import MetadataDialog, { FileMetadata } from './MetadataDialog';
import MetadataHeader from './MetadataHeader';
import EditorToolbar from './EditorToolbar';

interface AppState {
  markdownValue: string;
  latexValue: string;
  testResult: string;
  isLoading: boolean;
  showPreview: boolean;
  isPdfLoading: boolean;
  isMetadataDialogOpen: boolean;
  metadata: FileMetadata;
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
    const defaultMetadata: FileMetadata = {
      format: 'latex',
      numberOfQuestions: 0,
      structure: []
    };
    this.state = {
      markdownValue: '',
      latexValue: '',
      testResult: '',
      isLoading: false,
      showPreview: false,
      isPdfLoading: false,
      isMetadataDialogOpen: false,
      metadata: defaultMetadata
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
          const file = fileData.data.editor_files[0];
          const content = file.content;
          const metadata = file.metadata || {
            format: getEditorTypeFromFileName(fileName) === 1 ? 'markdown' : 'latex',
            numberOfQuestions: 0,
            structure: []
          };
          
          this.setState({ 
            markdownValue: content,
            latexValue: content,
            metadata
          });
        } else {
          this.setState({ 
            markdownValue: '',
            latexValue: '',
            metadata: {
              format: getEditorTypeFromFileName(fileName) === 1 ? 'markdown' : 'latex',
              numberOfQuestions: 0,
              structure: []
            }
          });
        }
      } catch (error) {
        console.error("Error loading file content:", error);
        this.setState({ 
          markdownValue: '',
          latexValue: '',
          metadata: {
            format: getEditorTypeFromFileName(fileName) === 1 ? 'markdown' : 'latex',
            numberOfQuestions: 0,
            structure: []
          }
        });
      } finally {
        this.setState({ isLoading: false });
      }
    } else {
      this.setState({ 
        markdownValue: '',
        latexValue: '',
        metadata: {
          format: getEditorTypeFromFileName(fileName) === 1 ? 'markdown' : 'latex',
          numberOfQuestions: 0,
          structure: []
        }
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

  togglePreview = () => {
    this.setState(prevState => ({ showPreview: !prevState.showPreview }));
  };

  handleShare = async () => {
    try {
      this.setState({ isPdfLoading: true });
      
      if (!this.state.showPreview) {
        await new Promise<void>(resolve => {
          this.setState({ showPreview: true }, () => {
            setTimeout(resolve, 500);
          });
        });
      }

      if (this.state.activeTab === 0) {
        // Existing LaTeX handling...
      } else {
        const pages = splitContentByPages(this.state.markdownValue);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'pt',
          format: 'a4'
        });

        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
          if (pageIndex > 0) {
            pdf.addPage();
          }

          const pageElement = document.querySelector(`.markdown-page:nth-child(${pageIndex + 1})`);
          if (!pageElement) continue;

          const canvas = await html2canvas(pageElement as HTMLElement, {
            scale: 2, // Increase quality
            useCORS: true,
            logging: false
          });

          const imgData = canvas.toDataURL('image/png');
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
        }

        const fileName = this.props.fileName?.replace(/\.[^/.]+$/, "") || 'document';
        pdf.save(`${fileName}.pdf`);
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      if (!this.state.showPreview) {
        this.setState({ showPreview: false });
      }
      this.setState({ isPdfLoading: false });
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

  handleMetadataOpen = async () => {
    const { fileId } = this.props;
    
    if (fileId) {
      try {
        const fileData = await getFile(fileId);
        if (fileData?.data?.editor_files?.[0]?.metadata) {
          const metadata = fileData.data.editor_files[0].metadata;
          this.setState({ 
            metadata,
            isMetadataDialogOpen: true 
          }, () => {
          });
        } else {
          this.setState({ isMetadataDialogOpen: true });
        }
      } catch (error) {
        console.error("Error loading metadata:", error);
        this.setState({ isMetadataDialogOpen: true });
      }
    } else {
      this.setState({ isMetadataDialogOpen: true });
    }
  };

  handleMetadataClose = () => {
    this.setState({ isMetadataDialogOpen: false });
  };

  handleMetadataSave = async (metadata: FileMetadata) => {
    const { fileId } = this.props;
    
    if (!fileId) {
      console.error('No file ID available');
      return;
    }

    try {
      const response = await updateFileMetadata(fileId, metadata);
      
      if (response && response.success) {
        this.setState({ metadata });
        console.log('Metadata updated successfully');
      } else {
        throw new Error('Failed to update metadata');
      }
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  };

  render() {
    const { markdownValue, latexValue, isLoading, showPreview, isPdfLoading, metadata } = this.state;
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
        overflow: 'hidden',
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 0.5,
          px: 1,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: 'white',
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          minHeight: '48px',
          width: '100%',
        }}>
          <MetadataHeader 
            metadata={metadata}
            fileName={fileName}
          />
          <EditorToolbar
            showPreview={showPreview}
            isPdfLoading={isPdfLoading}
            isSelectionMode={isSelectionMode}
            onSave={this.handleSave}
            onShare={this.handleShare}
            onTogglePreview={this.togglePreview}
            onInsertClick={this.handleInsertClick}
            onMetadataOpen={this.handleMetadataOpen}
          />
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
            metadata.format === 'latex' ? (
              <LaTeXEditor
                collectionId={collectionId}
                fileId={fileId}
                fileName={fileName}
                value={latexValue}
                onContentChange={this.handleLatexChange}
                showPreview={showPreview}
              />
            ) : (
              <MarkdownEditor
                collectionId={collectionId}
                fileId={fileId}
                fileName={fileName}
                value={markdownValue}
                onContentChange={this.handleMarkdownChange}
                showPreview={showPreview}
              />
            )
          )}
        </Box>
        <MetadataDialog
          open={this.state.isMetadataDialogOpen}
          onClose={this.handleMetadataClose}
          onSave={this.handleMetadataSave}
          fileName={this.props.fileName}
          initialMetadata={this.state.metadata}
        />
      </Box>
    )
  }
}
