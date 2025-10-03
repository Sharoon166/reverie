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
import { MoreHorizontal, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
      toast.error('Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create form data with proper array handling
      const formDataToSubmit = new FormData();

      // Add all form fields
      if (formData.title) formDataToSubmit.append('title', formData.title);
      if (formData.description)
        formDataToSubmit.append('description', formData.description);
      if (formData.status) formDataToSubmit.append('status', formData.status);
      if (formData.targetDate)
        formDataToSubmit.append('targetDate', formData.targetDate);
      if (formData.priority)
        formDataToSubmit.append('priority', formData.priority);

      // Handle assignedEmployees array
      if (
        Array.isArray(formData.assignedEmployees) &&
        formData.assignedEmployees.length > 0
      ) {
        formDataToSubmit.append(
          'assignedEmployees',
          formData.assignedEmployees.join(',')
        );
      }

      if (editingGoal) {
        await updateGoalAction(editingGoal.$id, formDataToSubmit);
        toast.success('Goal updated successfully');
      } else {
        await createGoalAction(formDataToSubmit);
        toast.success('Goal created successfully');
      }

      // Reset form and close dialog
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

      setIsOpen(false);
      await fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Failed to save goal');
    }
  };

  const handleDeleteClick = (goal: Goal) => {
    setDeletingGoal({ id: goal.$id, title: goal.title });
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
      targetDate: goal.targetDate,
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
                                handleDeleteClick(goal);
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
