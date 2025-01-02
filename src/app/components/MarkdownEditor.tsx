import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import MarkdownLatexEditor from 'markdown-latex';
import MarkdownIt from 'markdown-it';

interface MarkdownEditorProps {
  collectionId: string | null;
  fileId: string | null;
  fileName: string | null;
  value: string;
  onContentChange: (content: string) => void;
  showPreview: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onContentChange,
  showPreview
}) => {
  const [compiledOutput, setCompiledOutput] = useState('');
  const md = new MarkdownIt();

  useEffect(() => {
    const rendered = md.render(value);
    setCompiledOutput(rendered);
  }, [value]);

  return (
    <Box sx={{ flexGrow: 1, height: '100%', display: 'flex' }}>
      <Box
        sx={{
          width: showPreview ? '50%' : '100%',
          height: '100%',
          transition: 'width 0.3s ease-in-out'
        }}
      >
        <MarkdownLatexEditor 
          value={value} 
          onChange={onContentChange}
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
            preview: false, // We'll handle preview ourselves
            expand: true, 
            undo: true, 
            redo: true, 
            save: false,
            subfield: false, 
          }}
        />
      </Box>
      {showPreview && (
        <Box
          sx={{
            width: '50%',
            height: '100%',
            overflow: 'auto',
            padding: '20px',
            backgroundColor: '#f5f5f5'
          }}
        >
          <Box
            className="markdown-preview"
            sx={{
              backgroundColor: 'white',
              padding: '40px',
              minHeight: '100%',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: compiledOutput }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MarkdownEditor; 