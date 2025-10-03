// Comprehensive dummy data for the CRM system
// All demo/mock data is centralized here

import type {
  KPI,
  CompanyGoal,
  RetainerRevenueKPI,
  QuarterlyRevenueKPI,
  HighValueClientsKPI,
  ProfitLossKPI,
} from '@/types/kpi';
import type { Project } from '@/types/client';

// =============================================================================
// KPI DATA
// =============================================================================

export const DEMO_KPIS: KPI[] = [
  // 1. Retainer Revenue
  {
    id: 'kpi1',
    type: 'retainer_revenue',
    name: 'Monthly Retainer Revenue',
    description: 'Total monthly retainer income from clients',
    period: 'monthly',
    targetValue: 50000,
    currentValue: 42000,
    unit: 'PKR',
    status: 'behind',
    lastUpdated: '2025-01-27T10:00:00Z',
    monthlyRetainerTotal: 42000,
    currency: 'PKR',
    clientCount: 8,
  } as RetainerRevenueKPI,

  // 2. Quarterly Revenue Closed
  {
    id: 'kpi2',
    type: 'quarterly_revenue',
    name: 'Q1 2025 Revenue Target',
    description: 'Quarterly revenue closed from projects',
    period: 'quarterly',
    targetValue: 1000000,
    currentValue: 750000,
    unit: 'PKR',
    status: 'on track',
    lastUpdated: '2025-01-27T10:00:00Z',
    quarter: 'Q1-2025',
    targetRevenue: 1000000,
    closedRevenue: 750000,
    currency: 'PKR',
    projectsAdded: 12,
  } as QuarterlyRevenueKPI,

  // 3. High Value Clients
  {
    id: 'kpi3',
    type: 'high_value_clients',
    name: 'High Value Clients',
    description: 'Clients with more than 1 project',
    period: 'monthly',
    targetValue: 15,
    currentValue: 12,
    unit: 'clients',
    status: 'behind',
    lastUpdated: '2025-01-27T10:00:00Z',
    clientsWithMultipleProjects: 12,
    totalClients: 25,
    percentage: 48,
  } as HighValueClientsKPI,

  {
    id: 'kpi20',
    type: 'profit_loss',
    name: 'Q1 Profit & Loss',
    description: 'Quarterly profit and loss statement',
    period: 'quarterly',
    targetValue: 15,
    currentValue: 12.5,
    unit: '%',
    status: 'behind',
    lastUpdated: '2025-01-27T10:00:00Z',
    quarter: 'Q1-2025',
    totalRevenue: 750000,
    totalExpenses: 285000,
    totalSalaries: 375000,
    netProfit: 90000,
    profitMarginPercentage: 12.5,
    currency: 'PKR',
  } as ProfitLossKPI,
];

// =============================================================================
// COMPANY GOALS (Checkbox list for main page)
// =============================================================================

