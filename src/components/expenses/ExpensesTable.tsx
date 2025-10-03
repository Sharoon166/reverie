// components/expenses/ExpensesTable.tsx
'use client';

import { useState } from 'react';
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
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';
import { formatPakistaniCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

interface ExpensesTableProps {
  data: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  isQuarterClosed?: boolean;
}

export default function ExpensesTable({
  data,
  onEdit,
  onDelete,
  isLoading,
  isQuarterClosed = false,
}: ExpensesTableProps) {
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination<Expense>({
    data,
    itemsPerPage,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading expenses...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No expenses found for this quarter
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="*:font-bold">
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead className="min-w-[200px]">Description</TableHead>
              <TableHead className="whitespace-nowrap">Category</TableHead>
              <TableHead className="whitespace-nowrap">Account</TableHead>
              <TableHead className="whitespace-nowrap text-right">
                Amount
              </TableHead>
              <TableHead className="whitespace-nowrap">Status</TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {expense.date ? formatDate(expense.date) : 'N/A'}
                </TableCell>
                <TableCell>{expense.description || 'No description'}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{expense.account}</TableCell>
                <TableCell className="text-right">
                  {formatPakistaniCurrency(expense.amount)}
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
                        onClick={() =>
                          window.open(expense.receiptUrl, '_blank')
                        }
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

      {totalPages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between px-2 py-2">
          <div className="text-sm text-gray-600 mb-2 sm:mb-0">
            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
            <span className="font-medium">
              {endIndex > totalItems ? totalItems : endIndex}
            </span>{' '}
            of <span className="font-medium">{totalItems}</span> results
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={totalItems}
          />
        </div>
      )}
    </div>
  );
}
