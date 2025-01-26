import { NextResponse } from 'next/server';

const HASURA_ENDPOINT = "http://localhost:8080/v1/graphql";

export async function POST(request: Request) {
  try {
    const { fileId, fileName, metadata } = await request.json();

    const mutation = `
      mutation UpdateFile($fileId: String!, $fileName: String!, $metadata: jsonb!) {
        update_editor_files_by_pk(
          pk_columns: { file_id: $fileId }
          _set: { 
            file_name: $fileName,
            metadata: $metadata
          }
        ) {
          file_id
          file_name
          metadata
        }
      }
    `;

    const response = await fetch(HASURA_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || '',
      },
      body: JSON.stringify({
        query: mutation,
        variables: { fileId, fileName, metadata }
      }),
    });

    const data = await response.json();
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return NextResponse.json(data.data.update_editor_files_by_pk);
  } catch (error) {
    console.error('Failed to update file:', error);
    return NextResponse.json(
      { error: 'Failed to update file: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 