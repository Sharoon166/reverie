'use client';

import { Card } from '@/components/ui/card';
import type { SalaryPayment, Employee } from '@/types';
import { Coins, Trash2, Edit } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { formatDate } from '@/lib/date-utils';
import { formatPakistaniCurrency } from '@/lib/utils';
import { Button } from '../ui/button';
import { deleteSalaryPayment, updateSalaryPayment } from '@/actions/employees';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// Custom Confirmation Dialog Component
function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const salaryPaymentSchema = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  bonusAmount: z.number().min(0, 'Bonus must be positive').optional(),
  paidDate: z.string().min(1, 'Payment date is required'),
});

type SalaryPaymentFormValues = z.infer<typeof salaryPaymentSchema>;

interface SalaryHistoryProps {
  salaryPayments: SalaryPayment[] | undefined;
  employee: Employee;
}

interface SalaryPaymentFormProps {
  payment: SalaryPayment;
  employeeName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function SalaryPaymentForm({
  payment,
  employeeName,
  onSuccess,
  onCancel,
}: SalaryPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  // Extract month from the paidDate (format: YYYY-MM-DD) to YYYY-MM format for the month input
  const defaultMonth = payment.paidDate ? payment.paidDate.substring(0, 7) : '';

  const form = useForm<SalaryPaymentFormValues>({
    resolver: zodResolver(salaryPaymentSchema),
    defaultValues: {
      amount: payment.amount,
      bonusAmount: payment.bonus?.amount,
      paidDate: defaultMonth,
    },
  });

  const amount = form.watch('amount') || 0;
  const bonusAmount = form.watch('bonusAmount') || 0;
  const totalAmount = Number(amount) + Number(bonusAmount);

  const onSubmit = async (data: SalaryPaymentFormValues) => {
    try {
      setIsLoading(true);
      await updateSalaryPayment(payment.id, {
        amount: data.amount,
        bonus: data.bonusAmount ? { amount: data.bonusAmount } : undefined,
        paidDate: data.paidDate,
      });
      toast.success('Salary payment updated successfully');
      onSuccess();
    } catch (error) {
      console.error('Error updating salary payment:', error);
      toast.error('Failed to update salary payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="month" className="block text-sm font-medium mb-1">
              Month
            </Label>
            <Input
              id="month"
              type="month"
              {...form.register('paidDate')}
              disabled={isLoading}
            />
          </div>
          <div>
            <Label htmlFor="amount" className="block text-sm font-medium mb-1">
              Base Salary
            </Label>
            <Input
              id="amount"
              type="number"
              {...form.register('amount', { valueAsNumber: true })}
              disabled={isLoading}
            />
          </div>
        </div>
        <div>
          <Label
            htmlFor="bonusAmount"
            className="block text-sm font-medium mb-1"
          >
            Bonus (optional)
          </Label>
          <Input
            id="bonusAmount"
            type="number"
            min={0}
            {...form.register('bonusAmount', { valueAsNumber: true })}
            disabled={isLoading}
          />
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            This will update the salary payment for{' '}
            <span className="font-bold">{employeeName}</span> for{' '}
            {form.watch('paidDate')}.
            <br />
            Total Amount: {formatPakistaniCurrency(totalAmount)}
            {bonusAmount > 0 && (
              <>
                <br />
                (Base: {formatPakistaniCurrency(amount)} + Bonus:{' '}
                {formatPakistaniCurrency(bonusAmount)})
              </>
            )}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
        >
          {isLoading ? 'Saving...' : 'Update Payment'}
        </Button>
      </div>
    </form>
  );
}

export default function SalaryHistory({
  salaryPayments,
  employee,
}: SalaryHistoryProps) {
  const router = useRouter();
  const [editingPayment, setEditingPayment] = useState<SalaryPayment | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  if (!salaryPayments) return null;

  const handleDeleteClick = (paymentId: string) => {
    setPaymentToDelete(paymentId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!paymentToDelete) return;

    try {
      await deleteSalaryPayment(paymentToDelete);
      toast.success('Payment record deleted successfully');
      // Refresh both the component and the dashboard stats
      router.refresh();
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Failed to delete payment record');
    } finally {
      setPaymentToDelete(null);
    }
  };

  const handleEditClick = (payment: SalaryPayment) => {
    setEditingPayment(payment);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    router.refresh();
  };
  return (
    <>
      <Card className="p-8 border-0 shadow-sm bg-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-yellow-400 rounded-xl">
            <Coins className="h-6 w-6 text-gray-900" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              Salary Payments
            </h3>
            <p className="text-sm text-gray-600">
              Monthly payments including bonuses
            </p>
          </div>
        </div>
        <ScrollArea className="h-60">
          <div className="space-y-3">
            {salaryPayments.length > 0 ? (
              salaryPayments
                ?.sort((a, b) => b.month.localeCompare(a.month)) // newest first
                .map((p, idx) => (
                  <div
                    key={
                      String(
                        (p as SalaryPayment)?.$id ??
                          (p as SalaryPayment)?.id ??
                          `${p.month}-${p.paidDate ?? ''}-${p.netAmount ?? ''}`
                      ) || `salary-${idx}`
                    }
                    className="flex items-center justify-between bg-gray-50 border rounded-lg p-3"
                  >
                    <div className="w-1/2">
                      <div className="text-gray-900 font-medium">{p.month}</div>
                      <div className="font-medium text-xs text-muted-foreground">
                        Paid on: {formatDate(p.paidDate!)}
                      </div>
                    </div>
                    <div className="text-gray-700 grow">
                      <div className="text-sm text-gray-600">
                        Net: {formatPakistaniCurrency(p.netAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {p.amount.toLocaleString()}
                        {p.bonus?.amount ? (
                          <span>
                            {' '}
                            + Bonus: {p.bonus.amount.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditClick(p)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteClick(p.id || p.$id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-sm text-gray-500">
                No salary payments recorded.
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Salary Payment</DialogTitle>
            <DialogDescription>
              Edit the salary payment details for {employee.name}.
            </DialogDescription>
          </DialogHeader>
          {editingPayment && (
            <SalaryPaymentForm
              payment={editingPayment}
              employeeName={employee.name}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Payment Record"
        description="Are you sure you want to delete this payment record? This action cannot be undone and will update the cash on hand balance."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}
