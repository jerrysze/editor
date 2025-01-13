import React, { useState } from 'react';
import { Button } from '@mui/material';
import { Merge } from '@mui/icons-material';
import MergeOptionsDialog from './MergeOptionsDialog';
import { QuestionGroup } from '../types/metadata';

interface MergeFilesButtonProps {
  onRefresh: () => Promise<void>;
  onNewCollection: (collectionId: string) => void;
  selectedCollectionId: string | null;
  groups?: QuestionGroup[];
}

const MergeFilesButton: React.FC<MergeFilesButtonProps> = ({ 
  onRefresh, 
  onNewCollection,
  selectedCollectionId,
  groups = []
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleMergeClick = () => {
    setDialogOpen(true);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Merge />}
        onClick={handleMergeClick}
        disabled={!groups.length}
        fullWidth
      >
        Merge Documents
      </Button>

      <MergeOptionsDialog
        open={dialogOpen}
        groups={groups}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};

export default MergeFilesButton;