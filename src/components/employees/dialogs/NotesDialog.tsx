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
import { Textarea } from '@/components/ui/textarea';

interface NotesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: Employee | null;
    isLoading: boolean;
    onSave: (notes: string) => void;
}

export default function NotesDialog({
    open,
    onOpenChange,
    employee,
    isLoading,
    onSave,
}: NotesDialogProps) {
    const [notes, setNotes] = useState(employee?.notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(notes);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Employee Notes</DialogTitle>
                    <DialogDescription>
                        Add or update notes for {employee?.name}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <Textarea placeholder='Notes...' value={notes} onChange={e => setNotes(e.target.value)} disabled={isLoading} className='max-h-32'/>
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
                                {isLoading ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}