export const DEMO_GOALS: CompanyGoal[] = [
  {
    id: 'goal1',
    title: 'Implement Quality Assurance Process',
    description: 'Establish comprehensive QA procedures for all projects',
    isCompleted: false,
    targetDate: '2025-03-31',
    priority: 'high',
    category: 'quality',
    assignedTo: ['Ehtasham', 'Mansoor'],
    progressPercentage: 65,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-27T10:00:00Z',
  },
  {
    id: 'goal2',
    title: 'Achieve 95% Client Satisfaction',
    description: 'Maintain high client satisfaction through regular feedback',
    isCompleted: true,
    targetDate: '2025-02-28',
    priority: 'high',
    category: 'quality',
    assignedTo: ['Mehtab'],
    progressPercentage: 100,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-20T10:00:00Z',
  },
  {
    id: 'goal3',
    title: 'Expand Team by 3 Developers',
    description: 'Hire additional developers to meet growing demand',
    isCompleted: false,
    targetDate: '2025-06-30',
    priority: 'medium',
    category: 'growth',
    assignedTo: ['HR Team'],
    progressPercentage: 30,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-25T10:00:00Z',
  },
  {
    id: 'goal4',
    title: 'Establish Code Review Standards',
    description: 'Implement mandatory code review process for all commits',
    isCompleted: false,
    targetDate: '2025-04-15',
    priority: 'medium',
    category: 'process',
    assignedTo: ['Tech Team'],
    progressPercentage: 20,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-27T10:00:00Z',
  },
  {
    id: 'goal5',
    title: 'Achieve ISO 9001 Certification',
    description: 'Get ISO 9001 quality management certification',
    isCompleted: false,
    targetDate: '2025-12-31',
    priority: 'low',
    category: 'quality',
    assignedTo: ['Management'],
    progressPercentage: 10,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
];

// =============================================================================
// CLIENT DATA
// =============================================================================

export const DEMO_PROJECTS: Project[] = [
  {
    id: 'proj1',
    name: 'E-commerce Website',
    clientId: 'cl1',
    startDate: '2025-01-15T00:00:00Z',
    endDate: '2025-03-15T00:00:00Z',
    amount: 150000,
    currency: 'PKR',
    profitExpected: 45000,
    profitActual: 42000,
    status: 'In Progress',
    quarter: 'Q1-2025',
    description: 'Full-stack e-commerce solution with payment integration',
  },
  {
    id: 'proj2',
    name: 'Mobile App Development',
    clientId: 'cl1',
    startDate: '2024-11-01T00:00:00Z',
    endDate: '2025-01-31T00:00:00Z',
    amount: 200000,
    currency: 'PKR',
    profitExpected: 60000,
    profitActual: 58000,
    status: 'Completed',
    quarter: 'Q4-2024',
    description: 'React Native mobile application',
  },
  {
    id: 'proj3',
    name: 'Website Redesign',
    clientId: 'cl2',
    startDate: '2025-01-10T00:00:00Z',
    amount: 75000,
    currency: 'PKR',
    profitExpected: 22500,
    status: 'Planning',
    quarter: 'Q1-2025',
    description: 'Complete website redesign and optimization',
  },
];

// =============================================================================
// EMPLOYEE DATA
// =============================================================================

export const CSV_SAMPLE_DATA = {
  client: {
    name: 'John Smith',
    company: 'Acme Corp',
    contact: 'John Smith',
    email: 'john@acme.com',
    phone: '+92-300-1234567',
    source: 'LinkedIn',
    category: 'Client',
    start_date: '2025-01-01',
    retainer: '10000',
    status: 'active',
    notes: 'Sample client data',
  },
  employee: {
    employeeId: 'EMP001',
    name: 'John Doe',
    email: 'john@company.com',
    phone: '+92-300-1234567',
    position: 'Senior Developer',
    department: 'Engineering',
    level: 'Senior',
    joinDate: '2025-01-01',
    birthday: '1990-01-01',
    yearsOfExperience: '5',
    salary: '75000',
    address: 'Lahore, Pakistan',
    emergencyContact: 'Jane Doe',
    emergencyPhone: '+92-301-1234567',
    cnic: 'ID123456',
    status: 'active',
    notes: 'Sample employee',
  },
  lead: {
    name: 'Sarah Johnson',
    company: 'TechCorp Solutions',
    email: 'sarah@techcorp.com',
    phone: '+92-300-1234567',
    source: 'LinkedIn',
    status: 'New',
    priority: 'High',
    estimated_value: '200000',
    currency: 'PKR',
    notes: 'Sample lead data',
  },
  invoice: {
    client_name: 'John Doe',
    company_name: 'Acme Inc',
    invoice_number: 'INV-2025-001',
    issue_date: '2025-01-01',
    due_date: '2025-02-01',
    service_type: 'Web Development',
    amount: '100000',
    currency: 'PKR',
    status: 'Draft',
    notes: 'Sample invoice',
  },
};
