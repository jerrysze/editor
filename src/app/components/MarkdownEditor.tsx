import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import MarkdownLatexEditor from 'markdown-latex';
import MarkdownIt from 'markdown-it';
import { PAGE_BREAK_MARKER, splitContentByPages, addPageBreakStyles } from '../utils/pageBreakUtils';

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
    addPageBreakStyles();
  }, []);

  useEffect(() => {
    const rendered = md.render(value);
    setCompiledOutput(rendered);
  }, [value]);

  const renderPreview = () => {
    const pages = splitContentByPages(value);
    
    return (
      <div className="markdown-preview-container">
        {pages.map((pageContent, index) => (
          <div key={index} className="markdown-page">
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
            preview: false,
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
          {renderPreview()}
        </Box>
      )}
    </Box>
  );
};

export default MarkdownEditor; 