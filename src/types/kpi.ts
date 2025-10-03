// KPI TypeScript types/interfaces

export type KPIPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type KPIStatus = 'on track' | 'behind' | 'exceeded' | 'at risk';

export interface BaseKPI {
  id: string;
  name: string;
  description?: string;
  period: KPIPeriod;
  targetValue: number;
  currentValue: number;
  unit: string; // e.g., "clients", "USD", "projects", "%"
  status: KPIStatus;
  lastUpdated: string; // ISO string
}

// Revenue KPIs
export interface RetainerRevenueKPI extends BaseKPI {
  type: 'retainer_revenue';
  monthlyRetainerTotal: number;
  currency: 'PKR';
  clientCount: number;
}

export interface QuarterlyRevenueKPI extends BaseKPI {
  type: 'quarterly_revenue';
  quarter: string; // e.g., "Q4-2025"
  targetRevenue: number;
  closedRevenue: number;
  currency: 'PKR';
  projectsAdded: number;
}

// Client KPIs
export interface HighValueClientsKPI extends BaseKPI {
  type: 'high_value_clients';
  clientsWithMultipleProjects: number;
  totalClients: number;
  percentage: number;
}

export interface ClientAcquisitionKPI extends BaseKPI {
  type: 'client_acquisition';
  quarter: string;
  targetClients: number;
  acquiredClients: number;
  clientsWith2PlusProjects: number;
}

// Lead & Sales KPIs
export interface LeadsAddedKPI extends BaseKPI {
  type: 'leads_added';
  weeklyTarget?: number;
  quarterlyTarget?: number;
  weeklyCurrent?: number;
  quarterlyCurrent?: number;
}

export interface OutreachMessagesKPI extends BaseKPI {
  type: 'outreach_messages';
  weeklyTarget?: number;
  quarterlyTarget?: number;
  weeklyCurrent?: number;
  quarterlyCurrent?: number;
}

export interface MeetingsBookedKPI extends BaseKPI {
  type: 'meetings_booked';
  weeklyTarget?: number;
  quarterlyTarget?: number;
  weeklyCurrent?: number;
  quarterlyCurrent?: number;
}

export interface ProposalsSentKPI extends BaseKPI {
  type: 'proposals_sent';
  weeklyTarget?: number;
  quarterlyTarget?: number;
  weeklyCurrent?: number;
  quarterlyCurrent?: number;
}

export interface SalesConversionKPI extends BaseKPI {
  type: 'sales_conversion';
  leadsQualified: number;
  leadsConverted: number;
  conversionRate: number; // percentage
}

// Partnership KPIs
export interface AgencyPartnershipsKPI extends BaseKPI {
  type: 'agency_partnerships';
  quarter: string;
  targetPartners: number;
  currentPartners: number;
  totalAgencies: number;
  totalClients: number;
}

// Employee KPIs
export interface EmployeeOfMonthKPI extends BaseKPI {
  type: 'employee_of_month';
  month: string; // YYYY-MM
  winnerId?: string;
  winnerName?: string;
  attendanceScore: number;
  bonusEarned: number;
  criteriaMet: string[];
}

export interface HiringKPI extends BaseKPI {
  type: 'hiring';
  positionsNeeded: Array<{
    position: string;
    department: string;
    priority: 'high' | 'medium' | 'low';
    targetFillDate?: string;
  }>;
  positionsFilled: number;
}

// Financial KPIs
export interface CashOnHandKPI extends BaseKPI {
  type: 'cash_on_hand';
  currentCash: number;
  currency: 'PKR';
  minimumThreshold: number;
  bankBalance: number;
  cashBalance: number;
}

export interface AccountsReceivableKPI extends BaseKPI {
  type: 'accounts_receivable';
  totalOutstanding: number;
  currency: 'PKR';
  overdueAmount: number;
  currentAmount: number;
  clientCount: number;
}

export interface DSOKPI extends BaseKPI {
  type: 'dso'; // Days Sales Outstanding
  averageDays: number;
  targetDays: number;
  trend: 'improving' | 'worsening' | 'stable';
}

export interface ExpenseTargetKPI extends BaseKPI {
  type: 'expense_target';
  quarter: string;
  targetExpense: number;
  actualExpense: number;
  currency: 'PKR';
  variancePercentage: number;
}

export interface EmployeeSalaryKPI extends BaseKPI {
  type: 'employee_salary';
  totalEmployees: number;
  totalSalaryCost: number;
  currency: 'PKR';
  averageSalary: number;
  salaryBudget: number;
}

export interface ProfitLossKPI extends BaseKPI {
  type: 'profit_loss';
  quarter: string;
  totalRevenue: number;
  totalExpenses: number;
  totalSalaries: number;
  netProfit: number;
  profitMarginPercentage: number;
  currency: 'PKR';
}

// Company Goals
export interface CompanyGoal {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  targetDate?: string; // YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  category: 'quality' | 'growth' | 'process' | 'culture' | 'financial';
  assignedTo?: string[];
  progressPercentage: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

// Union type for all KPIs
export type KPI =
  | RetainerRevenueKPI
  | QuarterlyRevenueKPI
  | HighValueClientsKPI
  | ClientAcquisitionKPI
  | LeadsAddedKPI
  | OutreachMessagesKPI
  | MeetingsBookedKPI
  | ProposalsSentKPI
  | SalesConversionKPI
  | AgencyPartnershipsKPI
  | EmployeeOfMonthKPI
  | HiringKPI
  | CashOnHandKPI
  | AccountsReceivableKPI
  | DSOKPI
  | ExpenseTargetKPI
  | EmployeeSalaryKPI
  | ProfitLossKPI;

export interface KPIDashboard {
  id: string;
  name: string;
  kpis: KPI[];
  companyGoals: CompanyGoal[];
  lastUpdated: string; // ISO string
}
