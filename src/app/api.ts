//server component
let endpoint = "http://127.0.0.1:5000/api/resource"
import { Collection} from './types';
import { FileMetadata } from './types/metadata';
import { 
  validateNewQuestion, 
  validateGroupCompleteness, 
  validateFileName 
} from './utils/validation';

export async function serverGetResource(resource_name: string, req_json: string | null = null, is_resource_name_endpoint:boolean = false) {
    let response: any
    let func_endpoint = is_resource_name_endpoint ? `${endpoint}/${resource_name}` : `${endpoint}?name=${resource_name}`;
    if (req_json) {
        const encoded_json = encodeURI(req_json);
        const queryPrefix = is_resource_name_endpoint ? "?json=" : "&json=";
        func_endpoint += queryPrefix + encoded_json;
    }
    response = await fetch(func_endpoint, {
        cache: 'no-cache',
        headers: {
            "Content-Type": "application/json"
        },
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.errors?.map((error: any) => error.message).join('\n') || 'Error fetching data');
    }
    return data;
}

export async function serverPostResource(resource_name: string, req_json: any, is_resource_name_endpoint:boolean = false) {
    let func_endpoint = is_resource_name_endpoint ? 
      `${endpoint}/${resource_name}` : 
      `${endpoint}?name=${resource_name}`;

    const response = await fetch(func_endpoint, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: typeof req_json === 'string' ? req_json : JSON.stringify(req_json)
    });

    const data = await response.json();
    if (!response.ok) {
        console.error("Server responded with an error:", data);
        throw new Error(data.errors?.map((error: any) => error.message).join('\n') || 'Error posting data');
    }
    return data;
}

export function getResource(resource_name: string, req_json: string = '', is_resource_name_endpoint:boolean = false): Promise<any> {
    const encoded_json = encodeURI(req_json)
    let func_endpoint = is_resource_name_endpoint ? `${endpoint}/${resource_name}` : `${endpoint}?name=${resource_name}`;
    if (req_json) {
        const encoded_json = encodeURI(req_json);
        const queryPrefix = is_resource_name_endpoint ? "?json=" : "&json=";
        func_endpoint += queryPrefix + encoded_json;
    }
    return fetch(func_endpoint, { cache: "no-store"})
        .then((response) => {
            if (!response.ok) {
                throw new Error("Response not ok")
            }
            return response.json();
        })
        .catch(error => {
            throw error;
        });
}

export function postResource(resource_name: string, req_json: string, is_resource_name_endpoint:boolean = false): Promise<any> {
    let func_endpoint:string
    func_endpoint = is_resource_name_endpoint ? endpoint + `/${resource_name}` : `${endpoint}?name=${resource_name}`;
    return fetch(func_endpoint, {
        cache: 'no-store',
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: req_json
    },).then(
        response => {
            if (!response.ok) {
                throw new Error("Response not ok")
            }
            return response.json();
        })
        .catch(error => {
            console.error("some error: ", error)
        })
}

export async function getCollectionStructure(): Promise<Collection[]> {
  try {
    const response = await serverGetResource('get_collection_structure');

    if (response.data && response.data.editor_collections) {
      const collections = response.data.editor_collections;
      return buildCollectionTree(collections);
    }
    return [];
  } catch (error) {
    console.error("Error getting collection structure:", error);
    return [];
  }
}

export async function saveCollectionStructure(structure: Collection[]): Promise<void> {
  try {
    const flatStructure = flattenCollectionStructure(structure);
    if (flatStructure.length === 0) {
      console.warn("Attempting to save an empty collection structure");
      return;
    }
    const response = await serverPostResource('save_collection_structure', JSON.stringify({
        collections: flatStructure
    }));
  } catch (error) {
    console.error("Error saving collection structure:", error);
    throw error;
  }
}

// Helper function to build the collection tree
function buildCollectionTree(flatCollections: any[]): Collection[] {
  const collectionsMap = new Map<string, Collection>();

  // First pass: create all collections
  flatCollections.forEach(col => {
    collectionsMap.set(col.collection_id, {
      id: col.collection_id,
      name: col.collection_name,
      files: col.editor_files ? col.editor_files.map((file: any) => ({ id: file.file_id, name: file.file_name })) : [],
      collections: [],
      isOpen: false
    });
  });

  // Second pass: build the tree structure
  const rootCollections: Collection[] = [];
  flatCollections.forEach(col => {
    const collection = collectionsMap.get(col.collection_id);
    if (collection) {
      if (col.parent_id) {
        const parent = collectionsMap.get(col.parent_id);
        if (parent) {
          parent.collections.push(collection);
        } else {
          // If parent is not found, add to root
          rootCollections.push(collection);
        }
      } else {
        rootCollections.push(collection);
      }
    }
  });
  
  return rootCollections;
}

