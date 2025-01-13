"use client";

import { Inter } from 'next/font/google'
import Sidebar from './components/Sidebar'
import { Box, ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { ActiveFileProvider } from './contexts/ActiveFileContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const inter = Inter({ subsets: ['latin'] })

const theme = createTheme({
  palette: {
    background: {
      sidebar: '#FFFAF0',
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          userSelect: 'none', // Prevent text selection while resizing
        },
      },
    },
  },
});

declare module '@mui/material/styles' {
  interface TypeBackground {
    sidebar: string;
  }
}

// Create a client
const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <QueryClientProvider client={queryClient}>
            <ActiveFileProvider>
              <Box sx={{ 
                display: 'flex', 
                height: '100vh', 
                overflow: 'hidden',
                position: 'relative',
              }}>
                <Sidebar />
                <Box component="main" sx={{ 
                  flexGrow: 1, 
                  overflow: 'auto',
                  position: 'relative',
                }}>
                  {children}
                </Box>
              </Box>
            </ActiveFileProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
