import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { FileMetadata } from './MetadataDialog';

interface MetadataHeaderProps {
  metadata: FileMetadata;
  fileName: string | null;
}

const MetadataHeader: React.FC<MetadataHeaderProps> = ({ metadata, fileName }) => {
  const getDocumentTypeColor = () => {
    switch (metadata.documentType) {
      case 'question':
        return 'primary';
      case 'answer':
        return 'success';
      case 'marking_scheme':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getDocumentTypeLabel = () => {
    switch (metadata.documentType) {
      case 'question':
        return 'Question Paper';
      case 'answer':
        return 'Answer';
      case 'marking_scheme':
        return 'Marking Scheme';
      default:
        return metadata.documentType;
    }
  };

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
      <Chip
        label={getDocumentTypeLabel()}
        size="small"
        color={getDocumentTypeColor()}
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
        Score: {metadata.score}
      </Typography>
    </Box>
  );
};

export default MetadataHeader; 