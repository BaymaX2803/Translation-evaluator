import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const type = params.type; // 'english' or 'german'

  // Use the specific filename from your /public folder
  const filename = type === 'german' ? '1de_cropped.pdf' : 'some_english_file.pdf';
  const filePath = path.join(process.cwd(), 'public', filename);

  try {
    // Check if the file exists before trying to read it
    if (!fs.existsSync(filePath)) {
      return new NextResponse("PDF file not found.", { status: 404 });
    }

    // Read the file into a buffer
    const pdfBuffer = fs.readFileSync(filePath);

    // Return the PDF buffer with the correct headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${type}.pdf"`
      }
    });

  } catch (error) {
    console.error("Failed to read PDF file:", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}