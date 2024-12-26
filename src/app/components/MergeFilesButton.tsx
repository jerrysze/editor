import React, { useContext } from 'react';
import { Button, Badge } from '@mui/material';
import { Merge } from '@mui/icons-material';
import { ActiveFileContext } from '../contexts/ActiveFileContext';
import { serverPostResource, getFile } from '../api';

interface MergeFilesButtonProps {
  onRefresh: () => Promise<void>;
  onNewCollection: (collectionId: string) => void;
  selectedCollectionId: string | null;
}

const MergeFilesButton: React.FC<MergeFilesButtonProps> = ({ 
  onRefresh, 
  onNewCollection,
  selectedCollectionId 
}) => {
  const { 
    isSelectionMode, 
    setSelectionMode, 
    selectedFiles, 
    setSelectedFiles,
    setSelectionType,
    selectionType 
  } = useContext(ActiveFileContext);

  const getMergedContent = async () => {
    // Sort files by selection order
    const orderedFiles = [...selectedFiles].sort((a, b) => a.selectionOrder - b.selectionOrder);
    
    // Fetch and merge content
    const mergedContent = await Promise.all(
      orderedFiles.map(async (file) => {
        try {
          if (!file.fileId) {
            console.error(`File ${file.fileName} has no ID`);
            return { fileName: file.fileName, content: '' };
          }

          const fileData = await getFile(file.fileId);
          if (fileData?.data?.editor_files?.[0]?.content) {
            return {
              fileName: file.fileName,
              content: fileData.data.editor_files[0].content
            };
          }
          return { fileName: file.fileName, content: '' };
        } catch (error) {
          console.error(`Error fetching content for file ${file.fileName}:`, error);
          return { fileName: file.fileName, content: '' };
        }
      })
    );

    // Combine the content with file names as comments
    return mergedContent.map(({ fileName, content }) => (
      `% ============ ${fileName} ============\n${content}\n\n`
    )).join('');
  };

  const handleMergeClick = async () => {
    if (!isSelectionMode) {
      setSelectionMode(true);
      setSelectionType('merge');
      setSelectedFiles([]);
    } else if (selectionType === 'merge') {
      if (selectedFiles.length >= 2 && selectedCollectionId) {
        try {
          const mergedContent = await getMergedContent();
          
          // Create new file in the current collection
          const newFileId = crypto.randomUUID();
          const fileResponse = await serverPostResource('create_file', JSON.stringify({
            collection_id: selectedCollectionId,
            file_id: newFileId,
            file_name: 'Merged File',
            content: mergedContent,
          }));

          // Refresh the view
          await onRefresh();
          onNewCollection(selectedCollectionId);
        } catch (error) {
          console.error('Error during merge process:', error);
        }
      }

      setSelectionMode(false);
      setSelectionType('none');
      setSelectedFiles([]);
    }
  };

  const getButtonText = () => {
    if (!isSelectionMode || selectionType !== 'merge') return 'Merge Files';
    if (selectedFiles.length < 2) return `Select Files (${selectedFiles.length})`;
    return `Merge ${selectedFiles.length} Files`;
  };

  return (
    <Badge 
      badgeContent={selectionType === 'merge' ? selectedFiles.length : 0} 
      color="primary" 
      sx={{ width: '100%' }}
    >
      <Button
        variant={isSelectionMode && selectionType === 'merge' ? "contained" : "outlined"}
        startIcon={<Merge />}
        onClick={handleMergeClick}
        color={isSelectionMode && selectionType === 'merge' ? "primary" : "inherit"}
        fullWidth
      >
        {getButtonText()}
      </Button>
    </Badge>
  );
};

export default MergeFilesButton;