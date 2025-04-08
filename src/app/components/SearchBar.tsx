import React, { useState, useEffect } from 'react';
import { ListItem, TextField, InputAdornment, IconButton, Typography, Box } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm }) => {
  const [inputValue, setInputValue] = useState(searchTerm);
  
  // Apply the search term after a short delay to prevent excessive filtering during typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [inputValue, setSearchTerm]);

  // Keep input value in sync with searchTerm (if changed externally)
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  // Handle search term entry
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Clear search field
  const handleClearSearch = () => {
    setInputValue('');
    setSearchTerm('');
  };

  // Normalize search term on blur (to fix formatting)
  const handleBlur = () => {
    let normalized = inputValue.trim();
    
    // If the user entered just a number, add "Question " prefix for better results
    if (/^\d+$/.test(normalized)) {
      setInputValue(`Question ${normalized}`);
    }
  };

  return (
    <ListItem>
      <TextField
        size="small"
        fullWidth
        placeholder="Search questions..."
        value={inputValue}
        onChange={handleSearchInput}
        onBlur={handleBlur}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: inputValue && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClearSearch}>
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </ListItem>
  );
};

export default SearchBar;