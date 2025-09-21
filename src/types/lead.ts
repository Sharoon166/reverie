// Lead TypeScript types/interfaces
import type { Currency } from './client';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal sent'
  | 'negotiation'
  | 'converted'
  | 'lost'
  | 'follow-up';

export type LeadSource =
  | 'website'
  | 'linkedin'
  | 'referral'
  | 'cold email'
  | 'facebook'
  | 'instagram'
  | 'twitter'
  | 'cold call'
  | 'event'
  | 'partner'
  | 'other';

export type LeadPriority = 'high' | 'medium' | 'low' | 'critical';

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'call' | 'email' | 'meeting' | 'proposal' | 'follow-up' | 'note';
  description: string;
  date: string; // ISO string
  createdBy: string;
  outcome?: string;
  nextAction?: string;
  nextActionDate?: string; // ISO string
}

export type Lead = {
  $id?: string;
  id: string;
  name: string;
  company?: string;
  contact?: string;
  email?: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  estimatedValue?: number;
  lastContact?: string;
  nextFollowup?: string;

  // Lead qualification
  budgetRange?: string;
  projectTimeline?: string;
  decisionMaker?: boolean;
  painPoints?: string[];

  // Tracking
  createdDate: string; // ISO string
  lastContactDate?: string; // ISO string
  nextFollowUpDate?: string; // ISO string
  assignedTo?: string; // Employee ID

  // Conversion tracking
  convertedToClientId?: string;
  conversionDate?: string; // ISO string
  lostReason?: string;

  // Project details
  estimatedProjectValue?: number;
  currency?: Currency;
  projectDescription?: string;

  // Activities and notes
  activities?: LeadActivity[];
  notes?: string;

  // Metadata
  createdBy: string;
  updatedAt: string; // ISO string
  quarter: string; // e.g., "Q1-2025"
};

export interface LeadPipeline {
  id: string;
  name: string;
  stages: LeadStatus[];
  leadsByStage: Record<LeadStatus, Lead[]>;
  totalValue: number;
  currency: Currency;
  conversionRate: number; // percentage
  averageDealSize: number;
  lastUpdated: string; // ISO string
}
