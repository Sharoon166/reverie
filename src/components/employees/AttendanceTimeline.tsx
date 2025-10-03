'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import type { AttendanceRecord } from '@/types';
import { toast } from 'sonner';

type Props = {
  attendanceRecords: AttendanceRecord[] | undefined;
  employeeId: string;
};

// status → tailwind color mapping
const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-500',
  late: 'bg-yellow-500',
  'on-leave': 'bg-orange-500',
  absent: 'bg-red-500',
  default: 'bg-gray-200',
};

export default function AttendanceTimeline({
  attendanceRecords,
  employeeId,
}: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [attendanceStatus, setAttendanceStatus] = useState<string>('');
  const [checkIn, setCheckIn] = useState<string>('');
  const [checkOut, setCheckOut] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  if (!attendanceRecords) return null;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // quick lookup map: { "YYYY-MM-DD": "present|absent|..." }
  const recordMap = new Map(
    attendanceRecords.map((r) => [
      new Date(r.date).toISOString().split('T')[0],
      r.status,
    ])
  );

  const handleDayClick = (dateStr: string, dayNumber: number) => {
    console.log('Day clicked:', dayNumber);
    const existingRecord = attendanceRecords.find(
      (r) => new Date(r.date).toISOString().split('T')[0] === dateStr
    );

    setSelectedDate(dateStr);
    setAttendanceStatus(existingRecord?.status || '');
    setCheckIn(existingRecord?.checkIn || '');
    setCheckOut(existingRecord?.checkOut || '');
    setNotes(existingRecord?.notes || '');
    setShowDialog(true);
  };

  const handleSaveAttendance = async () => {
    if (!attendanceStatus) {
      toast.error('Please select attendance status');
      return;
    }

    setIsLoading(true);

    const attendancePromise = async () => {
      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          date: selectedDate,
          status: attendanceStatus,
          checkIn: checkIn || undefined,
          checkOut: checkOut || undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      return response.json();
    };

    toast.promise(attendancePromise(), {
      loading: 'Saving attendance...',
      success: () => {
        setShowDialog(false);
        // Refresh the page to show updated attendance
        window.location.reload();
        return 'Attendance saved successfully';
      },
      error: 'Failed to save attendance. Please try again.',
    });

    setIsLoading(false);
  };

  return (
    <Card className="p-8 border-0 shadow-sm bg-white">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-gray-800 rounded-xl">
          <Calendar className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Attendance Timeline
          </h3>
          <p className="text-sm text-gray-600">
            {today.toLocaleString('default', { month: 'long' })} {year}
          </p>
        </div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-12 gap-2 mb-6">
        {Array.from({ length: daysInMonth }, (_, idx) => {
          const date = new Date(year, month, idx + 1);
          const dateStr = date.toISOString().split('T')[0];
          const status = recordMap.get(dateStr);

          const color =
            STATUS_COLORS[status as keyof typeof STATUS_COLORS] ??
            STATUS_COLORS.default;

          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                className={`w-6 h-6 rounded ${color} cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all`}
                title={`${dateStr} - ${status ?? 'No record'} (Click to edit)`}
                onClick={() => handleDayClick(dateStr, idx + 1)}
              />
              <span className="text-[10px] text-gray-500">{idx + 1}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {Object.entries(STATUS_COLORS).map(([key, color]) =>
          key === 'default' ? null : (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${color}`} />
              <span className="capitalize">{key}</span>
            </div>
          )
        )}
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded ${STATUS_COLORS.default}`} />
          <span>No record</span>
        </div>
      </div>

      {/* Attendance Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Attendance</DialogTitle>
            <DialogDescription>
              Set attendance for {new Date(selectedDate).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Attendance Status</Label>
              <Select
                value={attendanceStatus}
                onValueChange={setAttendanceStatus}
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

            {(attendanceStatus === 'present' ||
              attendanceStatus === 'late') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn">Check In</Label>
                    <Input
                      id="checkIn"
                      type="time"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut">Check Out</Label>
                    <Input
                      id="checkOut"
                      type="time"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this attendance..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAttendance} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Attendance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
