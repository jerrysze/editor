# Editor Codebase Summary

## Project Overview
A Next.js-based editor application that supports both Markdown and LaTeX editing with real-time preview capabilities. The application features a hierarchical collection system for organizing documents, with advanced file management and metadata support.

## Core Components

### API Layer (`src/app/api.ts`)
- Core API functions for resource management
- Key endpoints:
  - `getResource/serverGetResource`: Fetch resources from backend
  - `postResource/serverPostResource`: Save/update resources
  - `getCollectionStructure/saveCollectionStructure`: Manage document collections
  - `saveFile/getFile/deleteFile`: File operations
  - `renameCollection/deleteCollection`: Collection management
  - `updateFileMetadata`: Metadata management

### Editor Components

#### Main Editor (`src/app/components/Editor.tsx`)
- Main editing interface with unified controls
- Features:
  - Dual-mode editing (Markdown/LaTeX)
  - Metadata management
  - File format detection
  - PDF export functionality
  - Real-time preview toggle
  - File merging support

#### LaTeX Editor (`src/app/components/LaTeXEditor.tsx`)
- Specialized LaTeX editing interface
- Features:
  - Real-time LaTeX preview
  - A4 page preview format
  - PDF compilation via LaTeX Online API
  - Zoom controls
  - Resizable editor panes

#### Markdown Editor (`src/app/components/MarkdownEditor.tsx`)
- Dedicated Markdown editing component
- Features:
  - Real-time Markdown preview
  - Page break support
  - A4 page layout
  - Zoom controls
  - Custom toolbar integration

### Key UI Components
1. `Sidebar.tsx`: Enhanced navigation with:
   - Collection management
   - File selection modes
   - Resizable panel
   - Search functionality
   - Context menu operations

2. `EditorToolbar.tsx`: Unified toolbar with:
   - Save functionality
   - Preview toggle
   - PDF export
   - File insertion
   - Metadata editing

3. `MetadataDialog.tsx`: Metadata management with:
   - Format selection
   - Question structure
   - Section management
   - Marking scheme support

4. `MergeFilesButton.tsx`: File merging interface with:
   - Multi-file selection
   - Order preservation
   - Content combination
   - Collection refresh

### Application Structure
- Next.js frontend with TypeScript
- Context-based state management
- RESTful API integration
- Material-UI components
- Responsive design

## Core Features
1. Document Management
   - Hierarchical collection structure
   - File operations (CRUD)
   - Metadata support
   - File merging capability

2. Editor Capabilities
   - Unified interface for Markdown/LaTeX
   - Real-time preview
   - PDF export
   - Page break support
   - Zoom controls

3. Metadata System
   - Format specification
   - Question structuring
   - Section management
   - Marking schemes

## Technical Stack
- Frontend: Next.js, TypeScript, React
- UI Framework: Material-UI
- State Management: React Context
- Editor Libraries: markdown-latex, markdown-it
- PDF Generation: jsPDF, html2canvas
- LaTeX Compilation: LaTeX Online API

## Key Files and Their Purposes
- `api.ts`: Core backend communication
- `Editor.tsx`: Main editing interface
- `LaTeXEditor.tsx`: LaTeX-specific editing
- `MarkdownEditor.tsx`: Markdown-specific editing
- `MetadataDialog.tsx`: Metadata management
- `EditorToolbar.tsx`: Unified toolbar interface
- `Sidebar.tsx`: Navigation and file management
- `MergeFilesButton.tsx`: File merging functionality

This codebase represents a sophisticated document editor with comprehensive metadata management, file organization, and format-specific editing capabilities. Recent updates have enhanced the metadata system and file management features while maintaining a clean, intuitive user interface. 