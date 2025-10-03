'use client';

import { Button } from '@/components/ui/button';
import { Download, UserPlus } from 'lucide-react';
import CSVImport from '@/components/CSVImport';
import { CSV_SAMPLE_DATA } from '@/dummy';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { EmployeeForm, EmployeeFormValues } from '../forms';
import { toast } from 'sonner';
import { createEmployee } from '@/actions';

export default function ExportButtons() {
  const handleCSVImport = (data: Record<string, unknown>[]) => {
    // This will be handled by the client component
    console.log('Imported data:', data);
  };

  const [showAddFormDialog, setShowAddFormDialog] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleEmployeeCreation = async (employee: EmployeeFormValues) => {
    setIsAdding(true);
    try {
      await createEmployee(employee);
      toast.success(`Successfully added ${employee.name} as an employee`);
      setShowAddFormDialog(false);
    } catch (error) {
      console.error((error as Error)?.message);
      toast.error(`Unable to add ${employee?.name} as employee`);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-wrap justify-center items-center gap-3">
      <CSVImport
        onImport={handleCSVImport}
        expectedColumns={[
          'name',
          'email',
          'phone',
          'position',
          'department',
          'joinDate',
          'salary',
        ]}
        entityName="Employee"
        sampleData={CSV_SAMPLE_DATA.employee}
      />
      <Button
        variant="outline"
        onClick={() => {
          /* Handle export csv */
        }}
        className="border-gray-300 hover:bg-yellow-50"
      >
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button
        variant="outline"
        onClick={() => {
          /* Handle PDF export */
        }}
        className="border-gray-300 hover:bg-yellow-50"
      >
        <Download className="h-4 w-4 mr-2" />
        Export PDF
      </Button>
      <Button
        onClick={() => setShowAddFormDialog(true)}
        className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Add Employee
      </Button>

      {showAddFormDialog && (
        <Dialog open={showAddFormDialog} onOpenChange={setShowAddFormDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
              <DialogDescription>
                Fill in the employee details below.
              </DialogDescription>
            </DialogHeader>
            <EmployeeForm
              mode="create"
              isLoading={isAdding}
              onSubmit={handleEmployeeCreation}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
