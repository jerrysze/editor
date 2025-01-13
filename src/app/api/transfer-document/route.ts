import { NextResponse } from 'next/server';

const HASURA_ENDPOINT = process.env.HASURA_GRAPHQL_ENDPOINT;

interface Question {
  id: string;
  number: string;
  text: string;
  marks: number;
  markingScheme: string;
  subQuestions?: Question[];
}

interface Section {
  id: string;
  title: string;
  questions: Question[];
}

interface FileMetadata {
  format: 'latex' | 'markdown';
  numberOfQuestions: number;
  structure: Section[];
}

export async function POST(request: Request) {
  try {
    const { examId, fileId } = await request.json();

    const getFileQuery = `
      query GetFile($fileId: String!) {
        editor_files_by_pk(file_id: $fileId) {
          metadata
          file_name
          content
        }
      }
    `;

    const fileResponse = await fetch(HASURA_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: getFileQuery,
        variables: { fileId }
      })
    });

    const fileData = await fileResponse.json();
    if (fileData.errors) {
      throw new Error(fileData.errors[0].message);
    }

    const file = fileData.data.editor_files_by_pk;
    if (!file) {
      throw new Error('File not found');
    }

    const metadata = file.metadata as FileMetadata;
    if (!metadata) {
      throw new Error('No metadata found in the file');
    }

    // Create questions array based on numberOfQuestions
    const questions = [];
    const totalQuestions = metadata.numberOfQuestions || 1;
    const sectionsCount = metadata.structure?.length || 1;
    const questionsPerSection = Math.ceil(totalQuestions / sectionsCount);

    // If there's no structure, create a default one
    const sections = metadata.structure?.length > 0 ? metadata.structure : [{
      id: 'section-1',
      title: 'Section 1',
      questions: []
    }];

    let questionNumber = 1;
    for (const section of sections) {
      // Calculate how many questions should be in this section
      const sectionQuestionCount = Math.min(
        questionsPerSection,
        totalQuestions - (questionNumber - 1)
      );

      // Create questions for this section
      for (let i = 0; i < sectionQuestionCount; i++) {
        const label = String(questionNumber);
        questions.push({
          exam_id: examId,
          question_label: label,
          question_text: `Question ${label}`,
          marking_scheme_text: '',
          score: 0,
          question_coordinates: null,
          marking_scheme_coordinates: null,
          answer_coordinates: null
        });
        questionNumber++;
      }
    }

    if (questions.length === 0) {
      throw new Error('Failed to create questions from metadata');
    }

    const insertQuestionsMutation = `
      mutation InsertQuestions($questions: [question_information_insert_input!]!) {
        insert_question_information(objects: $questions) {
          affected_rows
          returning {
            id
            question_label
            question_text
          }
        }
      }
    `;

    const insertResponse = await fetch(HASURA_ENDPOINT!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: insertQuestionsMutation,
        variables: { questions }
      })
    });

    const insertData = await insertResponse.json();
    if (insertData.errors) {
      throw new Error(insertData.errors[0].message);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${questions.length} questions for exam`,
      questions: insertData.data.insert_question_information.returning
    });

  } catch (error) {
    console.error('Transfer failed:', error);
    return NextResponse.json(
      { error: 'Failed to transfer document: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 