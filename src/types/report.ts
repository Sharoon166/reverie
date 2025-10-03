export interface QuarterSummary {
  id: string;
  name: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  status: 'active' | 'closed' | 'archived';
  totalRevenue: number;
  totalExpenses: number;
  totalSalaries: number;
  netProfit: number;
  profitMargin: number;
  counts: {
    clients: number;
    newClients: number;
    leads: number;
    convertedLeads: number;
    invoices: number;
    paidInvoices: number;
  };
  startDate: string;
  endDate: string;
}

export interface QuarterClosure {
  id: string;
  quarterId: string;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  status: 'active' | 'closed' | 'archived';
  closedDate: string;
  totalRevenue: number;
  totalExpenses: number;
  totalSalaries: number;
  netProfit: number;
  profitMargin: number;
  cashOnHand: number;
  withdrawalAmount: number;
  remainingBalance: number;
  reportFileId: string;
  reportFileName: string;
  closedBy: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}
