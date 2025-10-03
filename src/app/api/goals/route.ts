import { NextRequest, NextResponse } from 'next/server';
import { getAllGoals, createGoal } from '@/actions/goals';

export async function GET() {
  try {
    const goals = await getAllGoals();
    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, targetDate, priority, status } =
      await request.json();

    if (!title || !targetDate) {
      return NextResponse.json(
        { error: 'Title and target date are required' },
        { status: 400 }
      );
    }

    const goalData = {
      title,
      description: description || '',
      targetDate,
      priority: priority || 'medium',
      status: status || 'pending',
      assignedEmployees: [],
    };

    const result = await createGoal(goalData);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
