'use server'

import { APPWRITE_DB, db, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { revalidatePath } from 'next/cache';

// Types
export type GoalPriority = 'low' | 'medium' | 'high';

export type GoalStatus = 'pending' | 'ongoing' | 'complete';

export interface GoalFormValues {
  title: string;
  description: string;
  status: GoalStatus;
  targetDate: string;
  priority: GoalPriority;
  assignedEmployees: string[]; // Array of employee IDs
}

export interface Goal extends Omit<GoalFormValues, 'assignedEmployees'> {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  assignedEmployees: string[]; // Array of employee IDs
  assignedEmployeesData: EmployeeOption[]; // Array of employee objects with name and email
}

// Collection name
const COLLECTION_NAME = 'goals';

// Helper function to parse form data
function parseGoalForm(formData: FormData): Partial<GoalFormValues> {
  const get = (k: string) => formData.get(k)?.toString() || '';
  
  // Get assigned employees as an array
  const assignedEmployeesStr = get('assignedEmployees');
  const assignedEmployees = assignedEmployeesStr 
    ? assignedEmployeesStr.split(',').map(id => id.trim()).filter(Boolean)
    : [];

  return {
    title: get('title'),
    description: get('description'),
    status: (get('status') as GoalStatus) || 'pending',
    targetDate: get('targetDate') || new Date().toISOString(),
    priority: (get('priority') as GoalPriority) || 'Medium',
    assignedEmployees
  };
}

// Server Actions
export async function createGoalAction(formData: FormData) {
  try {
    const goalData = parseGoalForm(formData);
    const goal = await createGoal(goalData as GoalFormValues);
    revalidatePath('/goals');
    return { success: true, data: goal };
  } catch (error) {
    console.error('Error creating goal:', error);
    return { success: false, error: 'Failed to create goal' };
  }
}

export async function updateGoalAction(id: string, formData: FormData) {
  try {
    const goalData = parseGoalForm(formData);
    const goal = await updateGoal(id, goalData as GoalFormValues);
    revalidatePath('/goals');
    return { success: true, data: goal };
  } catch (error) {
    console.error('Error updating goal:', error);
    return { success: false, error: 'Failed to update goal' };
  }
}

export async function deleteGoalAction(id: string) {
  try {
    await deleteGoal(id);
    revalidatePath('/goals');
    return { success: true };
  } catch (error) {
    console.error('Error deleting goal:', error);
    return { success: false, error: 'Failed to delete goal' };
  }
}

// CRUD Operations
export async function getAllGoals() {
  try {
    // First, fetch all goals
    const goalsResponse = await db.listRows(
      APPWRITE_DB.databaseId,
      COLLECTION_NAME,
      [
        Query.limit(100) // Adjust limit as needed,
      ]
    );
    console.log("goalsResponse", goalsResponse)

    // Get all unique employee IDs from all goals
    const allEmployeeIds = new Set<string>();
    goalsResponse.rows.forEach(goal => {
      if (goal.assignedEmployees && Array.isArray(goal.assignedEmployees)) {
        goal.assignedEmployees.forEach((id: string) => allEmployeeIds.add(id));
      }
    });

    // Fetch all assigned employees in a single query
    let employees: Record<string, EmployeeOption> = {};
    if (allEmployeeIds.size > 0) {
      const employeesResponse = await db.listRows(
        APPWRITE_DB.databaseId,
        'employees', // Adjust if your employees table has a different name
        [
          Query.equal('$id', Array.from(allEmployeeIds)),
          Query.select(['$id', 'name', 'email'])
        ]
      );

      // Create a map of employee ID to employee data
      employees = employeesResponse.rows.reduce((acc, emp) => ({
        ...acc,
        [emp.$id]: {
          id: emp.$id,
          name: emp.name || 'Unknown Employee',
          email: emp.email || ''
        }
      }), {} as Record<string, EmployeeOption>);
    }

    // Process goals with employee data
    const goals = goalsResponse.rows.map(goal => {
      const assignedEmployees = Array.isArray(goal.assignedEmployees) ? goal.assignedEmployees : [];

      return {
        ...goal,
        assignedEmployees,
        // Add employee data for easy access in the UI
        assignedEmployeesData: assignedEmployees
          .map(id => employees[id])
          .filter(Boolean) as EmployeeOption[]
      };
    });

    return goals as unknown as Goal[];
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw error;
  }
}

export async function getGoalById(id: string) {
  try {
    // First, fetch the goal
    const response = await db.getRow(
      APPWRITE_DB.databaseId,
      COLLECTION_NAME,
      id
    );

    const assignedEmployees = Array.isArray(response.assignedEmployees) ? response.assignedEmployees : [];
    let assignedEmployeesData: EmployeeOption[] = [];

    // If there are assigned employees, fetch their details
    if (assignedEmployees.length > 0) {
      const employeesResponse = await db.listRows(
        APPWRITE_DB.databaseId,
        'employees',
        [
          Query.equal('$id', assignedEmployees),
          Query.select(['$id', 'name', 'email'])
        ]
      );

      // Map the employee data to the EmployeeOption format
      assignedEmployeesData = employeesResponse.rows.map((emp) => ({
        id: emp.$id,
        name: emp.name || 'Unknown Employee',
        email: emp.email || ''
      }));
    }

    // Return the goal with assigned employees
    const goal = {
      ...response,
      assignedEmployees,
      assignedEmployeesData
    };

    return goal as unknown as Goal;
  } catch (error) {
    console.error(`Error fetching goal ${id}:`, error);
    throw error;
  }
}

export async function createGoal(goal: GoalFormValues) {
  try {
    console.log('Creating goal with data:', goal);

    // Ensure all required fields are present and properly formatted
    const goalData = {
      title: goal.title || 'Untitled Goal',
      description: goal.description || '',
      targetDate: goal.targetDate || new Date().toISOString(),
      priority: goal.priority || 'medium',
      status: goal.status || 'pending',
      // Ensure assignedEmployees is always an array of strings
      assignedEmployees: Array.isArray(goal.assignedEmployees) 
        ? goal.assignedEmployees 
        : []
    };

    console.log('Prepared goal data for creation:', goalData);

    const response = await db.createRow(
      APPWRITE_DB.databaseId,
      COLLECTION_NAME,
      ID.unique(),
      goalData
    );

    console.log('Goal created successfully:', response);
    return response as unknown as Goal;
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
}

export async function updateGoal(id: string, goal: Partial<GoalFormValues>) {
  try {
    console.log('Updating goal with data:', { id, goal });

    // Create a new object with the correct types
    const updateData: Record<string, unknown> = { ...goal };

    // Handle assignedEmployees specially if it exists in the update
    if ('assignedEmployees' in goal) {
      // Ensure assignedEmployees is always an array of strings
      updateData.assignedEmployees = Array.isArray(goal.assignedEmployees) 
        ? goal.assignedEmployees 
        : [];
    }

    console.log('Prepared update data:', updateData);

    const response = await db.updateRow(
      APPWRITE_DB.databaseId,
      COLLECTION_NAME,
      id,
      updateData
    );

    console.log('Goal updated successfully:', response);
    return response as unknown as Goal;
  } catch (error) {
    console.error(`Error updating goal ${id}:`, error);
    throw error;
  }
}

export async function deleteGoal(id: string) {
  try {
    await db.deleteRow(
      APPWRITE_DB.databaseId,
      COLLECTION_NAME,
      id
    );
    return { success: true };
  } catch (error) {
    console.error(`Error deleting goal ${id}:`, error);
    throw error;
  }
}

// Additional queries
export async function getGoalsByStatus(status: GoalStatus) {
  try {
    const response = await db.listRows(
      APPWRITE_DB.databaseId,
      COLLECTION_NAME,
      [
        Query.equal('status', status)
      ]
    );
    return response.rows as unknown as Goal[];
  } catch (error) {
    console.error(`Error fetching goals with status ${status}:`, error);
    throw error;
  }
}

export async function getGoalsByOwner(ownerId: string) {
  try {
    // First get all goals
    const allGoals = await getAllGoals();
    
    // Filter goals where the owner is in the assignedEmployees array
    return allGoals.filter(goal => 
      goal.assignedEmployees && goal.assignedEmployees.includes(ownerId)
    );
  } catch (error) {
    console.error('Error getting goals by owner:', error);
    throw error;
  }
}

// Employee related functions
export interface EmployeeOption {
  id: string;
  name: string;
  email: string;
}

export async function getEmployees(): Promise<EmployeeOption[]> {
  try {
    const response = await db.listRows(
      APPWRITE_DB.databaseId,
      APPWRITE_DB.tables.employees,
      [
        Query.limit(100),
        Query.orderAsc('name'),
        Query.select(['$id', 'name', 'email'])
      ]
    );

    const employees = response.rows.map((employee) => ({
      id: employee.$id,
      name: employee.name || 'Unnamed Employee',
      email: employee.email || 'No email'
    }));

    return employees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    console.error('Failed to load employees');
    return [];
  }
}
