'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  actions?: ReactNode;
  className?: string;
  heading?: string;
}

export default function PageLayout({
  children,
  title,
  description,
  icon,
  badge,
  actions,
  className,
  heading,
}: PageLayoutProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50',
        className
      )}
    >
      {/* Header Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]" />

        <div className="relative px-6 py-8 sm:px-8 sm:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              {/* Title Section */}
              <div className="flex items-center gap-4">
                {icon && (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                    {icon}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                      {title}
                    </h1>
                    {badge && (
                      <Badge
                        variant={badge.variant || 'secondary'}
                        className="text-sm"
                      >
                        {badge.text}
                      </Badge>
                    )}
                  </div>
                  {description && (
                    <p className="text-lg text-gray-600 max-w-2xl">
                      {description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Section */}
              {actions && (
                <div className="flex items-center gap-3">{actions}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

      {/* Content Section */}
      <div className="relative">
        <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
          {heading && (
            <div className="mb-6 px-2">
              <h2 className="text-2xl font-semibold text-gray-900">
                {heading}
              </h2>
            </div>
          )}
          <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-xl shadow-gray-900/5 ring-1 ring-gray-900/5">
            <div className="p-6 sm:p-8">{children}</div>
          </Card>
        </div>
      </div>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-600/20 blur-3xl" />
      </div>
    </div>
  );
}
