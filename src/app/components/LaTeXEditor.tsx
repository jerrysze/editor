import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, ButtonGroup, CircularProgress } from '@mui/material';
import { ZoomIn, ZoomOut } from '@mui/icons-material';
import { getFile } from '@/app/api';
import { parse, HtmlGenerator } from 'latex.js'
import ResizeHandle from './ResizeHandle';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('./PDFViewer'), {
  ssr: false,
  loading: () => <div>Loading PDF viewer...</div>,
});

interface LaTeXEditorProps {
  collectionId: string | null;
  fileId: string | null;
  fileName: string | null;
  value: string;
  onContentChange: (content: string) => void;
  showPreview: boolean;
}

const MIN_EDITOR_WIDTH = 200;
const MAX_EDITOR_WIDTH = 1200;
const DEFAULT_EDITOR_WIDTH = 600;

const MIN_ZOOM = 50;
const MAX_ZOOM = 200;
const ZOOM_STEP = 10;

const LaTeXEditor: React.FC<LaTeXEditorProps> = ({ 
  collectionId, 
  fileId, 
  fileName, 
  value, 
  onContentChange,
  showPreview
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [editorWidth, setEditorWidth] = useState(DEFAULT_EDITOR_WIDTH);
  const [zoom, setZoom] = useState(100);

  // A4 size in pixels (assuming 96 DPI)
  const A4_WIDTH_PX = 595;  // Adjusted for better screen display
  const A4_HEIGHT_PX = 842; // Adjusted for better screen display

  useEffect(() => {
    compileLatex(value);
  }, [value]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    onContentChange(newValue);
  };

  const handleResize = (newWidth: number) => {
    setEditorWidth(Math.min(Math.max(newWidth, MIN_EDITOR_WIDTH), MAX_EDITOR_WIDTH));
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  };

  const compileLatex = async (latex: string) => {
    if (!latex.trim()) {
      setPdfUrl(null);
      return;
    }

    try {
      setCompiling(true);
      setCompilationError(null);

      const response = await fetch('/api/latex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latexText: latex }),
      });

      if (!response.ok) {
        throw new Error('Compilation failed');
      }

      const pdfBlob = await response.blob();
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      setCompilationError(`Error compiling LaTeX: ${error instanceof Error ? error.message : String(error)}`);
      setPdfUrl(null);
    } finally {
      setCompiling(false);
    }
  };

  return (
    <Box 
      id="latex-editor-container"
      sx={{ 
        flexGrow: 1, 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          position: 'relative',
          overflow: 'hidden',
          mt: '48px',
        }}
      >
        <Box
          sx={{
            width: showPreview ? editorWidth : '100%',
            height: '100%',
            position: 'relative',
            transition: showPreview ? 'none' : 'width 0.3s ease-in-out'
          }}
        >
          <textarea
            value={value}
            onChange={handleChange}
            style={{ 
              width: '100%',
              height: '100%',
              resize: 'none',
              padding: '10px',
              lineHeight: '1.5',
              fontFamily: 'monospace',
              fontSize: '14px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              backgroundColor: '#ffffff',
            }}
            placeholder="Enter your LaTeX here..."
          />
          {showPreview && (
            <ResizeHandle onResize={handleResize} initialWidth={editorWidth} />
          )}
        </Box>
        {showPreview && (
          <Box
            sx={{
              flexGrow: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px 8px',
                borderBottom: '1px solid #e0e0e0',
                backgroundColor: '#f5f5f5',
                minHeight: '40px',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                width: '100%',
              }}
            >
              <ButtonGroup 
                size="small"
                sx={{
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                }}
              >
                <IconButton 
                  onClick={handleZoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  size="small"
                >
                  <ZoomOut fontSize="small" />
                </IconButton>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
                    borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                    minWidth: '60px',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2">{zoom}%</Typography>
                </Box>
                <IconButton 
                  onClick={handleZoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  size="small"
                >
                  <ZoomIn fontSize="small" />
                </IconButton>
              </ButtonGroup>
            </Box>
            <Box
              sx={{
                flexGrow: 1,
                overflow: 'auto',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px'
              }}
            >
              {compiling ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <CircularProgress size={24} />
                  <Typography sx={{ mt: 1 }}>Compiling LaTeX...</Typography>
                </Box>
              ) : compilationError ? (
                <Typography color="error" sx={{ p: 2 }}>{compilationError}</Typography>
              ) : pdfUrl ? (
                <Box
                  className="latex-preview"
                  sx={{
                    width: A4_WIDTH_PX,
                    minHeight: A4_HEIGHT_PX,
                    backgroundColor: 'white',
                    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                    marginBottom: `${zoom - 100}%`,
                    overflow: 'hidden', // Prevent content overflow
                  }}
                >
                  <PDFViewer pdfUrl={pdfUrl} />
                </Box>
              ) : (
                <Typography sx={{ p: 2 }}>
                  No output to display. Enter LaTeX in the editor.
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default LaTeXEditor;
