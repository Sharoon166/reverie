'use server';

import { Quarter } from '@/types/quarter';
import {
  getFinancialMetrics,
  getClientMetrics,
  getEmployeeMetrics,
  getInvoiceMetrics,
  calculateOverallPerformance,
  type Metric
} from './quarterTargets';

// Generate KPI dashboard summary
export async function generateKpiSummary(quarter: Quarter) {
  const [
    financial,
    clients,
    employees,
    invoices,
    overallPerformance
  ] = await Promise.all([
    getFinancialMetrics(quarter),
    getClientMetrics(quarter),
    getEmployeeMetrics(quarter),
    getInvoiceMetrics(quarter),
    calculateOverallPerformance(quarter)
  ]);

  return {
    // Financial Metrics
    ...financial,
    
    // Client & Leads Metrics
    ...clients,
    
    // Employee Metrics
    ...employees,
    
    // Invoice & Cash Metrics
    ...invoices,
    
    // Summary metrics
    overallPerformance,
    daysRemaining: quarter.closedDate ? getDaysRemainingInQuarter(quarter.closedDate) : 0,
    isClosed: isQuarterClosed(quarter),
  };
}


// Get all metrics for a specific category
export async function getMetricsByCategory(quarter: Quarter, category: 'financial' | 'clients' | 'employees' | 'invoices') {
  switch (category) {
    case 'financial':
      return await getFinancialMetrics(quarter);
    case 'clients':
      return await getClientMetrics(quarter);
    case 'employees':
      return await getEmployeeMetrics(quarter);
    case 'invoices':
      return await getInvoiceMetrics(quarter);
    default:
      return {};
  }
}

// Get a specific metric by key
export async function getMetric(quarter: Quarter, key: string): Promise<Metric | null> {
  const [financial, clients, employees, invoices] = await Promise.all([
    getFinancialMetrics(quarter),
    getClientMetrics(quarter),
    getEmployeeMetrics(quarter),
    getInvoiceMetrics(quarter),
  ]);
  
  const allMetrics = {
    ...financial,
    ...clients,
    ...employees,
    ...invoices,
  };
  
  const metric = allMetrics[key as keyof typeof allMetrics];
  return metric as Metric || null;
}

// Get quarter display name (e.g., "Q1 2025")
export function getQuarterDisplayName(quarter: Pick<Quarter, 'quarter' | 'year'>): string {
  return `Q${quarter.quarter} ${quarter.year}`;
}

// Check if a quarter is closed
export function isQuarterClosed(quarter: Pick<Quarter, 'status'>): boolean {
  return quarter.status === 'closed';
}

// Get days remaining in quarter
export function getDaysRemainingInQuarter(closedDate: string | null | undefined): number {
  if (!closedDate) return 0;
  const end = new Date(closedDate);
  const today = new Date();
  const diffTime = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

// Calculate profit margin
export function calculateProfitMargin(revenue: number, expenses: number): number {
  if (revenue === 0) return 0;
  return ((revenue - expenses) / revenue) * 100;
}

// Calculate variance between actual and target
export async function calculateVariance(actual: number, target: number): Promise<number> {
  'use server';
  if (target === 0) return 0;
  return ((actual - target) / target) * 100;
}
