import { NextRequest, NextResponse } from 'next/server';
import { generateQuarterlyReportPDF } from '@/actions/reports';

export async function POST(request: NextRequest) {
  try {
    const { quarterId } = await request.json();
    
    if (!quarterId) {
      return NextResponse.json({ error: 'Quarter ID is required' }, { status: 400 });
    }

    const pdfBuffer = await generateQuarterlyReportPDF(quarterId);
    
    // Create a ReadableStream from the buffer
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(pdfBuffer);
        controller.close();
      },
    });
    
    return new NextResponse(stream, {
      status: 200,
      headers: new Headers({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quarterId}-report.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      }),
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}