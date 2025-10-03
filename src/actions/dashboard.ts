'use server';

import { APPWRITE_DB, db } from '@/lib/appwrite';
import { SalaryPayment } from '@/types';
import { Query } from 'appwrite';

// Base interface that matches Appwrite's Row type
interface BaseRow {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  $databaseId: string;
  $tableId: string;
  $permissions: string[];
  $collectionId: string;
  $sequence: number;
}

interface Invoice extends BaseRow {
  amount: string;
  status: string;
  issueDate: string;
  paidDate?: string;
  clientId: string;
}

interface Expense extends BaseRow {
  amount: string;
  status?: string;
  date: string;
  categoryId: string;
}

interface Client extends BaseRow {
  status: string;
}

export interface KPI {
  id: string;
  name: string;
  type: 'currency' | 'percentage' | 'number';
  currentValue: number;
  targetValue: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: string;
  progress: number;
  color: string;
  description: string;
}

interface DashboardStats {
  quarterlyRevenue: number;
  profitMargin: number;
  cashOnHand: number;
  activeClients: number;
  pendingTasks: number;
  teamPerformance: number;
}

// Helper functions for quarter calculations
function getCurrentQuarter() {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1; // 1-4
  const year = now.getFullYear();

  return { quarter, year };
}

function getQuarterDateRange(quarter: number, year: number) {
  const startMonth = (quarter - 1) * 3; // 0, 3, 6, 9
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0); // Last day of quarter

  return {
    startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD
    endDate: endDate.toISOString().split('T')[0],
  };
}

function getQuarterMonths(quarter: number, year: number): string[] {
  const startMonth = (quarter - 1) * 3 + 1; // 1, 4, 7, 10
  const months: string[] = [];

  for (let i = 0; i < 3; i++) {
    const month = startMonth + i;
    months.push(`${year}-${String(month).padStart(2, '0')}`);
  }

  return months;
}

