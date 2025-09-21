// Quarter Management TypeScript types/interfaces

export type QuarterStatus = 'active' | 'closed' | 'archived';

export interface Quarter {
  id: string;
  name: string; // e.g., "Q1-2025"
  year: number;
  quarter: 1 | 2 | 3 | 4;
  startDate: string; // ISO string
  endDate: string; // ISO string
  status: QuarterStatus;
  closedDate?: string; // ISO string
  
  // Financial summary
  totalRevenue: number;
  totalExpenses: number;
  totalSalaries: number;
  netProfit: number;
  currency: 'PKR';
  
  // Carryover balance
  startingBalance: number;
  endingBalance: number;
  withdrawalAmount?: number; // If user withdraws money at quarter close
  
  // Metadata
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
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