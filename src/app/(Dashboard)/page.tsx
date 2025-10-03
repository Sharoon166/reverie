'use client';

import { useState, useEffect } from 'react';
import CalendarWidget from '@/components/CalendarWidget';
import GreetingAndStats from '@/components/landing-page/GreetingAndStats';
import ProfileCard from '@/components/landing-page/ProfileCard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  getDashboardKPIs,
  getRecentActivities,
  getQuickStats,
  type KPI,
} from '@/actions/dashboard';
import {
  TrendingUp,
  Coins,
  Users,
  Target,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  icon: string;
}
interface QuickStats {
  totalLeads?: number;
  overdueInvoices: number;
  wonLeads?: number;
  lostLeads?: number;
  pendingLeads?: number;
  pendingInvoices: number;
  activeProjects: number;
  totalInvoices: number;
  totalRevenue?: number;
}
export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [quickStats, setQuickStats] = useState<QuickStats>({
    totalLeads: 0,
    overdueInvoices: 0,
    wonLeads: 0,
    lostLeads: 0,
    pendingLeads: 0,
    pendingInvoices: 0,
    activeProjects: 0,
    totalInvoices: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [kpiData, activitiesData, statsData] = await Promise.all([
          getDashboardKPIs(),
          getRecentActivities(),
          getQuickStats(),
        ]);
        setKpis(kpiData);
        setActivities(activitiesData);
        setQuickStats(statsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="pt-16 space-y-6">
        <div className="flex justify-center items-center h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-16 space-y-6">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Error loading dashboard
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 space-y-6">
      <GreetingAndStats />
      <pre></pre>

      <div className="grid grid-cols-12 gap-6">
        {/* Profile Card */}
        <div className="col-span-12 lg:col-span-3 row span-2">
          <ProfileCard />
        </div>

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <h2 className="text-2xl font-bold">Key Metrics</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi) => {
              const IconComponent =
                {
                  Coins: Coins,
                  TrendingUp: TrendingUp,
                  Users: Users,
                  Target: Target,
                  CheckCircle2: CheckCircle2,
                }[kpi.icon] || Coins;

              return (
                <Card key={kpi.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {kpi.name}
                    </CardTitle>
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {kpi.type === 'currency' &&
                        new Intl.NumberFormat('en-PK', {
                          style: 'currency',
                          currency: 'PKR',
                        }).format(kpi.currentValue)}
                      {kpi.type === 'percentage' &&
                        `${kpi.currentValue.toFixed(1)}%`}
                      {kpi.type === 'number' &&
                        kpi.currentValue.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {kpi.changeType === 'increase' ? '+' : ''}
                      {kpi.change}% from last month
                    </p>
                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>
                          Target:{' '}
                          {kpi.type === 'currency'
                            ? new Intl.NumberFormat('en-PK', {
                                style: 'currency',
                                currency: 'PKR',
                              }).format(kpi.targetValue)
                            : kpi.type === 'percentage'
                              ? `${kpi.targetValue.toFixed(1)}%`
                              : kpi.targetValue.toLocaleString()}
                        </span>
                        <span>{Math.round(kpi.progress)}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${kpi.color}`}
                          style={{ width: `${Math.min(100, kpi.progress)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Calendar Widget */}
        </div>
      </div>
      {/* Additional Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest updates and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity) => {
                  const IconComponent =
                    {
                      FileText: FileText,
                      Users: Users,
                      CheckCircle2: CheckCircle2,
                    }[activity.icon] || CheckCircle2;

                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="bg-muted p-2 rounded-full">
                        <IconComponent className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No recent activities
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Active Projects</span>
                </div>
                <span className="font-medium">
                  {quickStats.activeProjects || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm">Total Invoices</span>
                </div>
                <span className="font-medium">
                  {quickStats.totalInvoices || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                  <span className="text-sm">Pending Invoices</span>
                </div>
                <span className="font-medium">
                  {quickStats.pendingInvoices || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span className="text-sm">Overdue Invoices</span>
                </div>
                <span className="font-medium">
                  {quickStats.overdueInvoices || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <CalendarWidget />
      </div>
    </div>
  );
}
