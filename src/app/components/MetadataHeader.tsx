import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { FileMetadata } from './MetadataDialog';

interface MetadataHeaderProps {
  metadata: FileMetadata;
  fileName: string | null;
}

const MetadataHeader: React.FC<MetadataHeaderProps> = ({ metadata, fileName }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        height: '100%',
      }}
    >
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 500,
          pl: 0.5
        }}
      >
        {fileName || 'Untitled'}
      </Typography>
      <Divider orientation="vertical" flexItem />
      <Chip 
        label={metadata.format.toUpperCase()}
        size="small"
        color={metadata.format === 'latex' ? 'primary' : 'secondary'}
        variant="outlined"
        sx={{ 
          height: '24px',
          '& .MuiChip-label': {
            px: 1
          }
        }}
      />
      <Typography 
        variant="caption" 
        color="text.secondary"
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          height: '24px'
        }}
      >
        Questions: {metadata.numberOfQuestions}
      </Typography>
      {metadata.structure.length > 0 && (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            height: '24px'
          }}
        >
          Sections: {metadata.structure.length}
        </Typography>
      )}
    </Box>
  );
};

export default MetadataHeader; 