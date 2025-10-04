import { Card } from '@/components/ui/card';
import { Users, TrendingUp, Coins, Building, Calendar } from 'lucide-react';
import { DEPARTMENTS } from '@/lib/constants';
import type { Employee } from '@/types/employee';
import { formatPakistaniCurrency } from '@/lib/utils';

interface EmployeeStatsProps {
  employees: Employee[];
}

export default function EmployeeStats({ employees }: EmployeeStatsProps) {
  const totalSalary = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const activeEmployees = employees.filter((e) => e.status === 'active').length;
  const quarterlySalary = totalSalary * 3; // Calculate quarterly salary (3 months)
  const averageSalary = employees.length > 0 ? Math.round(totalSalary / employees.length) : 0;

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Card className="p-6 border-0 shadow-sm h-full">
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
          <Card className="p-6 border-0 shadow-sm h-full">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-base md:text-xl font-light text-gray-900">
                  {formatPakistaniCurrency(quarterlySalary)}
                </div>
                <div className="text-sm text-gray-600">
                  Total Salaries (Quarterly)
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

        {/* Average Salary */}
        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Coins className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-light text-gray-900">
                {formatPakistaniCurrency(averageSalary)}
              </div>
              <div className="text-sm text-gray-600">
                Average Monthly Salary
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-xl font-light text-gray-900">
                {formatPakistaniCurrency(quarterlySalary)}
              </div>
              <div className="text-sm text-gray-600">
                Total Quarterly Salaries
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
