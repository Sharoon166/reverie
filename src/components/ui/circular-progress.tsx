'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AnimatedArrow from '../AnimatedArrow';

const data = [
  { day: 'S', hours: 2.5 },
  { day: 'M', hours: 4.2 },
  { day: 'T', hours: 3.1 },
  { day: 'W', hours: 5.8 },
  { day: 'T', hours: 6.1 },
  { day: 'F', hours: 5.4 },
  { day: 'S', hours: 1.2 },
];

export function CircularProgressWidget() {
  const totalHours = 6.1;
  const targetHours = 8;
  const progressPercentage = (totalHours / targetHours) * 100;
  const circumference = 2 * Math.PI * 45; // radius of 45
  const strokeDasharray = circumference;
  const strokeDashoffset =
    circumference - (progressPercentage / 100) * circumference;

  return (
    <Card className="w-full max-w-sm bg-white/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium text-gray-700">
          Progress
        </CardTitle>
        <AnimatedArrow />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <div className="relative w-32 h-32">
            {/* Background circle */}
            <svg
              className="w-32 h-32 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#fbbf24"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 ease-in-out"
              />
            </svg>
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-semibold text-gray-900">
                {totalHours}h
              </span>
              <span className="text-xs text-gray-500">of {targetHours}h</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Work Time</p>
            <p className="text-xs text-gray-500">this week</p>
          </div>
        </div>

        {/* Weekly dots */}
        <div className="flex justify-center space-x-3">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center space-y-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  item.day === 'T' && item.hours === 6.1
                    ? 'bg-yellow-400'
                    : 'bg-gray-300'
                }`}
              />
              <span className="text-xs text-gray-500">{item.day}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
