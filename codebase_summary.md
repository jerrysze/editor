# Editor Codebase Summary

## Project Overview
A Next.js-based editor application that supports both Markdown and LaTeX editing with real-time preview capabilities. The application features a hierarchical collection system for organizing documents and templates.

## Core Components

### API Layer (`src/app/api.ts`)
- Core API functions for resource management
- Key endpoints:
  - `getResource/serverGetResource`: Fetch resources from backend
  - `postResource/serverPostResource`: Save/update resources
  - `getCollectionStructure/saveCollectionStructure`: Manage document collections
  - `saveFile/getFile/deleteFile`: File operations
  - `renameCollection/deleteCollection`: Collection management

### Editor Component (`src/app/components/Editor.tsx`)
- Main editing interface
- Features:
  - Dual-mode editing (Markdown/LaTeX)
  - Real-time preview
  - File saving and sharing
  - Document merging capabilities
- State management for:
  - Editor content
  - Active tab
  - Preview visibility
  - Loading states

### Key UI Components
1. `LaTeXEditor.tsx`: Specialized LaTeX editing interface
2. `TemplatesList.tsx`: Template management interface
3. `Sidebar.tsx`: Navigation and file structure
4. `CollectionsList.tsx`: Document collection management
5. `SearchBar.tsx`: Search functionality
6. `MergeFilesButton.tsx`: File merging interface

### Application Structure
- Next.js frontend with TypeScript
- Context-based state management
- RESTful API integration
- Modern UI with Material-UI components

## Core Features
1. Document Management
   - Hierarchical collection structure
   - File operations (create, read, update, delete)
   - Template system

2. Editor Capabilities
   - Markdown and LaTeX support
   - Split-view editing
   - Real-time preview
   - File merging
   - Document sharing

3. User Interface
   - Responsive design
   - Intuitive navigation
   - Search functionality
   - Modern Material-UI components

## Technical Stack
- Frontend: Next.js, TypeScript, React
- UI Framework: Material-UI
- State Management: React Context
- Editor Libraries: markdown-latex
- Build Tools: Tailwind CSS, PostCSS

## Key Files and Their Purposes
- `api.ts`: Core backend communication
- `Editor.tsx`: Main editing interface
- `Sidebar.tsx`: Navigation and structure
- `TemplatesList.tsx`: Template management
- `CollectionsList.tsx`: Collection organization
- `types.ts`: TypeScript type definitions

This codebase represents a modern document editor with emphasis on academic and technical writing, supporting both Markdown and LaTeX formats while maintaining a clean and intuitive user interface. 