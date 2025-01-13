import { NextResponse } from 'next/server';

const HASURA_ENDPOINT = process.env.HASURA_GRAPHQL_ENDPOINT;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // If collectionId is provided, we're fetching files
    if (body.collectionId) {
      const query = `
        query GetCollectionFiles($collectionId: String!) {
          editor_files(where: {collection_id: {_eq: $collectionId}}) {
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
          query,
          variables: { collectionId: body.collectionId }
        }),
      });

      const data = await response.json();

      if (data.errors) {
        throw new Error(data.errors[0].message);
      }

      const files = data.data.editor_files.map((file: any) => ({
        id: file.file_id,
        name: file.file_name,
        metadata: file.metadata
      }));

      return NextResponse.json(files);
    }

    // If file creation data is provided
    const { file_id, file_name, collection_id, content, metadata } = body;

    if (!file_id || !file_name || !collection_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const mutation = `
      mutation CreateFile($file_id: String!, $file_name: String!, $collection_id: String!, $content: String!, $metadata: jsonb) {
        insert_editor_files_one(object: {
          file_id: $file_id,
          file_name: $file_name,
          collection_id: $collection_id,
          content: $content,
          metadata: $metadata
        }) {
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
        variables: { 
          file_id,
          file_name,
          collection_id,
          content: content || '',
          metadata
        }
      }),
    });

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    return NextResponse.json(data.data.insert_editor_files_one);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Operation failed: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collectionId');

    if (!collectionId) {
      throw new Error('Collection ID is required');
    }

    const query = `
      query GetCollectionFiles($collectionId: String!) {
        editor_files(where: {collection_id: {_eq: $collectionId}}) {
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
        query,
        variables: { collectionId }
      }),
    });

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0].message);
    }

    const files = data.data.editor_files.map((file: any) => ({
      id: file.file_id,
      name: file.file_name,
      metadata: file.metadata
    }));

    return NextResponse.json(files);
  } catch (error) {
    console.error('Failed to fetch files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 