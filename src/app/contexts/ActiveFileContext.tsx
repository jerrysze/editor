import React, { createContext, useState, ReactNode } from 'react';

interface ActiveFile {
  collectionId: string | null;
  fileId: string | null;
  fileName: string | null;
}

interface SelectedFile extends ActiveFile {
  selectionOrder: number;
}

type SelectionMode = 'none' | 'insert' | 'merge';

interface ActiveFileContextType {
  activeFile: ActiveFile;
  setActiveFile: React.Dispatch<React.SetStateAction<ActiveFile>>;
  selectedFiles: SelectedFile[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<SelectedFile[]>>;
  isSelectionMode: boolean;
  setSelectionMode: React.Dispatch<React.SetStateAction<boolean>>;
  selectionType: SelectionMode;
  setSelectionType: React.Dispatch<React.SetStateAction<SelectionMode>>;
}

export const ActiveFileContext = createContext<ActiveFileContextType>({
  activeFile: { collectionId: null, fileId: null, fileName: null },
  setActiveFile: () => {},
  selectedFiles: [],
  setSelectedFiles: () => {},
  isSelectionMode: false,
  setSelectionMode: () => {},
  selectionType: 'none',
  setSelectionType: () => {},
});

export const ActiveFileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeFile, setActiveFile] = useState<ActiveFile>({
    collectionId: null,
    fileId: null,
    fileName: null,
  });
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isSelectionMode, setSelectionMode] = useState(false);
  const [selectionType, setSelectionType] = useState<SelectionMode>('none');

  return (
    <ActiveFileContext.Provider value={{ 
      activeFile, 
      setActiveFile, 
      selectedFiles, 
      setSelectedFiles,
      isSelectionMode,
      setSelectionMode,
      selectionType,
      setSelectionType
    }}>
      {children}
    </ActiveFileContext.Provider>
  );
};