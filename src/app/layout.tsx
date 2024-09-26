"use client";

import { Inter } from 'next/font/google'
import Sidebar from './components/Sidebar'
import { Box, ThemeProvider, createTheme, CssBaseline } from '@mui/material'

const inter = Inter({ subsets: ['latin'] })

const theme = createTheme({
  palette: {
    background: {
      sidebar: '#FFFAF0', // Very light blue color
    },
  },
});

// Add this to extend the theme type
declare module '@mui/material/styles' {
  interface TypeBackground {
    sidebar: string;
  }
}

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
          <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <Box component="main" sx={{ flexGrow: 1, overflow: 'auto' }}>
              {children}
            </Box>
          </Box>
        </ThemeProvider>
      </body>
    </html>
  )
}
