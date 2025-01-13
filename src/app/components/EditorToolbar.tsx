import React, { useState } from 'react';
import { Box, IconButton, Tooltip, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import SaveIcon from '@mui/icons-material/Save';
import ShareIcon from '@mui/icons-material/Share';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import EditIcon from '@mui/icons-material/Edit';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({
  html: true,
  breaks: true
});

interface EditorToolbarProps {
  showPreview: boolean;
  isPdfLoading: boolean;
  isSelectionMode: boolean;
  content: string;
  format: 'markdown' | 'latex';
  onSave: () => Promise<void>;
  onShare: () => void;
  onTogglePreview: () => void;
  onInsertClick: () => void;
  onMetadataOpen: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  showPreview,
  isPdfLoading,
  isSelectionMode,
  content,
  format,
  onSave,
  onShare,
  onTogglePreview,
  onInsertClick,
  onMetadataOpen,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      setSnackbar({
        open: true,
        message: 'Document saved successfully',
        severity: 'success'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setSnackbar({
        open: true,
        message: `Failed to save: ${errorMessage}`,
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const generatePDF = async () => {
    try {
      if (format === 'latex') {
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

        const pdfBlob = await response.blob();
        
        const url = window.URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setSnackbar({
          open: true,
          message: 'PDF generated successfully',
          severity: 'success'
        });
      } else {
        const tempDiv = document.createElement('div');
        tempDiv.className = 'pdf-export-container';
        const htmlContent = md.render(content);
        tempDiv.innerHTML = htmlContent;
        
        document.body.appendChild(tempDiv);

        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          logging: false
        });

        document.body.removeChild(tempDiv);

        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        pdf.save('document.pdf');

        setSnackbar({
          open: true,
          message: 'PDF generated successfully',
          severity: 'success'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setSnackbar({
        open: true,
        message: `Failed to generate PDF: ${errorMessage}`,
        severity: 'error'
      });
    }
  };

  return (
    <>
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        ml: 1.5,
      }}>
        {/* Save button - Most important action first */}
        <Tooltip title="Save">
          <IconButton 
            onClick={handleSave}
            size="small"
            sx={{ ml: 0.5 }}
            disabled={isSaving}
          >
            {isSaving ? (
              <CircularProgress size={20} />
            ) : (
              <SaveIcon fontSize="small" />
            )}
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
            onClick={generatePDF} 
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

export default EditorToolbar; 