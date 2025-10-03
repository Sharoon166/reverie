// Quarter Management TypeScript types/interfaces

export type QuarterStatus = 'open' | 'closed' | 'archived';

export interface Quarter {
  // Core Fields
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  quarterId: string;  // Format: "q1-2023", "q2-2023", etc.
  quarter: number;    // "Q1", "Q2", etc.
  year: number;
  status: QuarterStatus;
  
  // Dates
  closedDate?: string | null;  // ISO string when quarter is closed
  
  // Financial Metrics (all optional as they're calculated)
  totalRevenue?: number | null;
  totalExpenses?: number | null;
  netProfit?: number | null;
  profitMargin?: number | null;
  cashOnHand?: number | null;
  withdrawalAmount?: number | null;
  remainingBalance?: number | null;
  nextQuarterStartingBalance?: number | null;
  
  // Employee Metrics
  totalSalaries?: number | null;
  employeeOfTheMonth?: string[] | null;
  averageAttendance?: number | null;
  
  // Client & Project Metrics
  totalClients?: number | null;
  totalAgencies?: number | null;
  totalProjects?: number | null;
  newClients?: number | null;
  highValueClients?: number | null;
  totalRetainers?: number | null;
  monthlyRetainerRevenue?: number | null;
  
  // Leads & Sales Metrics
  totalLeads?: number | null;
  qualifiedLeads?: number | null;
  convertedLeads?: number | null;
  conversionRate?: number | null;
  proposalsSent?: number | null;
  meetingsBooked?: number | null;
  partnershipOutreach?: number | null;
  
  // Invoices & Payments
  totalInvoices?: number | null;
  paidInvoices?: number | null;
  unpaidInvoices?: number | null;
  overdueInvoices?: number | null;
  totalInvoiceAmount?: number | null;
  totalPaidAmount?: number | null;
  accountsReceivable?: number | null;
  quarterlyRevenueCollection?: number | null;

  // Closure Information
  closedBy?: string | null;  // User ID or name who closed the quarter
  summary?: string | null;   // Optional summary of the quarter
  reportGenerated?: boolean | null;
  
  // Targets (all optional with min: 0)
  revenueTarget?: number | null;
  expenseTarget?: number | null;
  profitTarget?: number | null;
  retainerRevenueTarget?: number | null;
  quarterlyRevenueCollectionTarget?: number | null;
  quarterlyExpenseTarget?: number | null;
  totalLeadsTarget?: number | null;
  conversionRateTarget?: number | null;
  proposalsSentTarget?: number | null;
  meetingsBookedTarget?: number | null;
  partnershipOutreachTarget?: number | null;
  clientAcquisitionTarget?: number | null;
  highValueClientsTarget?: number | null;
  totalSalariesTarget?: number | null;
  employeesVsSalariesTarget?: number | null;
  accountsReceivableTarget?: number | null;
  qualifiedLeadsTarget?: number | null;
  totalClientsTarget?: number | null;
  totalProjectsTarget?: number | null;
  monthlyRetainerRevenueTarget?: number | null;
  averageAttendanceTarget?: number | null;
  invoicesPendingTarget?: number | null;
  
  // KPI Settings
  kpiWeights?: {
    revenue?: number;
    profit?: number;
    retainerRevenue?: number;
    clientAcquisition?: number;
    highValueClients?: number;
    revenueCollection?: number;
    accountsReceivable?: number;
  } | null;
  
  // Dashboard Settings
  dashboardPreferences?: {
    showProfitTrend?: boolean;
    showRetainerRevenue?: boolean;
    showHighValueClients?: boolean;
    showClientAcquisition?: boolean;
    showOutreachMetrics?: boolean;
  } | null;
}

export interface QuarterReport {
  id: string;
  quarterId: string;
  quarter: string; // e.g., "Q1-2025"
  generatedAt: string; // ISO string
  generatedBy: string; // User ID

  // Report sections
  clientsSummary: {
    totalClients: number;
    newClients: number;
    highValueClients: number;
    totalProjects: number;
    totalRetainers: number;
  };

  leadsSummary: {
    totalLeads: number;
    newLeads: number;
    convertedLeads: number;
    conversionRate: number;
    leadsByStatus: Record<string, number>;
  };

  employeesSummary: {
    totalEmployees: number;
    totalSalariesPaid: number;
    employeeOfMonth: string[];
    averageAttendance: number;
  };

  invoicesSummary: {
    totalInvoices: number;
    paidInvoices: number;
    unpaidInvoices: number;
    overdueInvoices: number;
    totalInvoiceAmount: number;
    totalPaidAmount: number;
  };

  expensesSummary: {
    totalExpenses: number;
    targetExpenses: number;
    variancePercentage: number;
    expensesByCategory: Record<string, number>;
  };

  kpisSummary: {
    totalKPIs: number;
    achievedKPIs: number;
    achievementRate: number;
    keyMetrics: Array<{
      name: string;
      target: number;
      actual: number;
      status: string;
    }>;
  };

  profitLoss: {
    totalRevenue: number;
    totalExpenses: number;
    totalSalaries: number;
    netProfit: number;
    profitMargin: number;
    currency: 'PKR';
  };

  // PDF export info
  pdfUrl?: string;
  pdfGeneratedAt?: string; // ISO string
}

export interface QuarterCheckout {
  id: string;
  quarterId: string;
  quarter: string;
  checkoutDate: string; // ISO string

  // Financial details
  totalCashOnHand: number;
  withdrawalAmount: number;
  remainingBalance: number;
  currency: 'PKR';

  // Approval
  approvedBy: string; // User ID
  notes?: string;

  // Next quarter setup
  nextQuarterStartingBalance: number;
}
