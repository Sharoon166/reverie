import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Crown, Award, Star, Trophy } from 'lucide-react';

interface KPICardProps {
  title: string;
  subtitle?: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  progress?: number;
  description?: string;
}

export function KPICard({
  title,
  subtitle,
  value,
  icon,
  color,
  progress,
  description,
}: KPICardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">
              {title}
              {subtitle && <span className="text-xs text-gray-500"> {subtitle}</span>}
            </p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        </div>
        {progress !== undefined && (
          <div className="w-40 space-y-1">
            <div className="text-xs text-gray-500 flex items-center justify-between">
              <span>{progress.toFixed(1)}%</span>
              <div className="flex items-center">
                {progress > 100 ? (
                  <Trophy className="inline size-4 text-amber-400" />
                ) : progress >= 75 ? (
                  <Crown className="inline size-4 text-yellow-500" />
                ) : progress >= 33 ? (
                  <Award className="inline size-4 text-blue-500" />
                ) : null}
                {progress > 100 && (
                  <span className="ml-1 text-amber-500 font-medium">+{Math.floor(progress - 100)} 🎉</span>
                )}
              </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  progress >= 100 ? 'bg-amber-500' : 
                  progress >= 66 ? 'bg-green-500' : 
                  progress >= 33 ? 'bg-amber-500' : 
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
