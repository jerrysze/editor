import React from 'react';
import { Box } from '@mui/material';

interface ResizeHandleProps {
  onResize: (width: number) => void;
  initialWidth: number;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onResize, initialWidth }) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const startX = e.pageX;
    const startWidth = initialWidth;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.pageX - startX;
      const newWidth = startWidth + deltaX;
      onResize(newWidth);
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        right: -4,
        top: 0,
        bottom: 0,
        width: 8,
        cursor: 'col-resize',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        zIndex: 1200,
      }}
      onMouseDown={handleMouseDown}
    />
  );
};

export default ResizeHandle; 