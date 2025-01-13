import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import { FileMetadata } from '../types/metadata';
import PersonIcon from '@mui/icons-material/Person';

interface MetadataHeaderProps {
  metadata?: FileMetadata | null;
  fileName: string | null;
}

const MetadataHeader: React.FC<MetadataHeaderProps> = ({ metadata, fileName }) => {
  const getDocumentTypeColor = () => {
    if (!metadata?.documentType) return 'default';
    
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

  if (!metadata) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: '100%' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 500, pl: 0.5 }}>
          {fileName || 'Untitled'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: '100%' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 500, pl: 0.5 }}>
        {fileName || 'Untitled'}
      </Typography>
      <Divider orientation="vertical" flexItem />
      
      {metadata.questionLabel && (
        <Chip
          label={metadata.questionLabel}
          size="small"
          color="info"
          variant="outlined"
          sx={{ height: '24px' }}
        />
      )}
      
      <Chip 
        label={metadata.format?.toUpperCase() || 'UNKNOWN'}
        size="small"
        color={metadata.format === 'latex' ? 'primary' : 'secondary'}
        variant="outlined"
        sx={{ height: '24px' }}
      />
      
      <Chip
        label={metadata.documentType?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
        size="small"
        color={getDocumentTypeColor()}
        variant="outlined"
        sx={{ height: '24px' }}
      />

      {metadata.score !== undefined && (
        <Typography variant="caption" color="text.secondary">
          Score: {metadata.score}
        </Typography>
      )}
    </Box>
  );
};

export default MetadataHeader; 