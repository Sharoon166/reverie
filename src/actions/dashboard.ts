'use server';

import { APPWRITE_DB, db } from '@/lib/appwrite';
import { SalaryPayment } from '@/types';
import { getOrCreateCurrentQuarter } from '@/utils/quarterCreation';
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
  retainer?: string | number;
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
  invoicesPaid: number;
  totalExpenses: number;
  totalSalaries: number;
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
    invoicesPaid: 0,
    totalExpenses: 0,
    totalSalaries: 0,
  };

  try {
    // Get current quarter information
    const { quarter, year } = getCurrentQuarter();
    const { startDate, endDate } = getQuarterDateRange(quarter, year);
    const quarterMonths = getQuarterMonths(quarter, year);

    try {
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

      // Calculate Cash on Hand: Invoices Paid - Salaries - Expenses
      const cashOnHand = quarterlyRevenue - totalExpenses - totalSalaries

      // Calculate profit and profit margin
      const profit = quarterlyRevenue - totalExpenses - totalSalaries;
      const profitMargin =
        quarterlyRevenue > 0 ? (profit / quarterlyRevenue) * 100 : 0;

      return {
        quarterlyRevenue,
        profitMargin: parseFloat(profitMargin.toFixed(1)),
        cashOnHand,
        activeClients: clients.rows.length,
        invoicesPaid: paidInvoices.rows.length,
        totalExpenses,
        totalSalaries
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
  try {
    const quarter = await getOrCreateCurrentQuarter();
    const [stats, allClients] = await Promise.all([
      getDashboardStats(),
      // Get all clients to calculate monthly retainer revenue
      db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.clients,
        queries: [Query.limit(1000)],
      }) as Promise<{ rows: Client[] }>,
    ]);

    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const currentYear = now.getFullYear();

    // Calculate derived metrics based on available data
    const income = stats.quarterlyRevenue;

    // Since we don't have direct access to salaries and expenses separately,
    // we'll use the profit margin to estimate expenses
    const expenses = income * (1 - stats.profitMargin / 100);
    const profit = income - expenses;

    // Calculate monthly retainer revenue from clients
    const monthlyRetainerRevenue = allClients.rows.reduce(
      (sum, client) => sum + (Number(client.retainer) || 0),
      0
    );

    // Calculate target achievement (assuming a 10% growth target from previous quarter)
    const previousQuarterRevenue = income * 0.9; // Simulated previous quarter
    const revenueTarget = quarter.revenueTarget || 0;
    const revenueAchievement = income > 0 ? Math.min(100, (income / revenueTarget) * 100) : 0;

    // Calculate retainer target achievement (assuming 10% growth target)
    const previousMonthRetainer = monthlyRetainerRevenue * 0.9;
    const retainerTarget = quarter.retainerRevenueTarget || 0;
    const retainerAchievement = monthlyRetainerRevenue > 0
      ? Math.min(100, (monthlyRetainerRevenue / retainerTarget) * 100)
      : 0;

    return [
      // 1. Monthly Retainer Revenue
      {
        id: 'monthly-retainer',
        name: 'Monthly Retainer Revenue',
        type: 'currency',
        currentValue: monthlyRetainerRevenue,
        targetValue: retainerTarget,
        change: 10, // Placeholder for growth percentage
        changeType: monthlyRetainerRevenue >= previousMonthRetainer ? 'increase' : 'decrease',
        icon: 'Coins',
        progress: retainerAchievement,
        color: retainerAchievement >= 100 ? 'bg-green-500' : 'bg-blue-500',
        description: `${allClients.rows.length} active clients`,
      },
      // 2. Quarterly Revenue
      {
        id: 'quarterly-revenue',
        name: 'Quarterly Revenue',
        type: 'currency',
        currentValue: income,
        targetValue: revenueTarget,
        change: 10, // Placeholder for growth percentage
        changeType: income >= previousQuarterRevenue ? 'increase' : 'decrease',
        icon: 'DollarSign',
        progress: revenueAchievement,
        color: revenueAchievement >= 100 ? 'bg-green-500' : 'bg-blue-500',
        description: `Q${currentQuarter} ${currentYear} Total Revenue`,
      },
      // 2. Profit & Loss
      {
        id: 'profit-loss',
        name: 'Quarterly Profit/Loss',
        type: 'currency',
        currentValue: profit,
        targetValue: income * 0.2, // 20% profit target
        change: stats.profitMargin - 20, // vs target profit margin
        changeType: profit >= 0 ? 'increase' : 'decrease',
        icon: 'TrendingUp',
        progress: income > 0 ? Math.min(100, (profit / (income * 0.2)) * 100) : 0,
        color: profit >= 0 ? 'bg-green-500' : 'bg-red-500',
        description: `Q${currentQuarter} ${currentYear} Profit/Loss (${stats.profitMargin.toFixed(1)}% margin)`,
      },
      // 3. Cash on Hand (Quarterly View)
      {
        id: 'cash-on-hand',
        name: 'Cash on Hand',
        type: 'currency',
        currentValue: stats.cashOnHand,
        targetValue: stats.quarterlyRevenue * 0.3, // Target 30% of quarterly revenue as cash reserve
        change: stats.quarterlyRevenue > 0 
          ? ((stats.cashOnHand - (stats.quarterlyRevenue * 0.3)) / (stats.quarterlyRevenue * 0.3)) * 100 
          : 0,
        changeType: stats.cashOnHand >= (stats.quarterlyRevenue * 0.3) ? 'increase' : 'decrease',
        icon: 'Wallet',
        progress: stats.quarterlyRevenue > 0
          ? Math.min(100, (stats.cashOnHand / (stats.quarterlyRevenue * 0.3)) * 100)
          : 0,
        color: stats.cashOnHand >= (stats.quarterlyRevenue * 0.3) ? 'bg-green-500' : 'bg-amber-500',
        description: `Q${currentQuarter} ${currentYear} Cash Position (Invoices – Expenses – Salaries)`
      },
      // 4. Active Clients
      {
        id: 'active-clients',
        name: 'Active Clients',
        type: 'number',
        currentValue: stats.activeClients,
        targetValue: stats.activeClients + 5, // Target 5 more active clients
        change: 5.2, // Placeholder for growth percentage
        changeType: 'increase',
        icon: 'Users',
        progress: Math.min(100, (stats.activeClients / (stats.activeClients + 5)) * 100) || 0,
        color: 'bg-blue-500',
        description: 'Number of active clients'
      }
,
    ];
  } catch (error) {
    console.error('Error in getDashboardKPIs:', error);
    // Return default KPIs in case of error
    return [
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
  }
}
