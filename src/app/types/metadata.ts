export interface QuestionNumbering {
  mainNumber: number;
  subQuestion?: string;
  subSubQuestion?: string;
}

export interface QuestionGroup {
  label: string;
  files: {
    question?: string;
    answer?: string;
    markingScheme?: string;
  };
  metadata: FileMetadata;
}

export interface FileMetadata {
  documentType: 'question' | 'answer' | 'marking_scheme';
  format: 'markdown' | 'latex';
  score: number;
  questionLabel: string;
  questionNumbering?: QuestionNumbering;
  groupId?: string;
} 