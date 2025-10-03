'use client';

import { useState } from 'react';
import type { Employee } from '@/types/employee';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SalaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  isLoading: boolean;
  onSave: (data: { month: string; bonusAmount: number }) => void;
}

export default function SalaryDialog({
  open,
  onOpenChange,
  employee,
  isLoading,
  onSave,
}: SalaryDialogProps) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [bonusAmount, setBonusAmount] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ month, bonusAmount });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Salary as Paid</DialogTitle>
          <DialogDescription>
            Mark salary payment for {employee?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Month</label>
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Base Salary
                </label>
                <Input type="number" value={employee?.salary || 0} disabled />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Bonus (optional)
              </label>
              <Input
                type="number"
                min={0}
                value={bonusAmount}
                onChange={(e) => setBonusAmount(Number(e.target.value) || 0)}
                disabled={isLoading}
              />
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                This will mark the salary as paid for {employee?.name} for{' '}
                {month}. Amount: {employee?.salary?.toLocaleString()}
                {bonusAmount > 0 && (
                  <> + Bonus: {bonusAmount.toLocaleString()}</>
                )}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isLoading}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
              >
                {isLoading ? 'Processing...' : 'Mark as Paid'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
