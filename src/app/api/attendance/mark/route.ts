import { NextRequest, NextResponse } from 'next/server';
import { markAttendance } from '@/actions/attendance';

export async function POST(request: NextRequest) {
  try {
    const { employeeId, date, status, checkIn, checkOut, notes } = await request.json();
    
    if (!employeeId || !date || !status) {
      return NextResponse.json({ error: 'Employee ID, date, and status are required' }, { status: 400 });
    }

    const result = await markAttendance(employeeId, {
      date,
      status,
      checkIn,
      checkOut,
      notes,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
  }
}