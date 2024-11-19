"use client"
import dynamic from 'next/dynamic';
import { Box } from '@mui/material';
import { useContext } from 'react';
import { ActiveFileContext } from './contexts/ActiveFileContext';

const Editor = dynamic(() => import('./components/Editor'), {
  ssr: false,
});

export default function Page() {
  const { activeFile } = useContext(ActiveFileContext);

  return (
    <Box sx={{ height: '100%', display: 'flex', position: 'relative' }}>
      <Editor
        collectionId={activeFile.collectionId}
        fileId={activeFile.fileId}
        fileName={activeFile.fileName}
      />
    </Box>
  );
}