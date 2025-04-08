import { QuestionGroup, QuestionNumbering } from '../types/metadata';
import { PAGE_BREAK_MARKER } from './pageBreakUtils';

export interface MergeOptions {
  documentType: 'question' | 'answer' | 'marking_scheme';
  groups: QuestionGroup[];
}

export function sortQuestionGroups(groups: QuestionGroup[]): QuestionGroup[] {
  return groups.sort((a, b) => {
    const numA = a.metadata.questionNumbering;
    const numB = b.metadata.questionNumbering;
    
    if (!numA || !numB) return 0;
    
    // Compare main numbers
    if (numA.mainNumber !== numB.mainNumber) {
      return numA.mainNumber - numB.mainNumber;
    }
    
    // Compare sub-questions if they exist
    if (numA.subQuestion && numB.subQuestion) {
      return numA.subQuestion.localeCompare(numB.subQuestion);
    }
    
    // Compare sub-sub-questions if they exist
    if (numA.subSubQuestion && numB.subSubQuestion) {
      return numA.subSubQuestion.localeCompare(numB.subSubQuestion);
    }
    
    return 0;
  });
}

export function mergeContent(options: MergeOptions): string {
  const { documentType, groups } = options;
  const sortedGroups = sortQuestionGroups(groups);
  
  return sortedGroups
    .map(group => {
      let content = '';
      switch (documentType) {
        case 'question':
          content = group.files.question || '';
          break;
        case 'answer':
          content = group.files.answer || '';
          break;
        case 'marking_scheme':
          content = group.files.markingScheme || '';
          break;
      }
      
      // Add a header with the question number
      const header = `% Question ${group.metadata.questionLabel}\n`;
      return `${header}${content}\n${PAGE_BREAK_MARKER}\n`;
    })
    .join('\n');
}

export function validateMergeableGroups(groups: QuestionGroup[]): boolean {
  return groups.every(group => {
    // Check if group has required metadata
    if (!group.metadata.questionNumbering || !group.metadata.questionLabel) {
      return false;
    }
    
    // Check if group has valid question numbering
    const numbering = group.metadata.questionNumbering;
    
    // Special case for cover page (Question 0)
    if (numbering.mainNumber === 0) {
      return true; // Cover page is always valid
    }
    
    if (!numbering.mainNumber || numbering.mainNumber < 1) {
      return false;
    }

    // Validate sub-question format if present
    if (numbering.subQuestion && !/^[a-z]$/.test(numbering.subQuestion)) {
      return false;
    }

    // Validate sub-sub-question format if present
    if (numbering.subSubQuestion && !/^[a-z]$/.test(numbering.subSubQuestion)) {
      return false;
    }

    return true;
  });
} 