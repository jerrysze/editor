# Editor Codebase Summary

## Project Overview
A Next.js-based editor application that supports both Markdown and LaTeX editing with real-time preview capabilities. The application features a hierarchical collection system for organizing documents, with advanced file management, question-based metadata support, and document merging capabilities.

## Core Components

### Data Model
- Enhanced question-based metadata structure with validation:
  ```typescript
  interface ValidationResult {
    isValid: boolean;
    errors: string[];
  }

  interface FileMetadata {
    documentType: 'question' | 'answer' | 'marking_scheme';
    format: 'markdown' | 'latex';
    score: number;
    questionLabel: string;
    questionNumbering?: QuestionNumbering;
    groupId?: string;
  }

  interface QuestionNumbering {
    mainNumber: number;
    subQuestion?: string;
    subSubQuestion?: string;
  }

  interface QuestionGroup {
    label: string;
    files: {
      question?: string;
      answer?: string;
      markingScheme?: string;
    };
    metadata: FileMetadata;
  }
  ```

### Document Management System
- Question Group Management:
  - Automatic grouping of related files (question/answer/marking scheme)
  - Hierarchical question numbering
  - Group-level operations (rename, delete)
  - Smart validation (required: question + marking scheme, optional: answer)
  - Transfer system with group-based validation

- Document Merging System:
  - PDF generation for both LaTeX and Markdown
  - Ordered merging (question -> answer -> marking scheme)
  - Multi-group support with sorting
  - Format-specific PDF handling

### Editor Components

#### Main Editor (`src/app/components/Editor.tsx`)
- Main editing interface with unified controls
- Features:
  - Dual-mode editing (Markdown/LaTeX)
  - Question-based metadata management
  - File format detection
  - PDF export functionality
  - Real-time preview toggle

#### MergeOptionsDialog (`src/app/components/MergeOptionsDialog.tsx`)
- Advanced document merging interface:
  - Multi-group selection
  - Document type filtering
  - Ordered PDF generation and merging
  - Progress feedback
  - Error handling

#### Sidebar (`src/app/components/Sidebar.tsx`)
- Enhanced file organization with:
  - Question-based grouping
  - Visual hierarchy for files
  - Color-coded file types
  - Group-level operations
  - Collection management

### Key Features
1. Question Management
   - Question/Answer/Marking Scheme grouping
   - Smart file requirements (Q+MS required, Answer optional)
   - Score tracking
   - Question labeling
   - Group validation

2. Editor Capabilities
   - Unified interface for Markdown/LaTeX
   - Real-time preview
   - PDF export
   - Question metadata support

3. Document Merging
   - Multi-format support (Markdown/LaTeX)
   - Ordered document combination
   - PDF generation and merging
   - Group-based organization

4. File Organization
   - Hierarchical collection system
   - Question group management
   - Automated file naming
   - Metadata synchronization

## Technical Stack
- Frontend: Next.js, TypeScript, React
- UI Framework: Material-UI
- State Management: React Context
- PDF Generation: pdf-lib, html2canvas, jsPDF
- API Integration: GraphQL (Hasura)
- Editor Libraries: markdown-latex, markdown-it

This codebase represents a sophisticated document editor with comprehensive question management capabilities and advanced document merging features, focusing on maintaining relationships between questions, answers, and marking schemes while providing a clean, intuitive user interface. 