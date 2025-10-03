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
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

const notesFormSchema = z.object({
  notes: z.string().optional(),
});

type NotesFormValues = z.infer<typeof notesFormSchema>;

interface NotesFormProps {
  initialNotes?: string;
  onSubmit: (data: NotesFormValues) => Promise<void>;
  isLoading?: boolean;
  entityName?: string;
}

export function NotesForm({
  initialNotes,
  onSubmit,
  isLoading,
  entityName = 'item',
}: NotesFormProps) {
  const form = useForm<NotesFormValues>({
    resolver: zodResolver(notesFormSchema),
    defaultValues: {
      notes: initialNotes || '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Add notes about this ${entityName}...`}
                  className="resize-none"
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Any additional information or comments about this {entityName}.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
          >
            {isLoading ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
