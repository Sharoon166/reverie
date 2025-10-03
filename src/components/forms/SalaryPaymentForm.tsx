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
import { Coins, Calendar } from 'lucide-react';
import { CURRENCIES, PAYMENT_STATUS, type Currency } from '@/lib/constants';

const salaryPaymentFormSchema = z.object({
  month: z.string().min(1, 'Month is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.enum(CURRENCIES),
  status: z.enum(PAYMENT_STATUS),
});

type SalaryPaymentFormValues = z.infer<typeof salaryPaymentFormSchema>;

interface SalaryPaymentFormProps {
  initialData?: {
    month?: string;
    amount?: number;
    currency?: Currency;
    status?: 'Paid' | 'Pending' | 'Processing';
  };
  onSubmit: (data: SalaryPaymentFormValues) => Promise<void>;
  isLoading?: boolean;
  employeeName?: string;
  defaultSalary?: number;
  defaultCurrency?: Currency;
}

export function SalaryPaymentForm({
  initialData,
  onSubmit,
  isLoading,
  employeeName,
  defaultSalary = 0,
  defaultCurrency = 'PKR',
}: SalaryPaymentFormProps) {
  const form = useForm<SalaryPaymentFormValues>({
    resolver: zodResolver(salaryPaymentFormSchema),
    defaultValues: {
      month: initialData?.month || new Date().toISOString().slice(0, 7), // YYYY-MM format
      amount:
        initialData?.amount || (defaultSalary > 0 ? defaultSalary : undefined),
      currency: initialData?.currency || defaultCurrency,
      status: initialData?.status || 'Paid',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 border-b pb-2">
            <Coins className="h-4 w-4" />
            Salary Payment {employeeName && `for ${employeeName}`}
          </div>

          <FormField
            control={form.control}
            name="month"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Month
                </FormLabel>
                <FormControl>
                  <Input type="month" {...field} />
                </FormControl>
                <FormDescription>
                  Select the month for which salary is being paid.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Amount
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
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

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PAYMENT_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Current status of this salary payment.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
          >
            {isLoading ? 'Saving...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