// Helper function to flatten the collection structure for saving
function flattenCollectionStructure(collections: Collection[]): any[] {
  let result: any[] = [];

  function flatten(col: Collection, parentId: string | null = null) {
    result.push({
      collection_id: col.id,
      collection_name: col.name,
      parent_id: parentId,
      deleted: false // Add this line to include the deleted field
    });

    col.collections.forEach(subCol => flatten(subCol, col.id));
  }

  collections.forEach(col => flatten(col));

  return result;
}

// Modify the existing saveFile function
export async function saveFile(collectionId: string, fileId: string | null, fileName: string, content: string) {
  try {
    let endpoint = 'create_file';
    let fileExists = false;

    if (fileId) {
      const existingFile = await getFile(fileId);
      fileExists = !!existingFile.data.editor_files[0];
      if (fileExists) {
        endpoint = 'update_file';
      }
    }

    const response = await serverPostResource(endpoint, JSON.stringify({
      collection_id: collectionId,
      file_id: fileId,
      file_name: fileName,
      content: content
    }));

    // After saving the file, update the collection structure
    await getCollectionStructure();

    return response;
  } catch (error) {
    console.error("Error saving file:", error);
    throw error;
  }
}

// Add this new function to get file information
export async function getFile(fileId: string) {
    try {
        const response = await serverGetResource('get_file', JSON.stringify({ file_id: fileId }));
        return response;
    } catch (error) {
        console.error("Error getting file:", error);
        return null;
    }
}

// Add this new function to delete a file
export async function deleteFile(fileId: string) {
    try {
        const response = await serverPostResource('delete_editor_file', JSON.stringify({
            file_id: fileId
        }));
        return response;
    } catch (error) {
        console.error("Error deleting file:", error);
        throw error;
    }
}

// Add this new function to rename a collection
export async function renameCollection(collectionId: string, newName: string) {
    try {
        const response = await serverPostResource('rename_collection', JSON.stringify({
            collection_id: collectionId,
            collection_name: newName
        }));
        return response;
    } catch (error) {
        console.error("Error renaming collection:", error);
        throw error;
    }
}

// Add this new function to delete a collection
export async function deleteCollection(collectionId: string) {
    try {
        const response = await serverPostResource('delete_editor_collection', JSON.stringify({
            collection_id: collectionId
        }));
        return response;
    } catch (error) {
        console.error("Error deleting collection:", error);
        throw error;
    }
}

// Add this new function to update file metadata
export async function updateFileMetadata(fileId: string, metadata: any) {
    try {
        const response = await serverPostResource('update_metadata', JSON.stringify({
            file_id: fileId,
            metadata: metadata
        }));
        return response;
    } catch (error) {
        console.error("Error updating file metadata:", error);
        throw error;
    }
}

export interface Exam {
  id: number;
  exam_name: string;
  course_code: string;
  course_name: string;
  exam_date: string;
  grading_deadline: string | null;
}

export const getExams = async (): Promise<Exam[]> => {
  const response = await fetch('/api/exams', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch exams');
  }

  const data = await response.json();
  console.log('API response:', data);
  return data;
};


interface TransferDocumentParams {
  examId: number;
  fileId: string;
}

export const transferDocumentToExam = async ({ examId, fileId }: TransferDocumentParams): Promise<any> => {
  const response = await fetch('/api/transfer-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examId, fileId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Transfer failed');
  }

  return response.json();
};

export async function validateQuestionMetadata(fileId: string): Promise<{
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}> {
  const response = await fetch('/api/validate-question-metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId }),
  });

  if (!response.ok) {
    throw new Error('Validation request failed');
  }

  return response.json();
}

export async function transferQuestionToExam({
  examId,
  fileId,
  metadata,
  content
}: {
  examId: number;
  fileId: string;
  metadata: FileMetadata;
  content: string;
}): Promise<void> {
  const response = await fetch('/api/transfer-question', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      examId,
      fileId,
      metadata: {
        question_label: metadata.questionLabel,
        score: metadata.score,
        document_type: metadata.documentType
      },
      content
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to transfer question');
  }
}

