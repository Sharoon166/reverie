import { Quarter } from '@/types/quarter';
import { calculateVariance } from './quarterUtils';

// Base metric interface
export interface Metric {
  actual: number;
  target: number | undefined;
  progress: number;
  isMet: boolean;
  variance: number;
}

// Financial Targets
export async function getFinancialMetrics(quarter: Quarter) {
  const [
    revenue,
    expenses,
    profit,
    retainerRevenue,
    quarterlyExpense
  ] = await Promise.all([
    calculateMetric(quarter.totalRevenue ?? 0, quarter.revenueTarget ?? undefined),
    calculateMetric(quarter.totalExpenses ?? 0, quarter.expenseTarget ?? undefined),
    calculateMetric(quarter.netProfit ?? 0, quarter.profitTarget ?? undefined),
    calculateMetric(
      quarter.monthlyRetainerRevenue ?? 0,
      quarter.retainerRevenueTarget ?? undefined
    ),
    calculateMetric(
      quarter.totalExpenses ?? 0,
      quarter.quarterlyExpenseTarget ?? undefined
    ),
  ]);

  return {
    revenue,
    expenses,
    profit,
    retainerRevenue,
    quarterlyExpense,
  };
}

// Client & Leads Targets
export async function getClientMetrics(quarter: Quarter) {
  const [
    leads,
    conversionRate,
    proposalsSent,
    meetingsBooked,
    partnershipOutreach,
    clientAcquisition,
    highValueClients
  ] = await Promise.all([
    calculateMetric(
      quarter.totalLeads ?? 0,
      quarter.totalLeadsTarget ?? undefined
    ),
    calculateMetric(
      quarter.conversionRate ?? 0,
      quarter.conversionRateTarget ?? undefined
    ),
    calculateMetric(
      quarter.proposalsSent ?? 0,
      quarter.proposalsSentTarget ?? undefined
    ),
    calculateMetric(
      quarter.meetingsBooked ?? 0,
      quarter.meetingsBookedTarget ?? undefined
    ),
    calculateMetric(
      quarter.partnershipOutreach ?? 0,
      quarter.partnershipOutreachTarget ?? undefined
    ),
    calculateMetric(
      quarter.newClients ?? 0,
      quarter.clientAcquisitionTarget ?? undefined
    ),
    calculateMetric(
      quarter.highValueClients ?? 0,
      quarter.highValueClientsTarget ?? undefined
    ),
  ]);

  return {
    leads,
    conversionRate,
    proposalsSent,
    meetingsBooked,
    partnershipOutreach,
    clientAcquisition,
    highValueClients,
  };
}

// Employee Targets
export async function getEmployeeMetrics(quarter: Quarter) {
  const totalSalaries = quarter.totalSalaries ?? 0;
  const salaryTarget = quarter.totalSalariesTarget ?? 0;
  const employeesVsSalariesTarget = quarter.employeesVsSalariesTarget;
  
  const [salaries, employeesVsSalaries] = await Promise.all([
    calculateMetric(totalSalaries, salaryTarget),
    calculateMetric(
      quarter.employeeOfTheMonth?.length ?? 0,
      employeesVsSalariesTarget ?? undefined
    )
  ]);
  
  return {
    salaries,
    employeesVsSalaries: {
      ...employeesVsSalaries,
      // Special case: Lower ratio is better (more employees per salary dollar)
      isMet: employeesVsSalariesTarget ? totalSalaries <= employeesVsSalariesTarget : false,
    },
  };
}

// Invoices & Cash Targets
export async function getInvoiceMetrics(quarter: Quarter) {
  const [
    revenueCollection,
    accountsReceivable,
    invoicesPending
  ] = await Promise.all([
    calculateMetric(
      quarter.quarterlyRevenueCollection ?? 0,
      quarter.quarterlyRevenueCollectionTarget ?? undefined
    ),
    calculateMetric(
      quarter.accountsReceivable ?? 0,
      quarter.accountsReceivableTarget ?? undefined
    ),
    calculateMetric(
      quarter.unpaidInvoices ?? 0,
      quarter.invoicesPendingTarget ?? undefined
    ),
  ]);

  return {
    revenueCollection,
    accountsReceivable,
    invoicesPending,
  };
}

// Base metric calculation
async function calculateMetric(
  actual: number,
  target: number | undefined
): Promise<Metric> {
  const targetValue = target ?? 0;
  const progress = calculateProgress(actual, targetValue);
  
  return {
    actual,
    target: targetValue,
    progress,
    isMet: isTargetMet(actual, targetValue),
    variance: await calculateVariance(actual, targetValue),
  };
}

// Check if actual meets target
function isTargetMet(actual: number, target: number): boolean {
  return actual >= target;
}

// Calculate progress percentage
function calculateProgress(actual: number, target: number): number {
  if (target === 0) return 0;
  return Math.min((actual / target) * 100, 100);
}


// Calculate overall performance score (0-100)
export async function calculateOverallPerformance(quarter: Quarter): Promise<number> {
  // Get all metrics
  const [financialMetrics, clientMetrics, employeeMetrics, invoiceMetrics] = await Promise.all([
    getFinancialMetrics(quarter),
    getClientMetrics(quarter),
    getEmployeeMetrics(quarter),
    getInvoiceMetrics(quarter)
  ]);

  const metrics = {
    ...financialMetrics,
    ...clientMetrics,
    ...employeeMetrics,
    ...invoiceMetrics
  };

  // Define weights for available metrics
  const weights = {
    revenue: 0.3,      // Increased weight for revenue
    profit: 0.4,       // Increased weight for profit
    expenses: 0.2,     // Added expenses
    retainerRevenue: 0.1  // Added retainer revenue
  };

  // Calculate total available weight for normalization
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  // Calculate weighted score using only available metrics
  let score = 0;
  
  if (metrics.revenue) score += metrics.revenue.progress * 100 * weights.revenue;
  if (metrics.profit) score += metrics.profit.progress * 100 * weights.profit;
  if (metrics.expenses) score += (100 - metrics.expenses.progress) * 100 * weights.expenses; // Lower expenses are better
  if (metrics.retainerRevenue) score += metrics.retainerRevenue.progress * 100 * weights.retainerRevenue;

  // Normalize the score by total weight
  const normalizedScore = totalWeight > 0 ? score / totalWeight : 0;
  
  return Math.min(Math.round(normalizedScore), 100);
}

export async function getDashboardSummary(quarter: Quarter) {
  const [financial, clients, employees, invoices] = await Promise.all([
    getFinancialMetrics(quarter),
    getClientMetrics(quarter),
    getEmployeeMetrics(quarter),
    getInvoiceMetrics(quarter)
  ]);
  const performanceScore = await calculateOverallPerformance(quarter);

  return {
    financial,
    clients,
    employees,
    invoices,
    performance: {
      score: performanceScore,
      status: performanceScore >= 70 ? 'on-track' : performanceScore >= 50 ? 'needs-attention' : 'at-risk',
      trend: 'up' // This could be enhanced with historical data
    },
    summary: {
      revenue: financial.revenue,
      profit: financial.profit,
      // clientRetention: clients.clientRetention,
      // employeeRetention: employees.employeeRetention,
      // invoiceCollection: invoices.invoiceCollection
    },
    lastUpdated: new Date().toISOString(),
    quarter: {
      id: quarter.quarterId,
      name: `Q${quarter.quarter} ${quarter.year}`,
      status: quarter.status,
      closedDate: quarter.closedDate || null
    }
  };
}
