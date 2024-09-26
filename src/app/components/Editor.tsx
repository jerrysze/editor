import React, { Component } from 'react';
import MarkdownLatexEditor from 'markdown-latex';
import { Box, IconButton } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';

interface AppState {
  value: string;
}

export default class Editor extends Component<{}, AppState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      value: ''
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(value: string){
    this.setState({
        value
    });
  }

  handleShare = () => {
    // Implement share functionality here
    console.log('Share button clicked');
  };

  render() {
    const { value } = this.state;
    return(
      <Box sx={{ flexGrow: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
          <IconButton onClick={this.handleShare}>
            <ShareIcon />
          </IconButton>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <MarkdownLatexEditor 
            value={value} 
            onChange={this.handleChange} 
            language='en'
            style={{ height: '100%' }}
          />
        </Box>
      </Box>
    )
  }
}