export async function validateCollectionMetadata(fileIds: string[]): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  try {
    // First, get all the files with their metadata
    const filesData = await Promise.all(
      fileIds.map(async (fileId) => {
        const response = await serverGetResource('get_file', JSON.stringify({ file_id: fileId }));
        return {
          file_id: fileId,
          file_name: response.data.editor_files[0].file_name,
          metadata: response.data.editor_files[0].metadata
        };
      })
    );

    const validationErrors: string[] = [];
    
    // Check if any files are missing question labels
    filesData.forEach(file => {
      if (!file.metadata?.questionLabel) {
        validationErrors.push(`File "${file.file_name}" is missing question label`);
      }
    });

    // Group files by question label
    const questionGroups = filesData.reduce((groups: { [key: string]: typeof filesData }, file) => {
      const label = file.metadata?.questionLabel;
      if (label) {
        if (!groups[label]) {
          groups[label] = [];
        }
        groups[label].push(file);
      }
      return groups;
    }, {});

    // Validate each question group
    Object.entries(questionGroups).forEach(([label, files]) => {
      // Check for required components
      const hasQuestion = files.some(f => f.metadata?.documentType === 'question');
      const hasAnswer = files.some(f => f.metadata?.documentType === 'answer');
      const hasMarkingScheme = files.some(f => f.metadata?.documentType === 'marking_scheme');

      if (!hasQuestion) {
        validationErrors.push(`Question "${label}" is missing question document`);
      }
      if (!hasAnswer) {
        validationErrors.push(`Question "${label}" is missing answer document`);
      }
      if (!hasMarkingScheme) {
        validationErrors.push(`Question "${label}" is missing marking scheme document`);
      }

      // Get the question document to validate score
      const questionDoc = files.find(f => f.metadata?.documentType === 'question');
      if (questionDoc?.metadata) {
        if (typeof questionDoc.metadata.score !== 'number' || questionDoc.metadata.score <= 0) {
          validationErrors.push(`Question "${label}" has invalid score`);
        }
      }

      // Ensure all files in the group share the same metadata values
      const baseMetadata = questionDoc?.metadata;
      if (baseMetadata) {
        files.forEach(file => {
          if (file.metadata?.score !== baseMetadata.score) {
            validationErrors.push(`Score mismatch in "${file.file_name}"`);
          }
        });
      }
    });

    return {
      isValid: validationErrors.length === 0,
      errors: validationErrors
    };
  } catch (error) {
    console.error("Error validating collection metadata:", error);
    throw new Error('Failed to validate collection metadata');
  }
}

interface QuestionInformation {
  exam_id: number;
  marking_scheme_text: string | null;
  score: number;
  question_label: string;
  question_text: string | null;
  answer_coordinates?: any;
  marking_scheme_coordinates?: any;
  question_coordinates?: any;
}

const HASURA_ENDPOINT = process.env.NEXT_PUBLIC_HASURA_ENDPOINT || 'http://localhost:8080/v1/graphql';

export async function transferCollectionToExam({
  examId,
  files
}: {
  examId: number;
  files: Array<{
    fileId: string;
    content: string;
    metadata: FileMetadata;
  }>;
}): Promise<void> {
  try {
    // Group files by question label
    const questionGroups = files.reduce((groups: { [key: string]: typeof files }, file) => {
      const label = file.metadata.questionLabel;
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(file);
      return groups;
    }, {});

    // Prepare question information entries
    const questions: QuestionInformation[] = Object.entries(questionGroups).map(([label, questionFiles]) => {
      // Find each document type
      const questionDoc = questionFiles.find(f => f.metadata.documentType === 'question');
      const answerDoc = questionFiles.find(f => f.metadata.documentType === 'answer');
      const markingSchemeDoc = questionFiles.find(f => f.metadata.documentType === 'marking_scheme');

      if (!questionDoc) {
        throw new Error(`Question document missing for label: ${label}`);
      }

      // Create question information entry
      return {
        exam_id: examId,
        question_label: label,
        score: questionDoc.metadata.score,
        question_text: questionDoc?.content || null,
        marking_scheme_text: markingSchemeDoc?.content || null,
        answer_coordinates: null,
        marking_scheme_coordinates: null,
        question_coordinates: null
      };
    });

    // GraphQL mutation to insert questions
    const mutation = `
      mutation InsertQuestions($questions: [question_information_insert_input!]!) {
        insert_question_information(objects: $questions) {
          affected_rows
          returning {
            id
            question_label
          }
        }
      }
    `;

    // Send mutation to Hasura
    const response = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET || '',
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          questions: questions
        },
      }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    if (!response.ok) {
      throw new Error('Failed to insert questions');
    }

    console.log(`Successfully inserted ${result.data.insert_question_information.affected_rows} questions`);

  } catch (error) {
    console.error("Error transferring collection:", error);
    throw error;
  }
}

export async function createNewQuestion(metadata: FileMetadata): Promise<ValidationResult> {
  const existingGroups = await getQuestionGroups();
  
  // Validate the new question
  const validationResult = validateNewQuestion(metadata, existingGroups);
  if (!validationResult.isValid) {
    return validationResult;
  }

  // Validate file name
  const fileNameValidation = validateFileName(
    generateFileName(metadata.questionNumbering), 
    metadata.documentType
  );
  if (!fileNameValidation.isValid) {
    return fileNameValidation;
  }

  // ... rest of creation logic
}

export async function updateQuestionGroup(group: QuestionGroup): Promise<ValidationResult> {
  // Validate group completeness
  const validationResult = validateGroupCompleteness(group);
  if (!validationResult.isValid) {
    return validationResult;
  }

  // ... rest of update logic
}
