"use client";
import React, { useState, useEffect, JSX } from "react";
import { getDaysInMonth, getDay, format, isToday } from "date-fns";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

type Goal = {
  $id: string;
  title: string;
  description: string;
  targetDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'ongoing' | 'complete';
};

const priorityColors = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444'
};

const CalendarWidget: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedDay, setSelectedDay] = useState<{ date: Date; events: Goal[] } | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetDate, setTargetDate] = useState("");

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Fetch goals on component mount
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  // Handle adding a new goal
  const handleAddGoal = async () => {
    if (!title.trim() || !targetDate) {
      toast.error('Please fill in title and target date');
      return;
    }

    setIsLoading(true);

    const addGoalPromise = async () => {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          targetDate,
          priority,
          status: 'pending'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      const newGoal = await response.json();
      setGoals(prev => [...prev, newGoal]);

      // Reset form
      setTitle("");
      setDescription("");
      setPriority('medium');
      setTargetDate("");
      setShowAddDialog(false);

      return 'Goal created successfully';
    };

    toast.promise(addGoalPromise(), {
      loading: 'Creating goal...',
      success: (message) => message,
      error: 'Failed to create goal. Please try again.',
    });

    setIsLoading(false);
  };

  // Handle day click
  const handleDayClick = (date: Date, events: Goal[]) => {
    setSelectedDay({ date, events });
    if (events.length === 0) {
      setTargetDate(date.toISOString().split('T')[0]);
      setShowAddDialog(true);
    }
  };

  // Handle month navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Enhanced calendar grid component
  const CalendarGrid = ({
    year,
    month,
    goals,
    onDayClick
  }: {
    year: number;
    month: number;
    goals: Goal[];
    onDayClick: (date: Date, events: Goal[]) => void;
  }) => {
    const daysInMonth = getDaysInMonth(new Date(year, month, 1));
    const firstDayOfMonth = getDay(new Date(year, month, 1));

    // Group goals by day for quick lookup
    const goalsByDay: Record<number, Goal[]> = {};
    goals.forEach(goal => {
      const goalDate = new Date(goal.targetDate);
      if (goalDate.getMonth() === month && goalDate.getFullYear() === year) {
        const day = goalDate.getDate();
        if (!goalsByDay[day]) goalsByDay[day] = [];
        goalsByDay[day].push(goal);
      }
    });

    const days: JSX.Element[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-28 bg-gray-50/50 border border-gray-100" />
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayGoals = goalsByDay[day] || [];
      const isCurrentDay = isToday(date);
      const isHovered = hoveredDay === day;

      days.push(
        <div
          key={day}
          className={`
            border border-gray-200 p-2 h-28 overflow-hidden cursor-pointer transition-all duration-200
            ${isCurrentDay ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-200' : 'bg-white hover:bg-gray-50'}
            ${isHovered ? 'shadow-md scale-[1.02] z-10' : ''}
          `}
          onClick={() => onDayClick(date, dayGoals)}
          onMouseEnter={() => setHoveredDay(day)}
          onMouseLeave={() => setHoveredDay(null)}
        >
          <div className={`text-right text-sm font-medium mb-1 ${isCurrentDay ? 'text-yellow-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayGoals.slice(0, 3).map((goal: Goal) => (
              <div
                key={goal.$id}
                className="flex items-center gap-1.5 p-1 rounded-sm hover:bg-white/80 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: priorityColors[goal.priority] }}
                />
                <span className="text-xs font-medium truncate text-gray-700">
                  {goal.title}
                </span>
              </div>
            ))}
            {dayGoals.length > 3 && (
              <div className="text-xs text-gray-500 font-medium pl-3.5">
                +{dayGoals.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
        {days}
      </div>
    );
  };

  // Render the calendar
  return (
    <Card className="w-full overflow-hidden shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <p className="text-sm text-gray-500">
                {goals.filter(g => {
                  const goalDate = new Date(g.targetDate);
                  return goalDate.getMonth() === currentMonth &&
                    goalDate.getFullYear() === currentYear;
                }).length} goals this month
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-9 w-9 p-0 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-9 w-9 p-0 hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600 uppercase tracking-wide">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <CalendarGrid
          year={currentYear}
          month={currentMonth}
          goals={goals}
          onDayClick={handleDayClick}
        />

        {/* Quick stats */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>{goals.length} total goals</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="text-yellow-600 hover:text-yellow-700"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Add Goal Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter goal title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter goal description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
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
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddGoal}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Goals Dialog */}
      <Dialog open={!!selectedDay && !showAddDialog} onOpenChange={open => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {selectedDay?.date && format(selectedDay.date, 'EEEE, MMMM d, yyyy')}
                </div>
                {selectedDay?.date && isToday(selectedDay.date) && (
                  <Badge variant="secondary" className="mt-1">Today</Badge>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Goals list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Goals ({selectedDay?.events.length || 0})
                </h3>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedDay(null);
                    setTargetDate(selectedDay?.date.toISOString().split('T')[0] || '');
                    setShowAddDialog(true);
                  }}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Goal
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedDay?.events.length ? (
                  selectedDay.events.map(goal => (
                    <div key={goal.$id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: priorityColors[goal.priority] }}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900">{goal.title}</span>
                          <div className="text-xs text-gray-500 mt-0.5">
                            <Badge variant="outline" className="text-xs capitalize">
                              {goal.priority} Priority
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No goals for this date</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setSelectedDay(null)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CalendarWidget;