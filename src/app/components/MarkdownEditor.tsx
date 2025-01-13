import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, ButtonGroup } from '@mui/material';
import { ZoomIn, ZoomOut, InsertPageBreak } from '@mui/icons-material';
import MarkdownLatexEditor from 'markdown-latex';
import MarkdownIt from 'markdown-it';
import { PAGE_BREAK_MARKER, splitContentByPages, addPageBreakStyles } from '../utils/pageBreakUtils';
import ResizeHandle from './ResizeHandle';

interface MarkdownEditorProps {
  collectionId: string | null;
  fileId: string | null;
  fileName: string | null;
  value: string;
  onContentChange: (content: string) => void;
  showPreview: boolean;
}

const md = new MarkdownIt({
  html: true,
  breaks: true
});

md.renderer.rules.html_block = function(tokens, idx) {
  const content = tokens[idx].content;
  if (content.startsWith('<!--') && content.endsWith('-->')) {
    return content;
  }
  return tokens[idx].content;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onContentChange,
  showPreview
}) => {
  const [compiledOutput, setCompiledOutput] = useState('');
  const [editorWidth, setEditorWidth] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    addPageBreakStyles();
  }, []);

  useEffect(() => {
    const rendered = md.render(value);
    setCompiledOutput(rendered);
  }, [value]);

  useEffect(() => {
    const container = document.getElementById('markdown-editor-container');
    if (container) {
      if (showPreview) {
        setEditorWidth(container.clientWidth / 2);
      } else {
        setEditorWidth(0);
      }
    }
  }, [showPreview]);

  const handleResize = (newWidth: number) => {
    setEditorWidth(newWidth);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 10, 50));
  };

  const handleInsertPageBreak = () => {
    const editor = document.querySelector('.for-editor-edit textarea');
    if (editor instanceof HTMLTextAreaElement) {
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const newContent = value.substring(0, start) + 
        `\n${PAGE_BREAK_MARKER}\n` + 
        value.substring(end);
      onContentChange(newContent);
      
      setTimeout(() => {
        editor.selectionStart = editor.selectionEnd = 
          start + PAGE_BREAK_MARKER.length + 2;
        editor.focus();
      }, 0);
    }
  };

  const renderPreview = () => {
    const pages = splitContentByPages(value);
    
    return (
      <div className="markdown-preview-container" style={{ padding: '10px' }}>
        {pages.map((pageContent, index) => (
          <div 
            key={index} 
            className="markdown-page"
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              marginBottom: `${Math.max(10, 10 * (zoom / 100))}px`,
              padding: '20px',
            }}
          >
            <div className="markdown-content">
              <div dangerouslySetInnerHTML={{ __html: md.render(pageContent) }} />
            </div>
            {index < pages.length - 1 && <div className="page-break-preview" />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Box 
      id="markdown-editor-container"
      sx={{ flexGrow: 1, height: '100%', display: 'flex' }}
    >
      <Box
        sx={{
          width: showPreview ? `${editorWidth}px` : '100%',
          height: '100%',
          transition: showPreview ? 'none' : 'width 0.3s ease-in-out',
          borderRight: showPreview ? '1px solid #e0e0e0' : 'none',
          position: 'relative'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '8px',
            right: '715px',
            zIndex: 1001,
            display: 'flex',
            gap: 1,
            '& .MuiIconButton-root': {
              padding: '4px',
              borderRadius: '2px',
              '&:hover': {
                backgroundColor: '#f0f0f0',
              }
            }
          }}
        >
          <IconButton
            onClick={handleInsertPageBreak}
            size="small"
            title="Insert page break"
          >
            <InsertPageBreak fontSize="small" />
          </IconButton>
        </Box>

        <MarkdownLatexEditor 
          value={value} 
          onChange={onContentChange}
          language='en'
          style={{ 
            height: '100%',
            border: 'none',
            borderRadius: 0
          }}
          toolbar={{
            h1: true, 
            h2: true, 
            h3: true, 
            h4: true, 
            img: true, 
            link: true, 
            code: true, 
            preview: false,
            expand: true, 
            undo: true, 
            redo: true, 
            save: false,
            subfield: false,
          }}
        />
        {showPreview && (
          <ResizeHandle 
            onResize={handleResize} 
            initialWidth={editorWidth}
            minWidth={200}
            maxWidth={1200}
          />
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
                disabled={zoom <= 50}
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
                disabled={zoom >= 200}
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
              padding: '10px',
              backgroundColor: '#f5f5f5',
            }}
          >
            {renderPreview()}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MarkdownEditor; 