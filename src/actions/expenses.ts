'use server';
import { APPWRITE_DB, db, ID } from '@/lib/appwrite';
import type { ExpenseFormValues } from '@/components/forms';
import { revalidatePath } from 'next/cache';
import { Query } from 'appwrite';
import { Expense } from '@/types';

type ModifiedExpense = Expense & {
  $createdAt: string;
  $updatedAt: string;
  $databaseId: string;
  $tableId: string;
  $id: string;
};

export async function getAllExpenses() {
  const res = await db.listRows({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.expenses,
    queries: [Query.limit(25)],
  });
  return res;
}

export async function getExpenseById(id: string) {
  const res = await db.listRows({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.expenses,
    queries: [Query.equal('$id', id)],
  });
  return res.rows.at(0) as unknown as ModifiedExpense;
}
export async function deleteExpense(id: string) {
  await db.deleteRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.expenses,
    rowId: id,
  });
  revalidatePath('/expenses');
  revalidatePath(`/expenses/${id}`);
}
export async function updateExpense(id: string, formData: ExpenseFormValues) {
  const res = await db.updateRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.expenses,
    rowId: id,
    data: formData,
  });
  return res;
}
export async function createExpense(formData: ExpenseFormValues) {
  const res = await db.createRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.expenses,
    data: formData,
    rowId: ID.unique(),
  });
  return res;
}
