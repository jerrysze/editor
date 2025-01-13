import { FileMetadata, QuestionGroup, QuestionNumbering } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors?: Record<string, string>;
}

export function validateQuestionNumber(
  numbering: QuestionNumbering,
  existingGroups: QuestionGroup[]
): ValidationResult {
  const errors: string[] = [];

  // Check if required fields exist
  if (!numbering.mainNumber) {
    errors.push('Main question number is required');
  }

  // Validate main number is positive
  if (numbering.mainNumber && numbering.mainNumber <= 0) {
    errors.push('Main question number must be positive');
  }

  // Validate sub-question format if present
  if (numbering.subQuestion) {
    if (!/^[a-z]$/i.test(numbering.subQuestion)) {
      errors.push('Sub-question must be a single letter (a-z)');
    }
  }

  // Validate sub-sub-question format if present
  if (numbering.subSubQuestion) {
    if (!numbering.subQuestion) {
      errors.push('Cannot have sub-sub-question without sub-question');
    }
    if (!/^[a-z]$/i.test(numbering.subSubQuestion)) {
      errors.push('Sub-sub-question must be a single letter (a-z)');
    }
  }

  // Check for duplicates with more precise comparison
  const isDuplicate = existingGroups.some(group => {
    const groupNumbering = group.metadata.questionNumbering;
    if (!groupNumbering) return false;

    // Compare main number
    if (groupNumbering.mainNumber !== numbering.mainNumber) {
      return false;
    }

    // Compare sub-question if either has it
    if (groupNumbering.subQuestion || numbering.subQuestion) {
      if (groupNumbering.subQuestion !== numbering.subQuestion) {
        return false;
      }
    }

    // Compare sub-sub-question if either has it
    if (groupNumbering.subSubQuestion || numbering.subSubQuestion) {
      if (groupNumbering.subSubQuestion !== numbering.subSubQuestion) {
        return false;
      }
    }

    return true;
  });

  if (isDuplicate) {
    errors.push('Question number already exists');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateGroupCompleteness(group: QuestionGroup): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // Validate score
  if (!group.metadata.score || group.metadata.score <= 0) {
    errors.push('Score must be a positive number');
    fieldErrors.score = 'Score must be a positive number';
  }

  // Validate maximum score (if needed)
  if (group.metadata.score > 100) {
    errors.push('Score cannot exceed 100 points');
    fieldErrors.score = 'Score cannot exceed 100 points';
  }

  // Validate question label
  if (!group.metadata.questionLabel?.trim()) {
    errors.push('Question label is required');
    fieldErrors.questionLabel = 'Question label is required';
  } else if (group.metadata.questionLabel.length > 100) {
    errors.push('Question label cannot exceed 100 characters');
    fieldErrors.questionLabel = 'Question label cannot exceed 100 characters';
  }

  // Validate required files existence
  if (!group.files.question) {
    errors.push('Question file is required');
    fieldErrors.questionFile = 'Question file is required';
  }

  if (!group.files.answer) {
    errors.push('Answer file is required');
    fieldErrors.answerFile = 'Answer file is required';
  }

  if (!group.files.markingScheme) {
    errors.push('Marking scheme file is required');
    fieldErrors.markingSchemeFile = 'Marking scheme file is required';
  }

  // Validate metadata consistency across files
  const allFiles = [group.files.question, group.files.answer, group.files.markingScheme].filter(Boolean);
  const firstFile = allFiles[0];
  if (firstFile) {
    allFiles.forEach(file => {
      if (file && file !== firstFile) {
        if (file.metadata.score !== firstFile.metadata.score) {
          errors.push('Score must be consistent across all files in the group');
        }
        if (file.metadata.questionLabel !== firstFile.metadata.questionLabel) {
          errors.push('Question label must be consistent across all files in the group');
        }
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors
  };
}

export function validateFileName(fileName: string, fileType: 'question' | 'answer' | 'marking_scheme'): ValidationResult {
  const errors: string[] = [];
  
  // Basic format: Question-X[-y][-z][-type]
  const basePattern = /^Question-\d+(?:-[a-z])?(?:-[a-z])?$/i;
  const answerPattern = /^Question-\d+(?:-[a-z])?(?:-[a-z])?-answer$/i;
  const markingPattern = /^Question-\d+(?:-[a-z])?(?:-[a-z])?-marking$/i;

  // Check maximum length
  if (fileName.length > 255) {
    errors.push('File name is too long (maximum 255 characters)');
    return { isValid: false, errors };
  }

  // Check for invalid characters
  if (/[<>:"\/\\|?*]/.test(fileName)) {
    errors.push('File name contains invalid characters');
    return { isValid: false, errors };
  }

  switch (fileType) {
    case 'question':
      if (!basePattern.test(fileName)) {
        errors.push('Question file name must follow format: Question-X[-y][-z]');
      }
      break;
    case 'answer':
      if (!answerPattern.test(fileName)) {
        errors.push('Answer file name must follow format: Question-X[-y][-z]-answer');
      }
      break;
    case 'marking_scheme':
      if (!markingPattern.test(fileName)) {
        errors.push('Marking scheme file name must follow format: Question-X[-y][-z]-marking');
      }
      break;
  }

  // Validate number part
  const numberMatch = fileName.match(/Question-(\d+)/);
  if (numberMatch) {
    const number = parseInt(numberMatch[1], 10);
    if (number === 0) {
      errors.push('Question number cannot be zero');
    }
    if (number > 1000) {
      errors.push('Question number cannot exceed 1000');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateNewQuestion(
  metadata: FileMetadata,
  existingGroups: QuestionGroup[]
): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // Validate score with more precise checks
  if (metadata.score === undefined || metadata.score === null) {
    errors.push('Score is required');
    fieldErrors.score = 'Score is required';
  } else if (!Number.isFinite(metadata.score)) {
    errors.push('Score must be a valid number');
    fieldErrors.score = 'Score must be a valid number';
  } else if (metadata.score <= 0) {
    errors.push('Score must be positive');
    fieldErrors.score = 'Score must be positive';
  } else if (!Number.isInteger(metadata.score)) {
    errors.push('Score must be a whole number');
    fieldErrors.score = 'Score must be a whole number';
  } else if (metadata.score > 100) {
    errors.push('Score cannot exceed 100 points');
    fieldErrors.score = 'Score cannot exceed 100 points';
  }

  // Validate question numbering
  if (metadata.questionNumbering) {
    const numberingValidation = validateQuestionNumber(metadata.questionNumbering, existingGroups);
    if (!numberingValidation.isValid) {
      errors.push(...numberingValidation.errors);
      fieldErrors.questionNumbering = numberingValidation.errors[0];
    }
  } else {
    errors.push('Question numbering is required');
    fieldErrors.questionNumbering = 'Question numbering is required';
  }

  // Validate question label
  if (!metadata.questionLabel?.trim()) {
    errors.push('Question label is required');
    fieldErrors.questionLabel = 'Question label is required';
  } else {
    if (metadata.questionLabel.length > 100) {
      errors.push('Question label cannot exceed 100 characters');
      fieldErrors.questionLabel = 'Question label cannot exceed 100 characters';
    }
    
    // Check for special characters in label
    if (/[<>:"\/\\|?*]/.test(metadata.questionLabel)) {
      errors.push('Question label contains invalid characters');
      fieldErrors.questionLabel = 'Question label contains invalid characters';
    }
  }

  // Validate document type
  if (!metadata.documentType) {
    errors.push('Document type is required');
    fieldErrors.documentType = 'Document type is required';
  }

  // Validate format
  if (!metadata.format) {
    errors.push('Document format is required');
    fieldErrors.format = 'Document format is required';
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors
  };
} 