// Get dashboard statistics
export async function getDashboardStats(): Promise<DashboardStats> {
  // Default fallback values
  const defaultStats: DashboardStats = {
    quarterlyRevenue: 0,
    profitMargin: 0,
    cashOnHand: 0,
    activeClients: 0,
    pendingTasks: 0,
    teamPerformance: 75, // Default team performance
  };

  try {
    // Get current quarter information
    const { quarter, year } = getCurrentQuarter();
    const { startDate, endDate } = getQuarterDateRange(quarter, year);
    const quarterMonths = getQuarterMonths(quarter, year);

    console.log(
      `Calculating Cash on Hand for Q${quarter}-${year} (${startDate} to ${endDate})`
    );

    try {
      console.log('Fetching invoices...');
      // Get all invoices from current quarter, filter paid ones in code
      const allInvoices = (await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.invoices,
        queries: [
          Query.greaterThanEqual('issueDate', startDate),
          Query.lessThanEqual('issueDate', endDate),
          Query.limit(1000),
        ],
      })) as unknown as { rows: Invoice[] };

      // Filter paid invoices in code to avoid schema issues
      const paidInvoices = {
        rows: (allInvoices.rows || []).filter((invoice) => {
          const status = (invoice.status || '').toString().toLowerCase();
          const hasPaidDate = invoice.paidDate && invoice.paidDate !== '';
          return status === 'paid' || hasPaidDate;
        }),
      };

      console.log(
        `Found ${allInvoices.rows?.length || 0} total invoices, ${paidInvoices.rows.length} paid`
      );

      // Get expenses from current quarter
      const quarterExpenses = (await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.expenses,
        queries: [
          Query.greaterThanEqual('date', startDate),
          Query.lessThanEqual('date', endDate),
          Query.limit(1000),
        ],
      })) as unknown as { rows: Expense[] };

      // Get all salary payments for current quarter months, filter paid ones in code
      const allSalaryPayments = (await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.salary_payments,
        queries: [Query.limit(1000)],
      })) as unknown as { rows: SalaryPayment[] };

      // Filter salary payments for current quarter months and paid status
      const salaryPayments = {
        rows: (allSalaryPayments.rows || []).filter((payment) => {
          const month = payment.month;
          const status = (payment.status || '').toString().toLowerCase();
          const hasPaidDate = payment.paidDate && payment.paidDate !== '';
          return (
            quarterMonths.includes(month) && (status === 'paid' || hasPaidDate)
          );
        }),
      };

      console.log(
        `Found ${allSalaryPayments.rows?.length || 0} total salary payments, ${salaryPayments.rows.length} for current quarter`
      );

      // Get all clients, filter active ones in code
      const allClients = (await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.clients,
        queries: [Query.limit(1000)],
      })) as unknown as { rows: Client[] };

      // Filter active clients in code
      const clients = {
        rows: (allClients.rows || []).filter((client) => {
          const status = (client.status || '').toString().toLowerCase();
          return (
            status === 'active' || status === 'Active' || status === 'ACTIVE'
          );
        }),
      };

      console.log(
        `Found ${allClients.rows?.length || 0} total clients, ${clients.rows.length} active`
      );

      // Calculate revenue from PAID invoices in current quarter
      const quarterlyRevenue = (paidInvoices.rows || []).reduce(
        (sum, invoice) => {
          const amount = parseFloat(invoice.amount) || 0;
          if (amount < 0) {
            console.warn(`Negative amount found in invoice: ${invoice.$id}`);
            return sum;
          }
          return sum + amount;
        },
        0
      );

      // Calculate total expenses in current quarter
      const totalExpenses = (quarterExpenses.rows || []).reduce(
        (sum, expense) => {
          const amount = parseFloat(expense.amount) || 0;
          if (amount < 0) {
            console.warn(`Negative amount found in expense: ${expense.$id}`);
            return sum;
          }
          return sum + amount;
        },
        0
      );

      // Calculate total salaries paid in current quarter
      const totalSalaries = (salaryPayments.rows || []).reduce(
        (sum, payment) => {
          const amount =
            parseFloat(String(payment.netAmount || payment.amount)) || 0;
          if (amount < 0) {
            console.warn(`Negative salary amount found: ${payment.$id}`);
            return sum;
          }
          return sum + amount;
        },
        0
      );

      // Calculate Cash on Hand: Revenue - (Expenses + Salaries)
      const cashOnHand = Math.max(
        0,
        quarterlyRevenue - (totalExpenses + totalSalaries)
      );

      // Calculate profit and profit margin
      const profit = quarterlyRevenue - totalExpenses - totalSalaries;
      const profitMargin =
        quarterlyRevenue > 0 ? (profit / quarterlyRevenue) * 100 : 0;

      // Calculate team performance based on tasks if available
      let pendingTasks = 0;
      let teamPerformance = 0;

      try {
        // Replace with actual task query if you have a tasks table
        // For now, use placeholder values
        pendingTasks = 5; // Placeholder
        teamPerformance = 75; // Placeholder
      } catch (error) {
        console.warn('Failed to fetch tasks for team performance', error);
        pendingTasks = 5; // Fallback placeholder
        teamPerformance = 75; // Fallback placeholder
      }

      console.log(`Q${quarter}-${year} Financial Summary:`, {
        revenue: quarterlyRevenue,
        expenses: totalExpenses,
        salaries: totalSalaries,
        cashOnHand,
        profit,
      });

      return {
        quarterlyRevenue,
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        cashOnHand,
        activeClients: clients.rows.length,
        pendingTasks,
        teamPerformance,
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Log the specific error for debugging
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      
      // Return default values instead of throwing to prevent UI breakage
      return defaultStats;
    }
  } catch (error) {
    console.error('Unexpected error in getDashboardStats:', error);
    
    // Log the full error for debugging
    if (error instanceof Error) {
      console.error('Unexpected error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
    
    // Return default values instead of throwing to prevent UI breakage
    return defaultStats;
  }
}

// Get all KPIs for the dashboard
interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  icon: string;
}

