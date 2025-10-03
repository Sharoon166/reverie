'use client';

import { ArrowUpRight } from 'lucide-react';
import { Bar, BarChart, XAxis, Cell } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/chart';

const chartData = [
  { day: 'S', hours: 2.5, dayFull: 'Sunday' },
  { day: 'M', hours: 4.2, dayFull: 'Monday' },
  { day: 'T', hours: 3.1, dayFull: 'Tuesday' },
  { day: 'W', hours: 1.8, dayFull: 'Wednesday' },
  { day: 'T', hours: 4.7, dayFull: 'Thursday' },
  { day: 'F', hours: 5.4, dayFull: 'Friday', highlighted: true },
  { day: 'S', hours: 0.8, dayFull: 'Saturday' },
];

const chartConfig = {
  hours: {
    label: 'Hours',
    color: '#1f2937',
  },
  highlighted: {
    label: 'Hours',
    color: '#fbbf24',
  },
} satisfies ChartConfig;

export function ProgressWidget() {
  const totalHours = chartData.reduce((sum, day) => sum + day.hours, 0);
  const highlightedDay = chartData.find((day) => day.highlighted);

  return (
    <Card className="w-80 bg-gray-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg font-medium text-gray-700">
          Progress
          <ArrowUpRight className="h-4 w-4" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-3xl font-light text-gray-900">
            {totalHours.toFixed(1)}h
          </div>
          <div className="text-sm text-gray-500">
            Work Time
            <br />
            this week
          </div>
        </div>

        <div className="relative">
          <ChartContainer config={chartConfig} className="h-24 w-full">
            <BarChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                dy={8}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-yellow-400 text-black px-2 py-1 rounded text-xs font-medium">
                        {Math.floor(data.hours)}h{' '}
                        {Math.round((data.hours % 1) * 60)}m
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="hours" radius={[50, 50, 50, 50]} barSize={8}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.highlighted ? '#fbbf24' : '#1f2937'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>

          <div className="flex justify-between items-center mt-1 px-4">
            {chartData.map((entry, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-2 h-2 rounded-full mb-1 ${entry.highlighted ? 'bg-yellow-400' : 'bg-gray-400'}`}
                />
              </div>
            ))}
          </div>

          {highlightedDay && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 translate-x-8">
              <div className="bg-yellow-400 text-black px-2 py-1 rounded text-xs font-medium">
                {Math.floor(highlightedDay.hours)}h{' '}
                {Math.round((highlightedDay.hours % 1) * 60)}m
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
