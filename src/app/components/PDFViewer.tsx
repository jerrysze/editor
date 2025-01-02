'use client';

import { useState } from 'react';
import { Box, CircularProgress } from '@mui/material';

interface PDFViewerProps {
  pdfUrl: string;
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <iframe 
        src={pdfUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        onLoad={() => setLoading(false)}
      />
      {loading && (
        <Box 
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
} 