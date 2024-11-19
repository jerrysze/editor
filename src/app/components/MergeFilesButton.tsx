import React, { useContext } from 'react';
import { Button, Badge } from '@mui/material';
import { Merge } from '@mui/icons-material';
import { ActiveFileContext } from '../contexts/ActiveFileContext';
import { serverPostResource, getFile } from '../api';

interface MergeFilesButtonProps {
  onRefresh: () => Promise<void>;
  onNewCollection: (collectionId: string) => void;
}

const MergeFilesButton: React.FC<MergeFilesButtonProps> = ({ onRefresh, onNewCollection }) => {
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
      // Enter merge selection mode
      setSelectionMode(true);
      setSelectionType('merge');
      setSelectedFiles([]); // Clear any previous selections
    } else if (selectionType === 'merge') {
      if (selectedFiles.length >= 2) {
        try {
          const mergedContent = await getMergedContent();

          // Generate a unique ID for the new collection
          const newCollectionId = crypto.randomUUID();
          
          // Create a new collection
          const collectionResponse = await serverPostResource('create_collection', JSON.stringify({
            collection_id: newCollectionId,
            collection_name: 'Merged Files',
            parent_id: null
          }));

          if (collectionResponse.data) {
            // Generate a unique ID for the new file
            const newFileId = crypto.randomUUID();
            
            // Create a new merged file in the new collection
            const fileResponse = await serverPostResource('create_file', JSON.stringify({
              collection_id: newCollectionId,
              file_id: newFileId,
              file_name: 'untitled',
              content: mergedContent,
            }));

            // Refresh and notify
            await onRefresh();
            onNewCollection(newCollectionId);
          }
        } catch (error) {
          console.error('Error during merge process:', error);
        }
      }

      // Reset selection mode and clear selections
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