// components/expenses/ExpensesTable.tsx
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Expense } from '@/types/expense';
import { Edit, Trash2, Receipt } from 'lucide-react';

interface ExpensesTableProps {
  data: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  isQuarterClosed?: boolean;
}

export default function ExpensesTable({ data, onEdit, onDelete, isLoading, isQuarterClosed = false }: ExpensesTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading expenses...</div>;
  }

  if (data.length === 0) {
    return <div className="text-center py-8">No expenses found</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">
                {expense.date ? new Date(expense.date).toLocaleDateString() : 'N/A'}
              </TableCell>
              <TableCell>{expense.description || 'No description'}</TableCell>
              <TableCell>{expense.category}</TableCell>
              <TableCell>{expense.account}</TableCell>
              <TableCell>
                {expense.amount.toLocaleString()} {expense.currency}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(expense.status)}>
                  {expense.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {expense.receiptUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => window.open(expense.receiptUrl, '_blank')}
                    >
                      <Receipt className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(expense)}
                    disabled={isQuarterClosed}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(expense.id)}
                    disabled={isQuarterClosed}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}