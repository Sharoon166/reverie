'use client';

import { useState } from 'react';
import type { Employee, AttendanceRecord } from '@/types/employee';
import EmployeeTable from '@/components/EmployeeTable';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import NotesDialog from './dialogs/NotesDialog';
import AttendanceDialog from './dialogs/AttendanceDialog';
import SalaryDialog from './dialogs/SalaryDialog';
import { deleteEmployee, markSalaryPaid, updateEmployee } from '@/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { EmployeeForm, EmployeeFormValues } from '../forms';
import ConfirmationDialog from '../ui/confirmation-dialog';
import { markAttendance } from '@/actions/attendance';

interface EmployeeTableWrapperProps {
  employees: Employee[];
  onEmployeesUpdate?: (employees: Employee[]) => void;
}

export default function EmployeeTableWrapper({
  employees,
}: EmployeeTableWrapperProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    employee: null as Partial<Employee> | null,
  });
  const [editDialog, setEditDialog] = useState({
    open: false,
    employee: null as Partial<Employee> | null,
  });
  const [notesDialog, setNotesDialog] = useState({
    open: false,
    employee: null as Employee | null,
  });
  const [attendanceDialog, setAttendanceDialog] = useState({
    open: false,
    employee: null as Employee | null,
  });
  const [salaryDialog, setSalaryDialog] = useState({
    open: false,
    employee: null as Employee | null,
  });

  const handleEdit = async (data: EmployeeFormValues) => {
    try {
      setIsLoading(true);
      const employee = editDialog.employee;
      if (!employee?.$id || typeof employee?.$id !== 'string') return;
      await updateEmployee(employee?.$id, data);
      setEditDialog({ employee: null, open: false });
      toast.success('Employee updated successfully');
    } catch {
      toast.error('Failed to update employee. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (employeeId: string) => {
    try {
      setIsLoading(true);
      await deleteEmployee(employeeId);
      toast.success('Successfully deleted employee');

      setDeleteDialog({ open: false, employee: null });
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete employee. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNotes = (employee: Employee) => {
    setNotesDialog({ open: true, employee });
  };

  const handleNotesSave = async (notes: string) => {
    if (!notesDialog.employee) return;

    try {
      setIsLoading(true);
      const id = notesDialog.employee?.$id;
      if (!id || typeof id !== 'string') return;
      await updateEmployee(id, { notes });
      toast.success('Notes updated successfully');
      setNotesDialog({ open: false, employee: null });
    } catch {
      toast.error('Failed to update notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAttendance = (employee: Employee) => {
    setAttendanceDialog({ open: true, employee });
  };

  const handleAttendanceSave = async (data: {
    date: string;
    status: AttendanceRecord['status'];
    checkInTime?: string;
    checkOutTime?: string;
  }) => {
    if (!attendanceDialog.employee) return;

    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newAttendance: AttendanceRecord = {
        date: data.date,
        status: data.status,
        checkIn: data.checkInTime,
        checkOut: data.checkOutTime,
      };

      const id = attendanceDialog.employee?.$id;
      if (!id || typeof id !== 'string') return;
      await markAttendance(id, newAttendance);

      toast.success(`Attendance marked for ${attendanceDialog.employee.name}`);
      setAttendanceDialog({ open: false, employee: null });
    } catch {
      toast.error('Failed to mark attendance. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaySalary = (employee: Employee) => {
    setSalaryDialog({ open: true, employee });
  };

  const handleSalarySave = async (data: {
    month: string;
    bonusAmount: number;
  }) => {
    if (!salaryDialog.employee) return;

    try {
      setIsLoading(true);
      const id = salaryDialog.employee?.$id;
      if (!id || typeof id !== 'string') return;
      await markSalaryPaid(id, data);
      toast.success(`Salary marked as paid for ${salaryDialog.employee.name}`);
      setSalaryDialog({ open: false, employee: null });
    } catch {
      toast.error('Failed to mark salary as paid. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowClick = (employeeId: string) => {
    router.push(`/employees/${employeeId}`);
  };

  return (
    <>
      <EmployeeTable
        data={employees}
        onEdit={(employee) => setEditDialog({ employee, open: true })}
        onDelete={(employeeId) => {
          const employee = employees.find((emp) => emp.$id == employeeId);
          if (employee) setDeleteDialog({ open: true, employee });
        }}
        onAddNotes={handleAddNotes}
        onMarkAttendance={handleMarkAttendance}
        onPaySalary={handlePaySalary}
        onRowClick={handleRowClick}
        isLoading={isLoading}
      />

      <ConfirmationDialog
        open={deleteDialog.open}
        onConfirm={() => {
          const id = deleteDialog.employee?.$id;
          if (typeof id === 'string') handleDelete(id);
        }}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        title="Are you absolutely sure?"
        description="This will permanently delete the selected record. This action is permanent!!!"
        confirmText="Delete"
      />

      <Dialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update the employee information below.
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm
            mode="edit"
            isLoading={isLoading}
            onSubmit={handleEdit}
            initialData={editDialog.employee ? editDialog.employee : null}
          />
        </DialogContent>
      </Dialog>

      <NotesDialog
        open={notesDialog.open}
        onOpenChange={(open) => setNotesDialog({ ...notesDialog, open })}
        employee={notesDialog.employee}
        isLoading={isLoading}
        onSave={handleNotesSave}
      />

      <AttendanceDialog
        open={attendanceDialog.open}
        onOpenChange={(open) =>
          setAttendanceDialog({ ...attendanceDialog, open })
        }
        employee={attendanceDialog.employee}
        isLoading={isLoading}
        onSave={handleAttendanceSave}
      />

      <SalaryDialog
        open={salaryDialog.open}
        onOpenChange={(open) => setSalaryDialog({ ...salaryDialog, open })}
        employee={salaryDialog.employee}
        isLoading={isLoading}
        onSave={handleSalarySave}
      />
    </>
  );
}
