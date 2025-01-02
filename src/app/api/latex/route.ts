import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { latexText } = await request.json();
    
    // URL encode the LaTeX text
    const encodedText = encodeURIComponent(latexText);
    
    // Call the LaTeX Online API
    const response = await fetch(
      `https://latexonline.cc/compile?text=${encodedText}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error('Compilation failed');
    }

    // Get the PDF as a blob
    const pdfBlob = await response.blob();
    
    return new NextResponse(pdfBlob, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to compile LaTeX' },
      { status: 500 }
    );
  }
} 