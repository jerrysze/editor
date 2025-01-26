import { NextResponse } from 'next/server';

const HASURA_ENDPOINT = "http://localhost:8080/v1/graphql";

export async function GET() {
  try {
    const query = `
      query GetExams {
        exams(order_by: {exam_date: desc}) {
          id
          exam_name
          course_code
          course {
            course_name
          }
          exam_date
          grading_deadline
        }
      }
    `;

    console.log('Fetching from Hasura:', HASURA_ENDPOINT);
    
    const response = await fetch(HASURA_ENDPOINT!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query,
        variables: {} 
      }),
      cache: 'no-store',
    });

    const data = await response.json();
    console.log('Hasura response:', data);

    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
      throw new Error(data.errors[0].message);
    }

    if (!data.data?.exams) {
      console.error('No exams data in response:', data);
      throw new Error('Invalid response format');
    }

    // Transform the response to match the expected format
    const exams = data.data.exams.map((exam: any) => ({
      id: exam.id,
      exam_name: exam.exam_name,
      course_code: exam.course_code,
      course_name: exam.course?.course_name || '',
      exam_date: exam.exam_date,
      grading_deadline: exam.grading_deadline,
    }));

    console.log('Transformed exams:', exams);

    return NextResponse.json(exams);
  } catch (error) {
    console.error('Failed to fetch exams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exams: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 