'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DollarSign, Target } from 'lucide-react';
import { CURRENCIES } from '@/lib/constants';

const expenseTargetFormSchema = z.object({
  targetAmount: z.number().min(1, 'Target amount must be at least 1'),
  currency: z.enum(CURRENCIES),
  month: z.string().min(1, 'Month is required'),
});

type ExpenseTargetFormValues = z.infer<typeof expenseTargetFormSchema>;

interface ExpenseTargetFormProps {
  initialData?: {
    targetAmount?: number;
    currency?: 'PKR' | 'USD';
    month?: string;
  };
  onSubmit: (data: ExpenseTargetFormValues) => Promise<void>;
  isLoading?: boolean;
  previousTarget?: { amount?: number; currency?: 'PKR' | 'USD' };
}

export function ExpenseTargetForm({ initialData, onSubmit, isLoading, previousTarget }: ExpenseTargetFormProps) {
  const form = useForm<ExpenseTargetFormValues>({
    resolver: zodResolver(expenseTargetFormSchema),
    defaultValues: {
      targetAmount: initialData?.targetAmount || undefined,
      currency: 'PKR',
      month: initialData?.month || new Date().toISOString().slice(0, 7), // YYYY-MM format
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b pb-2">
            <Target className="h-4 w-4" />
            Set Monthly Expense Target
          </div>
          {typeof previousTarget?.amount === 'number' && previousTarget.amount! > 0 && (
            <div className="text-xs text-gray-500 -mt-2">
              Previous target: <span className="font-medium text-gray-700">{previousTarget.amount?.toLocaleString()} {previousTarget.currency}</span>
            </div>
          )}

          <FormField
            control={form.control}
            name="month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Month</FormLabel>
                <FormControl>
                  <Input
                    type="month"
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value || '')}
                  />
                </FormControl>
                <FormDescription>
                  Select the month for which you want to set the expense target.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Target Amount
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        field.onChange(v === '' ? undefined : Number(v));
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum amount you want to spend this month.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency} value={currency}>
                          {currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isLoading} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
            {isLoading ? 'Saving...' : 'Set Target'}
          </Button>
        </div>
      </form>
    </Form>
  );
}