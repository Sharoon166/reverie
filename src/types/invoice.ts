// Invoice TypeScript types/interfaces

import { Currency } from "./client";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled" | "partially paid";
export type ServiceType = "web development" | "app development" | "ai/ml solutions" | "retainers" | "consulting";

export interface Invoice {

  id: string;
  clientId: string; // relation to Client.id
  clientName: string;
  companyName?: string;
  invoiceNumber: string;
  issueDate: string; // ISO string
  dueDate: string; // ISO string
  serviceType: ServiceType;
  description?: string;
  amount: number;
  currency: Currency;
  status: InvoiceStatus;
  notes?: string;
  paidDate?: string; // ISO string
  isRecurring?: boolean; // For retainers
  quarter: string; // e.g., "Q1-2025"
}
