'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  type GoalFormValues
} from '@/actions/goals';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [formData, setFormData] = useState<Partial<GoalFormValues>>({
    title: '',
    description: '',
    status: 'pending',
    targetDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    priority: 'medium',
    assignedEmployees: [] // Array of employee IDs
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
      setLoading(true);
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
      if (formData.description) formDataToSubmit.append('description', formData.description);
      if (formData.status) formDataToSubmit.append('status', formData.status);
      if (formData.targetDate) formDataToSubmit.append('targetDate', formData.targetDate);
      if (formData.priority) formDataToSubmit.append('priority', formData.priority);
      
      // Handle assignedEmployees array
      if (Array.isArray(formData.assignedEmployees) && formData.assignedEmployees.length > 0) {
        formDataToSubmit.append('assignedEmployees', formData.assignedEmployees.join(','));
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
        targetDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        priority: 'medium',
        assignedEmployees: []
      });
      
      setIsOpen(false);
      fetchGoals();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Failed to save goal');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal(id);
        setGoals(goals.filter(goal => goal.$id !== id));
        toast.success('Goal deleted successfully');
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast.error('Failed to delete goal');
      }
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      status: goal.status,
      targetDate: goal.targetDate,
      priority: goal.priority,
      assignedEmployees: Array.isArray(goal.assignedEmployees) ? goal.assignedEmployees : []
    });
    setIsOpen(true);
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: GoalPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Goals</h1>
          <p className="text-gray-500">Track and manage your team&apos;s objectives</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingGoal(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
              <DialogDescription>
                {editingGoal ? 'Update the goal details below.' : 'Fill in the details below to create a new goal.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter goal title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter goal description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetDate">Target Date</Label>
                    <Input
                      id="targetDate"
                      type="date"
                      value={formData.targetDate}
                      onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as GoalStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value as GoalPriority })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignedEmployees">Assigned To</Label>
                    <Select
                      value={Array.isArray(formData.assignedEmployees) && formData.assignedEmployees.length > 0 ? formData.assignedEmployees[0] : ''}
                      onValueChange={(value) => setFormData({ ...formData, assignedEmployees: value ? [value] : [] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} ({employee.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Goals</CardTitle>
          <CardDescription>Manage your team&apos;s goals and track their progress.</CardDescription>
        </CardHeader>
        <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading goals...
                  </TableCell>
                </TableRow>
              ) : goals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No goals found. Create your first goal to get started.
                  </TableCell>
                </TableRow>
              ) : (
                goals.map((goal) => (
                  <TableRow key={goal.$id}>
                    <TableCell className="font-medium">
                      {goal.title}
                    </TableCell>
                    <TableCell>{goal.description}</TableCell>
                    <TableCell>{format(new Date(goal.targetDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                        {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      {goal.assignedEmployees && goal.assignedEmployees.length > 0 ? (
                        <div className="space-y-1">
                          {goal.assignedEmployees
                            .map(empId => employees.find(emp => emp.id === empId))
                            .filter(Boolean)
                            .map(emp => (
                              <div key={emp!.id} className="flex items-center gap-2">
                                <span className="font-medium">{emp!.name}</span>
                                {emp!.email && (
                                  <span className="text-xs text-muted-foreground">
                                    ({emp!.email})
                                  </span>
                                )}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
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
                            onClick={() => handleDelete(goal.$id)}
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
