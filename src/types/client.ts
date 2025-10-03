// Client TypeScript types/interfaces aligned with UI usage (camelCase)
export type Currency = 'PKR';

// Match capitalized enums used across the UI and constants
export type ClientStatus = 'Active' | 'Inactive';
export type ClientSource =
  | 'Website'
  | 'LinkedIn'
  | 'Referral'
  | 'Cold Email'
  | 'Facebook';
export type ClientCategory = 'Client' | 'Agency Partner';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  startDate: string; // ISO string
  endDate?: string; // ISO string
  amount: number;
  currency: Currency;
  profitExpected: number;
  profitActual?: number;
  status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
  quarter: string;
  description?: string;
}

export interface Client {
  $id?: string;
  id: string;
  name: string;
  company?: string;
  contact: string;
  email?: string;
  phone?: string;
  source: ClientSource;
  category?: ClientCategory; // Client vs Agency Partner
  startDate: string; // ISO string
  numberOfProjects?: number;
  totalSpent?: number;
  totalSpentCurrency?: Currency;
  totalProfit?: number;
  totalProfitCurrency?: Currency;
  retainer?: number;
  notes?: string;
  status: ClientStatus;
  isHighValue?: boolean; // Automatically calculated based on projects > 1
  projects?: Project[]; // Associated projects
}
