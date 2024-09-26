"use client"
import dynamic from 'next/dynamic';
import { Box } from '@mui/material';

const Editor = dynamic(() => import('./components/Editor'), {
  ssr: false,
});

export default function Page() {
  return (
    <Box sx={{ height: '100%', display: 'flex', position: 'relative' }}>
      <Editor />
    </Box>
  );
}