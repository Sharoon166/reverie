import { getAllEmployees } from '@/actions';
import { getDashboardStats } from '@/actions/dashboard';
import EmployeeStats from '@/components/employees/EmployeeStats';
import ExportButtons from '@/components/employees/ExportButtons';
import CashOnHand from '@/components/employees/CashOnHand';
import EmployeeTableWrapper from '@/components/employees/EmployeeTableWrapper';

export default async function EmployeesPage() {
  const employees = await getAllEmployees();

  // Get real cash on hand data from dashboard stats
  const dashboardStats = await getDashboardStats();
  const cashOnHand = dashboardStats.cashOnHand;

  return (
    <div className="pt-16 space-y-4">
      {/* Header Section */}
      <div className="space-y-1 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-4xl font-light text-gray-900">
              Employee Management
            </h2>
            <p className="text-sm max-lg:text-center text-gray-600">
              Manage your team and track employee information
            </p>
          </div>
          <ExportButtons />
        </div>
      </div>

      {/* Stats Grid */}
      <EmployeeStats employees={employees} />

      {/* Cash on Hand */}
      <CashOnHand amount={cashOnHand} />

      {/* Employees Table */}
      <EmployeeTableWrapper employees={employees} />
    </div>
  );
}
