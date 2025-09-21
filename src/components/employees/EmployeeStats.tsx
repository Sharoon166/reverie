import { Card } from '@/components/ui/card';
import { Users, TrendingUp, Coins, Building } from 'lucide-react';
import { DEPARTMENTS } from '@/lib/constants';
import type { Employee } from '@/types/employee';
import { formatPakistaniCurrency } from '@/lib/utils';

interface EmployeeStatsProps {
  employees: Employee[];
}

export default function EmployeeStats({ employees }: EmployeeStatsProps) {
  const totalSalary = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const activeEmployees = employees.filter((e) => e.status === 'active').length;

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div>
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-400 rounded-xl">
              <Users className="h-6 w-6 text-gray-900" />
            </div>
            <div>
              <div className="text-base md:text-xl xl:text-2xl font-light text-gray-900">
                {employees.length}
              </div>
              <div className="text-sm text-gray-600">Total Employees</div>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-800 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-base md:text-xl xl:text-2xl font-light text-gray-900">
                {activeEmployees}
              </div>
              <div className="text-sm text-gray-600">Active Employees</div>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500 rounded-xl">
              <Coins className="h-6 w-6 text-gray-900" />
            </div>
            <div>
              <div className="text-base md:text-xl font-light text-gray-900">
                {formatPakistaniCurrency(totalSalary)}
              </div>
              <div className="text-sm text-gray-600">
                Total Salaries (Monthly)
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-700 rounded-xl">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-base md:text-xl xl:text-2xl font-light text-gray-900">
                {DEPARTMENTS.length}
              </div>
              <div className="text-sm text-gray-600">Departments</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}