import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, ButtonGroup } from '@mui/material';
import { ZoomIn, ZoomOut } from '@mui/icons-material';
import { getFile } from '@/app/api';
import { parse, HtmlGenerator } from 'latex.js'
import ResizeHandle from './ResizeHandle';

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
  const [compiledOutput, setCompiledOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    if (!latex.trim()) {
      setCompiledOutput('');
      return;
    }
    try {
      const generator = new HtmlGenerator({ hyphenate: false });
      const doc = parse(latex, { generator: generator });
      if (doc && doc.domFragment) {
        const fragment = doc.domFragment();
        if (fragment instanceof DocumentFragment) {
          const tempDiv = document.createElement('div');
          tempDiv.appendChild(fragment.cloneNode(true));
          
          // Add styles from latex.js
          const styles = doc.stylesAndScripts("https://cdn.jsdelivr.net/npm/latex.js@0.12.4/dist/");
          tempDiv.insertBefore(styles, tempDiv.firstChild);
          
          const output = tempDiv.innerHTML;
          console.log('Rendered LaTeX text:', tempDiv.textContent);
          
          setCompiledOutput(output || 'Error: Empty HTML output');
        } else {
          setError('Error: Invalid DOM fragment');
        }
      } else {
        setError('Error: Unable to generate DOM fragment');
      }
    } catch (error) {
      setError(`Error compiling LaTeX: ${error instanceof Error ? error.message : String(error)}`);
      setCompiledOutput('');
    }
  };

  return (
    <Box 
      id="latex-editor-container"
      sx={{ 
        flexGrow: 1, 
        height: '100%', 
        display: 'flex',
        position: 'relative',
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
            <Box
              className="latex-preview"
              sx={{
                width: A4_WIDTH_PX,
                backgroundColor: 'white',
                boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                marginBottom: `${zoom - 100}%`,
              }}
            >
              {error ? (
                <Typography color="error">{error}</Typography>
              ) : compiledOutput ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: compiledOutput }}
                  style={{
                    padding: '40px',
                  }}
                />
              ) : (
                <Typography sx={{ p: 2 }}>
                  No output to display. Enter LaTeX in the editor.
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default LaTeXEditor;
