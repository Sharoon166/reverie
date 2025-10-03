'use client';

import { Card } from '@/components/ui/card';
import {
  CheckCircle,
  Users,
  FileText,
  MessageSquare,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

export default function TaskManagement() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Interview',
      time: 'Sep 15, 09:30',
      icon: CheckCircle,
      completed: true,
    },
    {
      id: 2,
      title: 'Team Meeting',
      time: 'Sep 15, 14:00',
      icon: Users,
      completed: true,
    },
    {
      id: 3,
      title: 'Project Update',
      time: 'Sep 15, 17:00',
      icon: FileText,
      completed: false,
    },
    {
      id: 4,
      title: 'Discuss Q3 Goals',
      time: '',
      icon: MessageSquare,
      completed: false,
    },
    {
      id: 5,
      title: 'HR Policy Review',
      time: 'Sep 15, 16:30',
      icon: Shield,
      completed: false,
    },
    {
      id: 6,
      title: 'HR  Review',
      time: 'Sep 15, 16:30',
      icon: Shield,
      completed: false,
    },
  ]);

  const toggleTask = (taskId: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <div className="min-h-screen rounded-xl bg-yellow-50 p-6">
      <div className="max-w-sm mx-auto space-y-16">
        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-medium text-gray-900">Onboarding</h1>
            <span className="text-xl font-medium text-gray-900">18%</span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>30%</span>
              <span>25%</span>
              <span>0%</span>
            </div>
            <div className="flex gap-1 h-3">
              <div className="flex-1 bg-yellow-400 rounded-full"></div>
              <div className="flex-1 bg-gray-800 rounded-full"></div>
              <div className="flex-1 bg-gray-300 rounded-full"></div>
            </div>
          </div>

          {/* Task Label */}
          <div className="inline-block bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
            Task
          </div>
        </div>

        {/* Task List Card */}
        <Card className="bg-gray-900 text-white p-4 rounded-3xl border-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Onboarding Task</h2>
              <span className="text-lg font-medium">2/8</span>
            </div>

            <div className="space-y-4">
              {tasks.map((task) => {
                const IconComponent = task.icon;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-colors"
                    onClick={() => toggleTask(task.id)}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        task.completed ? 'bg-gray-700' : 'bg-white'
                      }`}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${task.completed ? 'text-gray-400' : 'text-gray-900'}`}
                      />
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-medium ${task.completed ? 'text-white line-through' : 'text-gray-400'}`}
                      >
                        {task.title}
                      </h3>
                      {task.time && (
                        <p
                          className={`text-sm ${task.completed ? 'text-gray-300 line-through' : 'text-gray-500'}`}
                        >
                          {task.time}
                        </p>
                      )}
                    </div>
                    {task.completed && (
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
