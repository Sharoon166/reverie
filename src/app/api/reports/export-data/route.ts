import { NextRequest, NextResponse } from 'next/server';
import { getQuarterlySummaries } from '@/actions/reports';

export async function POST(request: NextRequest) {
  try {
    const { quarterId } = await request.json();
    
    if (!quarterId) {
      return NextResponse.json({ error: 'Quarter ID is required' }, { status: 400 });
    }

    const summaries = await getQuarterlySummaries(quarterId);
    
    return new NextResponse(JSON.stringify(summaries), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${quarterId}-data-export.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}