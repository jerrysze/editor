import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { getFile } from '@/app/api';
import { parse, HtmlGenerator } from 'latex.js'

interface LaTeXEditorProps {
  collectionId: string | null;
  fileId: string | null;
  fileName: string | null;
  value: string;
  onContentChange: (content: string) => void;
  showPreview: boolean;
}

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
          
          // Log the rendered text content
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
    <Box sx={{ flexGrow: 1, height: '100%', display: 'flex' }}>
      <Box
        sx={{
          width: showPreview ? '50%' : '100%',
          height: '100%',
          transition: 'width 0.3s ease-in-out'
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
          }}
          placeholder="Enter your LaTeX here..."
        />
      </Box>
      {showPreview && (
        <Box
          sx={{
            width: '50%',
            height: '100%',
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
              width: `${A4_WIDTH_PX}px`,
              backgroundColor: 'white',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
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
      )}
    </Box>
  );
};

export default LaTeXEditor;
