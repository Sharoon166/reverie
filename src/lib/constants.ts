// Currency options
export const CURRENCIES = ['PKR'] as const;
export type Currency = (typeof CURRENCIES)[number];

// Employee-related constants
export const EMPLOYEE_POSITIONS = [
  'Junior Developer',
  'Senior Developer',
  'Team Lead',
  'Manager',
  'Director',
  'Designer',
  'Marketing Specialist',
  'Sales Representative',
  'HR Specialist',
  'Accountant',
] as const;
export type EmployeePosition = (typeof EMPLOYEE_POSITIONS)[number];

export const DEPARTMENTS = [
  'Development',
  'Design',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const EMPLOYEE_LEVELS = [
  'Junior',
  'Mid',
  'Senior',
  'Lead',
  'Principal',
  'Manager',
  'Director',
] as const;
export type EmployeeLevel = (typeof EMPLOYEE_LEVELS)[number];

export const EMPLOYEE_STATUS = [
  'active',
  'inactive',
  'on-leave',
  'terminated',
] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUS)[number];

// Lead-related constants
export const LEAD_SOURCES = [
  'Website',
  'LinkedIn',
  'Referral',
  'Cold Email',
  'Facebook',
  'Instagram',
  'Twitter',
  'Cold Call',
  'Event',
  'Partner',
  'Other',
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUS = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Meeting',
  'Negotiation',
  'Converted',
  'Lost',
  'Follow-Up',
  'Closed Won',
  'Closed Lost',
] as const;
export type LeadStatus = (typeof LEAD_STATUS)[number];

export const PRIORITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

// Client-related constants
export const CLIENT_SOURCES = [
  'Website',
  'LinkedIn',
  'Referral',
  'Cold Email',
  'Facebook',
] as const;
export type ClientSource = (typeof CLIENT_SOURCES)[number];

export const CLIENT_STATUS = ['Active', 'Inactive'] as const;
export type ClientStatus = (typeof CLIENT_STATUS)[number];

// Expense-related constants
export const EXPENSE_CATEGORIES = [
  'Office Supplies',
  'Marketing',
  'Travel',
  'Utilities',
  'Software',
  'Equipment',
  'Rent',
  'Food & Entertainment',
  'Professional Services',
  'Other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAYMENT_ACCOUNTS = [
  'Bank',
  'Cash',
  'Credit Card',
  'Digital Wallet',
] as const;
export type PaymentAccount = (typeof PAYMENT_ACCOUNTS)[number];

// Invoice-related constants
export const SERVICE_TYPES = [
  'Web Development',
  'App Development',
  'AI/ML Solutions',
  'Retainers',
  'Consulting',
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const INVOICE_STATUS = [
  'Draft',
  'Sent',
  'Paid',
  'Overdue',
  'Cancelled',
  'Partially Paid',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUS)[number];

// Attendance-related constants
export const ATTENDANCE_STATUS = [
  'present',
  'absent',
  'late',
  'on-leave',
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number];

// Payment-related constants
export const PAYMENT_STATUS = ['Paid', 'Pending', 'Processing'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];
