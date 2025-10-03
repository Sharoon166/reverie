// Expense TypeScript types/interfaces

export type ExpenseCategory =
  | 'Office Supplies'
  | 'Marketing'
  | 'Travel'
  | 'Utilities'
  | 'Software'
  | 'Equipment'
  | 'Rent'
  | 'Food & Entertainment'
  | 'Professional Services'
  | 'Other';

export type PaymentAccount = 'Bank' | 'Cash' | 'Credit Card' | 'Digital Wallet';

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: ExpenseCategory;
  account: PaymentAccount;
  amount: number;
  currency: 'PKR';
  paidBy: string; // Employee name or ID
  receiptUrl?: string;
  notes?: string;
  approvedBy?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string; // ISO string
  updatedAt: string;
}

export interface MonthlyExpenseSummary {
  month: string; // YYYY-MM
  totalExpenses: number;
  currency: 'PKR';
  targetAmount?: number;
  isClosed: boolean;
  closedDate?: string; // ISO string
  expenses: Expense[];
  categoryBreakdown: Record<ExpenseCategory, number>;
  accountBreakdown: Record<PaymentAccount, number>;
}

export interface ExpenseTarget {
  id: string;
  month: string; // YYYY-MM
  targetAmount: number;
  currency: 'PKR';
  description?: string;
  createdBy: string;
  createdAt: string; // ISO string
}
