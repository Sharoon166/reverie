'use client';

import { useState } from 'react';
import type { Employee, AttendanceRecord } from '@/types/employee';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  isLoading: boolean;
  onSave: (data: {
    date: string;
    status: AttendanceRecord['status'];
    checkInTime?: string;
    checkOutTime?: string;
  }) => void;
}

export default function AttendanceDialog({
  open,
  onOpenChange,
  employee,
  isLoading,
  onSave,
}: AttendanceDialogProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [status, setStatus] = useState<AttendanceRecord['status']>('present');
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('18:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    onSave({
      date: date.toISOString().split('T')[0],
      status,
      checkInTime:
        status === 'present' || status === 'late' ? checkInTime : undefined,
      checkOutTime:
        status === 'present' || status === 'late' ? checkOutTime : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Attendance</DialogTitle>
          <DialogDescription>
            Mark attendance for {employee?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Date Picker with Popover + Calendar */}
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={isLoading}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Status Dropdown */}
              <div>
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) =>
                    setStatus(val as AttendanceRecord['status'])
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Times only if present/late */}
            {(status === 'present' || status === 'late') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check-in Time</Label>
                  <Input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    disabled={
                      isLoading || (status !== 'present' && status !== 'late')
                    }
                  />
                </div>
                <div>
                  <Label>Check-out Time</Label>
                  <Input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    disabled={
                      isLoading || (status !== 'present' && status !== 'late')
                    }
                  />
                </div>
              </div>
            )}

            {/* Actions */}
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
                {isLoading ? 'Marking...' : 'Mark Attendance'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
