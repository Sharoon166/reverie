'use server';
import { APPWRITE_DB, db, ID } from '@/lib/appwrite';
import { revalidatePath } from 'next/cache';
import { Query } from 'appwrite';

export type ExpenseTarget = {
  id: string;
  quarter: number;
  year: number;
  targetAmount: number;
  currency: string;
  updatedAt: string;
};

export async function getExpenseTarget(quarter: number, year: number) {
  try {
    const response = await db.listRows({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.expense_targets,
      queries: [
        Query.equal('quarter', quarter),
        Query.equal('year', year),
        Query.limit(1),
      ],
    });

    return response.rows[0] as unknown as ExpenseTarget | undefined;
  } catch (error) {
    console.error('Error fetching expense target:', error);
    throw error;
  }
}

export async function createOrUpdateExpenseTarget(
  quarter: number,
  year: number,
  targetAmount: number,
  currency: string
) {
  try {
    // Check if target already exists
    const existingTarget = await getExpenseTarget(quarter, year);

    if (existingTarget) {
      // Update existing target
      const updated = await db.updateRow({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.expense_targets,
        rowId: existingTarget.id,
        data: {
          targetAmount: Number(targetAmount),
          currency,
        },
      });

      revalidatePath('/expenses');
      return updated;
    } else {
      // Create new target
      const created = await db.createRow({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.expense_targets,
        data: {
          quarter,
          year,
          targetAmount: Number(targetAmount),
          currency,
        },
        rowId: ID.unique(),
      });

      revalidatePath('/expenses');
      return created;
    }
  } catch (error) {
    console.error('Error saving expense target:', error);
    throw error;
  }
}
