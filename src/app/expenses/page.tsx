// app/expenses/page.tsx
import type { Expense, ExpenseCategory, PaymentAccount } from '@/types/expense';
import ExpensesPageClient from '@/components/expenses/ExpensePageClient';
import { getAllExpenses, createExpense, updateExpense, deleteExpense } from '@/actions/expenses';

export default async function ExpensesPage() {
  const res = await getAllExpenses();
  const rows = Array.isArray((res as unknown as { rows?: unknown })?.rows)
    ? ((res as unknown as { rows?: unknown[] }).rows as Record<string, unknown>[])
    : [];

  type Row = {
    [key: string]: unknown;
    id?: unknown;
    $id?: unknown;
    date?: unknown;
    description?: unknown;
    category?: unknown;
    account?: unknown;
    amount?: unknown;
    currency?: unknown;
    paidBy?: unknown;
    paid_by?: unknown;
    receiptUrl?: unknown;
    notes?: unknown;
    approvedBy?: unknown;
    status?: unknown;
    createdAt?: unknown;
    created_at?: unknown;
    updatedAt?: unknown;
    updated_at?: unknown;
  };

  const toCategory = (v: unknown): ExpenseCategory => {
    const all: ExpenseCategory[] = [
      'Office Supplies',
      'Marketing',
      'Travel',
      'Utilities',
      'Software',
      'Equipment',
      'Rent',
      'Food & Entertainment',
      'Professional Services',
      'Other',
    ];
    return all.includes(v as ExpenseCategory) ? (v as ExpenseCategory) : 'Other';
  };

  const toAccount = (v: unknown): PaymentAccount => {
    const all: PaymentAccount[] = ['Bank', 'Cash', 'Credit Card', 'Digital Wallet'];
    return all.includes(v as PaymentAccount) ? (v as PaymentAccount) : 'Bank';
  };

  const toStatus = (v: unknown): Expense['status'] => {
    const all: Expense['status'][] = ['Pending', 'Approved', 'Rejected'];
    return all.includes(v as Expense['status']) ? (v as Expense['status']) : 'Pending';
  };

  const expenses: Expense[] = rows.map((r: Record<string, unknown>) => {
    const row = r as Row;
    const idRaw = row.id ?? row.$id;
    const createdRaw = row.createdAt ?? row.created_at;
    const updatedRaw = row.updatedAt ?? row.updated_at;
    const paidByRaw = row.paidBy ?? row.paid_by;

    return {
      id: String(idRaw ?? ''),
      date: typeof row.date === 'string' && row.date ? row.date : new Date().toISOString().split('T')[0],
      description: typeof row.description === 'string' ? row.description : '',
      category: toCategory(row.category),
      account: toAccount(row.account),
      amount: typeof row.amount === 'number' ? row.amount : Number(row.amount) || 0,
      currency: 'PKR',
      paidBy: typeof paidByRaw === 'string' ? paidByRaw : '',
      receiptUrl: typeof row.receiptUrl === 'string' ? row.receiptUrl : undefined,
      notes: typeof row.notes === 'string' ? row.notes : undefined,
      approvedBy: typeof row.approvedBy === 'string' ? row.approvedBy : undefined,
      status: toStatus(row.status),
      createdAt: typeof createdRaw === 'string' ? createdRaw : new Date().toISOString(),
      updatedAt: typeof updatedRaw === 'string' ? updatedRaw : new Date().toISOString(),
    } satisfies Expense;
  });

  return (
    <ExpensesPageClient
      initialExpenses={expenses}
      actions={{
        create: createExpense,
        update: updateExpense,
        remove: deleteExpense,
      }}
    />
  );
}

