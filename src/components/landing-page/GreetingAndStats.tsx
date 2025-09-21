'use client';

import { ToolCase, UserPlus2, Users } from 'lucide-react';
import MotivationRotator from '../MotivationRotator';
import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/actions/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { APPWRITE_DB, db } from '@/lib/appwrite';
import { Query } from 'appwrite';

export default function GreetingAndStats() {
  const [stats, setStats] = useState<{
    revenue: { current: number; lastMonth: number };
    employees: number;
    projects: number;
    hirings: number;
    loading: boolean;
  }>({
    revenue: { current: 0, lastMonth: 0 },
    employees: 0,
    projects: 0,
    hirings: 0,
    loading: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel
        const [dashboardStats, employeesRes] = await Promise.all([
          getDashboardStats(),
          db.listRows({
            databaseId: APPWRITE_DB.databaseId,
            tableId: APPWRITE_DB.tables.employees,
            queries: [Query.limit(500)] // Adjust limit as needed
          })
        ]);
        console.log(dashboardStats)

        // Calculate current month and last month revenue
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const lastMonthStr = String(lastMonth + 1).padStart(2, '0');

        // Get current and last month revenue from salary payments
        const [salaryPaymentsRes, lastMonthPaymentsRes] = await Promise.all([
          db.listRows({
            databaseId: APPWRITE_DB.databaseId,
            tableId: APPWRITE_DB.tables.salary_payments,
            queries: [
              Query.limit(1000), // Adjust based on your data size
              Query.greaterThanEqual('month', `${currentYear}-${monthStr}`),
              Query.lessThan('month', `${currentYear}-${String(currentMonth + 2).padStart(2, '0')}`)
            ]
          }),
          db.listRows({
            databaseId: APPWRITE_DB.databaseId,
            tableId: APPWRITE_DB.tables.salary_payments,
            queries: [
              Query.limit(1000), // Adjust based on your data size
              Query.greaterThanEqual('month', `${lastMonthYear}-${lastMonthStr}`),
              Query.lessThan('month', `${lastMonthYear}-${String(lastMonth + 2).padStart(2, '0')}`)
            ]
          })
        ]);

        // Calculate total salaries for current and last month
        const currentMonthRevenue = salaryPaymentsRes.rows.reduce(
          (sum, payment) => sum + (parseFloat(payment.netAmount) || 0), 0 as number
        );

        const lastMonthRevenue = lastMonthPaymentsRes.rows.reduce(
          (sum, payment) => sum + (parseFloat(payment.netAmount) || 0), 0 as number
        );

        // Get hiring data (employees created in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newHiresRes = await db.listRows({
          databaseId: APPWRITE_DB.databaseId,
          tableId: APPWRITE_DB.tables.employees,
          queries: [
            Query.greaterThanEqual('$createdAt', thirtyDaysAgo.toISOString()),
            Query.limit(100)
          ]
        });

        // Get project count (if you have a projects table)
        let projectCount = 0;
        try {
          const projectsRes = await db.listRows({
            databaseId: APPWRITE_DB.databaseId,
            tableId: APPWRITE_DB.tables.projects, // Make sure this table exists
            queries: [Query.limit(1)]
          });
          projectCount = projectsRes.total;
        } catch (error) {
          console.warn('Could not fetch project count:', error);
          projectCount = 0;
        }

        setStats({
          revenue: {
            current: currentMonthRevenue,
            lastMonth: lastMonthRevenue
          },
          employees: employeesRes.total,
          projects: projectCount,
          hirings: newHiresRes.total,
          loading: false
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
  }, []);

  const growthPercentage = stats.revenue.lastMonth > 0 
    ? ((stats.revenue.current - stats.revenue.lastMonth) / stats.revenue.lastMonth) * 100 
    : 0;

  const capsuleStats = [
    { 
      label: 'Revenue (MTD)', 
      value: new Intl.NumberFormat('en-PK', { 
        style: 'currency', 
        currency: 'PKR',
        maximumFractionDigits: 0
      }).format(stats.revenue.current) 
    },
    { 
      label: 'Growth', 
      value: `${growthPercentage > 0 ? '+' : ''}${growthPercentage.toFixed(1)}%`,
      isPositive: growthPercentage >= 0
    },
    { 
      label: 'Satisfaction', 
      value: '92%' // This would come from a feedback/ratings API
    },
  ];

  const statsList = [
    { icon: Users, label: 'Employees', value: stats.employees },
    { icon: UserPlus2, label: 'Hirings', value: stats.hirings },
    { icon: ToolCase, label: 'Projects', value: stats.projects },
  ];

  const currentCapsule = capsuleStats[0];

  return (
    <div className="space-y-8">
      <div className='space-y-1'>
        <h2 className="text-4xl font-light">Welcome in, Ali</h2>
        <MotivationRotator
          messages={[
            'Take a deep breath and trust in Allah\'s plan.',
            'Success is a journey—remember to find peace along the way.',
            'Lead with kindness, gratitude, and integrity.',
            'May your decisions bring barakah and stay away from anything haram.',
            'Balance ambition with reflection and prayer.',
            'Your well-being matters as much as your achievements.',
            'Let every day begin and end with thankfulness.'
          ]}
          textClassName="text-sm text-muted-foreground"
        />
      </div>

      <div className="flex justify-between gap-8 flex-wrap">
        {/* Left Capsule Stat */}
        <div className="flex gap-2">
          <div className="grid place-content-center gap-2">
            <span className="text-muted-foreground text-sm font-medium">
              {currentCapsule.label}
            </span>
            {stats.loading ? (
              <Skeleton className="h-10 w-32 bg-accent" />
            ) : (
              <div className="bg-accent px-4 py-2 pr-12 rounded-full text-xl font-medium">
                {currentCapsule.value}
              </div>
            )}
          </div>
        </div>

        {/* Right Stats */}
        <div className="flex gap-6">
          {statsList.map((stat) => (
            <div key={stat.label}>
              <div className="flex gap-2 items-end">
                <stat.icon className="p-1 size-6 text-muted-foreground bg-muted rounded-sm" />
                {stats.loading ? (
                  <Skeleton className="h-14 w-16 bg-muted" />
                ) : (
                  <span className="text-6xl font-light">{stat.value}</span>
                )}
              </div>
              <span className="text-muted-foreground text-sm">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
