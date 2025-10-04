'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MoreHorizontal, Plus, Trash2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  deleteGoal,
  getAllGoals,
  getEmployees,
  createGoalAction,
  updateGoalAction,
  type Goal,
  type GoalPriority,
  type GoalStatus,
  type EmployeeOption,
  type GoalFormValues,
} from '@/actions/goals';
import { Badge } from '@/components/ui/badge';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoal, setDeletingGoal] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'not_started':
      case 'not started':
        return 'bg-gray-100 text-gray-800';
      case 'on_hold':
      case 'on hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const [formData, setFormData] = useState<Partial<GoalFormValues>>({
    title: '',
    description: '',
    status: 'pending',
    targetDate: format(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      'yyyy-MM-dd'
    ),
    priority: 'medium',
    assignedEmployees: [], // Array of employee IDs
  });

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        console.log('Fetching employees...');
        const employeeList = await getEmployees();
        console.log('Employees loaded:', employeeList);
        setEmployees(employeeList);
      } catch (error) {
        console.error('Error loading employees:', error);
        toast.error('Failed to load employees');
      }
    };

    const loadData = async () => {
      await fetchGoals();
      await loadEmployees();
    };

    loadData();
  }, []);

  const fetchGoals = async () => {
    try {
      const goalsList = await getAllGoals();
      setGoals(goalsList);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }

    if (formData.description && formData.description.length > 1000) {
      errors.description = 'Description must be less than 1000 characters';
    }

    if (!formData.targetDate) {
      errors.targetDate = 'Target date is required';
    } else if (new Date(formData.targetDate) < new Date()) {
      errors.targetDate = 'Target date must be in the future';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('title', formData.title || '');
      formDataToSubmit.append('description', formData.description || '');
      formDataToSubmit.append('status', formData.status || 'not_started');
      formDataToSubmit.append('targetDate', formData.targetDate || '');
      formDataToSubmit.append('priority', formData.priority || 'medium');

      // Handle assigned employees array
      if (formData.assignedEmployees) {
        formData.assignedEmployees.forEach((empId) => {
          formDataToSubmit.append('assignedEmployees[]', empId);
        });
      }

      if (editingGoal) {
        await updateGoalAction(editingGoal.$id, formDataToSubmit);
        toast.success('Goal updated successfully');
      } else {
        await createGoalAction(formDataToSubmit);
        toast.success('Goal created successfully');
      }

      // Reset form and close dialog
      resetForm();
      await fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      targetDate: format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      ),
      priority: 'medium',
      assignedEmployees: [],
    });
    setEditingGoal(null);
    setFormErrors({});
    setIsOpen(false);
  };

  const confirmDelete = async () => {
    if (!deletingGoal) return;

    setIsDeleting(true);
    try {
      await deleteGoal(deletingGoal.id);
      toast.success('Goal deleted successfully');
      await fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description || '',
      status: goal.status,
      targetDate: format(new Date(goal.targetDate), 'yyyy-MM-dd'),
      priority: goal.priority,
      assignedEmployees: goal.assignedEmployees || [],
    });
    setIsOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="pt-10">
        <h2 className="text-4xl font-light text-gray-900">Goals</h2>
        <p className="text-sm  text-gray-600">
          Manage your team&apos;s goals and track their progress.
        </p>
      </div>

      {/* Goal Form Dialog */}
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            resetForm();
          } else {
            setIsOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-none">
            <DialogTitle className="text-xl font-semibold">
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {editingGoal
                ? 'Update the goal details below.'
                : 'Fill in the details below to create a new goal.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-auto">
            <ScrollArea className="flex-1 pr-2 -mr-4">
              <div className="grid gap-4 py-2 pr-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <div className="col-span-3 space-y-1">
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        // Clear error when user starts typing
                        if (formErrors.title) {
                          setFormErrors(prev => ({
                            ...prev,
                            title: ''
                          }));
                        }
                      }}
                      className={`w-full ${formErrors.title ? 'border-red-500' : ''}`}
                      placeholder="Enter goal title"
                      disabled={isSubmitting}
                    />
                    {formErrors.title && (
                      <p className="text-sm text-red-600">{formErrors.title}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right mt-2">
                    Description
                  </Label>
                  <div className="col-span-3 space-y-1">
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => {
                        setFormData({ ...formData, description: e.target.value });
                        if (formErrors.description) {
                          setFormErrors(prev => ({
                            ...prev,
                            description: ''
                          }));
                        }
                      }}
                      className={`w-full ${formErrors.description ? 'border-red-500' : ''}`}
                      rows={3}
                      placeholder="Add a detailed description of the goal (optional)"
                      disabled={isSubmitting}
                    />
                    <div className="flex justify-between">
                      {formErrors.description && (
                        <p className="text-sm text-red-600">{formErrors.description}</p>
                      )}
                      <span className={`text-xs ${formData.description ? formData.description.length > 1000 ? 'text-red-600' : 'text-gray-500' : 'text-gray-500'}`}>
                        {formData.description ? formData.description.length : 0}/1000
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="status" className="text-right mt-2">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as GoalStatus })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="priority" className="text-right mt-2">
                    Priority
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value as GoalPriority })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right mt-2">Target Date</Label>
                  <div className="col-span-3 space-y-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !formData.targetDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.targetDate ? (
                            format(new Date(formData.targetDate), 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.targetDate ? new Date(formData.targetDate) : undefined}
                          onSelect={(date) =>
                            setFormData({
                              ...formData,
                              targetDate: date ? format(date, 'yyyy-MM-dd') : ''
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {formErrors.targetDate && (
                      <p className="text-sm text-red-600">{formErrors.targetDate}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right mt-2">Assigned To</Label>
                  <div className="col-span-3 space-y-2">
                    {employees.length > 0 ? (
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value && !formData.assignedEmployees?.includes(value)) {
                            setFormData({
                              ...formData,
                              assignedEmployees: [
                                ...(formData.assignedEmployees || []),
                                value,
                              ],
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee to assign" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>
                              {employee.name} ({employee.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No employees available
                      </p>
                    )}
                    {formData.assignedEmployees &&
                      formData.assignedEmployees.length > 0 && (
                        <>
                        <div className="mt-2 rounded-md max-h-[100px] overflow-y-auto space-y-2">
                          {formData.assignedEmployees.map((empId) => {
                            const employee = employees.find((e) => e.id === empId);
                            return (
                              <div
                                key={empId}
                                className="flex items-center justify-between p-2 border rounded-md"
                              >
                                <span>
                                  {employee?.name || 'Unknown Employee'}
                                  <span className="text-xs text-muted-foreground">{employee?.email && ` (${employee.email})`}</span>
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className='bg-destructive/10 hover:bg-destructive text-destructive hover:text-white'
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      assignedEmployees:
                                        formData.assignedEmployees?.filter(
                                          (id) => id !== empId
                                        ) || [],
                                    })
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                        </>

                      )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="flex-none pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="relative"
              >
                {isSubmitting && (
                  <span className="absolute left-3">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                )}
                {isSubmitting
                  ? editingGoal
                    ? 'Updating...'
                    : 'Creating...'
                  : editingGoal
                    ? 'Update Goal'
                    : 'Create Goal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deletingGoal}
        onOpenChange={(open) => !open && setDeletingGoal(null)}
        title="Delete Goal"
        description={`Are you sure you want to delete the goal "${deletingGoal?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />

      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
          <CardDescription>
            Manage your team&apos;s goals and track their progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="*:font-bold">
                  <TableHead></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading goals...
                    </TableCell>
                  </TableRow>
                ) : goals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No goals found. Create your first goal to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  goals.map((goal, index) => (
                    <TableRow key={goal.$id}>
                      <TableCell className="font-bold">{index + 1}.</TableCell>
                      <TableCell className="font-medium">
                        {goal.title}
                      </TableCell>
                      <TableCell>{goal.description}</TableCell>
                      <TableCell>
                        {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}
                        >
                          {goal.status.charAt(0).toUpperCase() +
                            goal.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPriorityColor(goal.priority)}`}
                        >
                          {goal.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        {goal.assignedEmployees &&
                          goal.assignedEmployees.length > 0 ? (
                          <div className="space-y-1">
                            {goal.assignedEmployees
                              .map((empId) =>
                                employees.find((emp) => emp.id === empId)
                              )
                              .filter(Boolean)
                              .map((emp) => (
                                <div key={emp!.id}>
                                  <span className="font-medium">
                                    {emp!.name}
                                  </span>
                                  {emp!.email && (
                                    <div className="text-xs text-muted-foreground">
                                      ({emp!.email})
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(goal)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.preventDefault();
                                setDeletingGoal({ id: goal.$id, title: goal.title });
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
