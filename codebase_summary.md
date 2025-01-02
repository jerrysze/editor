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

### Editor Components

#### Main Editor (`src/app/components/Editor.tsx`)
- Main editing interface with unified controls
- Features:
  - Dual-mode editing (Markdown/LaTeX)
  - Consistent toolbar across modes
  - PDF export for both formats
  - File insertion capability
  - Real-time preview toggle
- State management for:
  - Editor content
  - Active tab
  - Preview visibility
  - Loading states

#### LaTeX Editor (`src/app/components/LaTeXEditor.tsx`)
- Specialized LaTeX editing interface
- Real-time LaTeX preview
- A4 page preview format
- PDF export support

#### Markdown Editor (`src/app/components/MarkdownEditor.tsx`)
- Dedicated Markdown editing component
- Features:
  - Real-time Markdown preview using markdown-it
  - Split-view editing
  - PDF export support
  - Consistent preview layout with LaTeX editor
- Integrates markdown-latex editor with custom preview

### Key UI Components
1. `TemplatesList.tsx`: Template management interface
2. `Sidebar.tsx`: Navigation and file structure
3. `CollectionsList.tsx`: Document collection management
4. `SearchBar.tsx`: Search functionality
5. `MergeFilesButton.tsx`: File merging interface

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
   - Unified interface for Markdown and LaTeX
   - Split-view editing
   - Real-time preview for both formats
   - PDF export functionality
   - File merging
   - Document sharing

3. User Interface
   - Responsive design
   - Intuitive navigation
   - Search functionality
   - Modern Material-UI components
   - Consistent preview modes

## Technical Stack
- Frontend: Next.js, TypeScript, React
- UI Framework: Material-UI
- State Management: React Context
- Editor Libraries: markdown-latex, markdown-it
- Build Tools: Tailwind CSS, PostCSS
- PDF Generation: jsPDF, html2canvas

## Key Files and Their Purposes
- `api.ts`: Core backend communication
- `Editor.tsx`: Main editing interface with unified controls
- `MarkdownEditor.tsx`: Markdown-specific editing component
- `LaTeXEditor.tsx`: LaTeX-specific editing component
- `Sidebar.tsx`: Navigation and structure
- `TemplatesList.tsx`: Template management
- `CollectionsList.tsx`: Collection organization
- `types.ts`: TypeScript type definitions

This codebase represents a modern document editor with emphasis on academic and technical writing, supporting both Markdown and LaTeX formats while maintaining a clean, consistent, and intuitive user interface. The recent updates have unified the editing experience across formats while maintaining format-specific features and rendering capabilities. 