// Get recent activities for dashboard
export async function getRecentActivities() {
  const activities: Activity[] = [];
  try {
    // Get recent invoices (last 5)
    const recentInvoices = await db.listRows({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.invoices,
      queries: [Query.orderDesc('$createdAt'), Query.limit(3)],
    });

    recentInvoices.rows.forEach((invoice) => {
      activities.push({
        id: `invoice-${invoice.$id}`,
        type: 'invoice',
        title: `Invoice ${invoice.invoiceNumber} created`,
        description: `Invoice for ${invoice.clientName} - PKR ${Number(invoice.amount).toLocaleString()}`,
        date: invoice.$createdAt,
        icon: 'FileText',
      });
    });

    // Get recent employees (last 2)
    const recentEmployees = await db.listRows({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.employees,
      queries: [Query.orderDesc('$createdAt'), Query.limit(2)],
    });

    recentEmployees.rows.forEach((employee) => {
      activities.push({
        id: `employee-${employee.$id}`,
        type: 'employee',
        title: `New employee added`,
        description: `${employee.name} joined as ${employee.position}`,
        date: employee.$createdAt,
        icon: 'Users',
      });
    });

    // Sort by date (most recent first)
    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}

// Get quick stats for dashboard
export async function getQuickStats() {
  try {
    // Get active projects count (using clients as proxy)
    const activeClients = await db.listRows({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.clients,
      queries: [Query.limit(1000)],
    });

    const activeProjects = activeClients.rows.reduce((sum, client) => {
      return sum + (client.numberOfProjects || 0);
    }, 0);

    // Get pending invoices
    const allInvoices = await db.listRows({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.invoices,
      queries: [Query.limit(1000)],
    });

    const pendingInvoices = allInvoices.rows.filter((invoice) => {
      const status = (invoice.status || '').toString().toLowerCase();
      return status !== 'paid';
    }).length;

    // Get overdue invoices
    const overdueInvoices = allInvoices.rows.filter((invoice) => {
      const status = (invoice.status || '').toString().toLowerCase();
      const dueDate = new Date(invoice.dueDate);
      return status !== 'paid' && dueDate < new Date();
    }).length;

    return {
      activeProjects,
      pendingInvoices,
      overdueInvoices,
      totalInvoices: allInvoices.rows.length,
    };
  } catch (error) {
    console.error('Error fetching quick stats:', error);
    return {
      activeProjects: 0,
      pendingInvoices: 0,
      overdueInvoices: 0,
      totalInvoices: 0,
    };
  }
}

export async function getDashboardKPIs(): Promise<KPI[]> {
  // Default KPI values in case of error
  const defaultKPIs: KPI[] = [
    {
      id: 'revenue',
      name: 'Quarterly Revenue',
      type: 'currency',
      currentValue: 0,
      targetValue: 0,
      change: 0,
      changeType: 'decrease',
      icon: 'Coins',
      progress: 0,
      color: 'bg-gray-500',
      description: 'Total revenue for the current quarter',
    },
    // Add more default KPIs as needed
  ];

  try {
    const stats = await getDashboardStats();
    
    // If we got default stats (error case), return default KPIs
    if (stats.quarterlyRevenue === 0 && stats.activeClients === 0) {
      console.warn('Using default KPIs due to missing data');
      return defaultKPIs;
    }

    return [
      {
        id: 'revenue',
        name: 'Quarterly Revenue',
        type: 'currency',
        currentValue: stats.quarterlyRevenue,
        targetValue: stats.quarterlyRevenue * 1.1, // 10% growth target
        change: 12.5,
        changeType: 'increase',
        icon: 'Coins',
        progress: Math.min(
          100,
          (stats.quarterlyRevenue / (stats.quarterlyRevenue * 1.1)) * 100
        ),
        color: 'bg-green-500',
        description: 'Total revenue for the current quarter',
      },
      {
        id: 'profit-margin',
        name: 'Profit Margin',
        type: 'percentage',
        currentValue: stats.profitMargin,
        targetValue: stats.profitMargin * 1.05, // 5% improvement target
        change: 2.3,
        changeType: 'increase',
        icon: 'TrendingUp',
        progress: Math.min(
          100,
          (stats.profitMargin / (stats.profitMargin * 1.05)) * 100
        ),
        color: 'bg-blue-500',
        description: 'Profit margin for the current quarter',
      },
      {
        id: 'cash-on-hand',
        name: 'Cash on Hand',
        type: 'currency',
        currentValue: stats.cashOnHand,
        targetValue: stats.cashOnHand * 1.15, // 15% growth target
        change: 8.7,
        changeType: 'increase',
        icon: 'Coins',
        progress: Math.min(
          100,
          (stats.cashOnHand / (stats.cashOnHand * 1.15)) * 100
        ),
        color: 'bg-green-500',
        description: 'Available cash reserves',
      },
      {
        id: 'active-clients',
        name: 'Active Clients',
        type: 'number',
        currentValue: stats.activeClients,
        targetValue: stats.activeClients + 5, // 5 more clients target
        change: 3.2,
        changeType: 'increase',
        icon: 'Users',
        progress: Math.min(
          100,
          (stats.activeClients / (stats.activeClients + 5)) * 100
        ),
        color: 'bg-blue-500',
        description: 'Number of active clients',
      },
      {
        id: 'pending-tasks',
        name: 'Pending Tasks',
        type: 'number',
        currentValue: stats.pendingTasks,
        targetValue: Math.max(0, stats.pendingTasks - 10), // 10 fewer tasks target
        change: 15.8,
        changeType: 'decrease',
        icon: 'CheckCircle2',
        progress: Math.min(
          100,
          ((stats.pendingTasks - 10) / stats.pendingTasks) * 100 || 0
        ),
        color: 'bg-yellow-500',
        description: 'Number of pending tasks',
      },
      {
        id: 'team-performance',
        name: 'Team Performance',
        type: 'percentage',
        currentValue: stats.teamPerformance,
        targetValue: 90, // 90% target
        change: 5.2,
        changeType: 'increase',
        icon: 'Target',
        progress: stats.teamPerformance,
        color:
          stats.teamPerformance >= 90
            ? 'bg-green-500'
            : stats.teamPerformance >= 70
              ? 'bg-yellow-500'
              : 'bg-red-500',
        description: 'Overall team performance score',
      },
    ];
  } catch (error) {
    console.error('Error in getDashboardKPIs:', error);
    throw error;
  }
}
