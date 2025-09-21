import type { Department, EmployeePosition } from "@/lib/constants";

export type EmployeeStatus = 'active' | 'inactive' | 'on-leave' | 'terminated';
export type EmployeeLevel =
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'manager'
  | 'director';

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late' | 'on-leave';
  checkIn?: string; // HH:MM
  checkOut?: string; // HH:MM
  notes?: string;
}

export interface BonusRecord {
  id: string;
  amount: number;
  reason: string;
  date: string; // ISO string
  approvedBy?: string;
}

export interface SalaryPayment {
  $id:string;
  id: string;
  month: string; // YYYY-MM
  amount: number;
  paidDate?: string; // ISO string
  status: 'pending' | 'paid' | 'overdue';
  bonusAmount?: number;
  deductions?: number;
  bonus:BonusRecord;
  netAmount: number;
}

export interface Employee {
  $id?: string;
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  position: EmployeePosition;
  department: Department;
  level: EmployeeLevel;
  joinDate: string; // ISO string
  birthday?: string; // YYYY-MM-DD
  yearsOfExperience: number; // YOE
  salary: number;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  cnic: string;
  status: EmployeeStatus;
  profileImage?: string;
  notes?: string;

  // Enhanced functionality fields
  attendanceRecords?: AttendanceRecord[];
  bonusRecords?: BonusRecord[];
  salaryPayments?: SalaryPayment[];
  employeeOfMonthCount?: number;
  lastSalaryUpdate?: string; // ISO string
}
