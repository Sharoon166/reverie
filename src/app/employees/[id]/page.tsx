import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
 
  User,
  Mail,
  Phone,
  Calendar,
  Coins,
  Building,
  FileText,
  MapPin,
  Shield,
  MessageCircle,
  AtSign,
  Siren,
  BriefcaseBusiness,
} from 'lucide-react';
import Image from 'next/image';
import { formatDate } from '@/lib/date-utils';
import {
  formatPakistaniCurrency,
  formatPakistaniPhoneNumber,
} from '@/lib/utils';
import { getImageUrl } from '@/lib/file-utils';
import { differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';
import AttendanceTimeline from '@/components/employees/AttendanceTimeline';
import SalaryHistory from '@/components/employees/SalaryHistory';
// import EmployeeActions from '@/components/employees/EmployeeActions';
import { getEmployeeFullProfile } from '@/actions';
import EmployeeActions from '@/components/employees/EmployeeActions';
import Link from 'next/link';

export default async function EmployeeDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id: cnic } = await params;

  const employee = await getEmployeeFullProfile(cnic);

  if (!employee) {
    notFound();
  }

  return (
    <div className="pt-16 space-y-8">
      {/* Header */}
      <div className="space-y-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="max-w-fit flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <Link href="/employees">
            <ArrowLeft className="h-4 w-4" />
            Back to Employees
          </Link>
        </Button>
        <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">

          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-yellow-50 flex items-center justify-center border-2 border-yellow-200">
                {employee.profileImage ? (
                  <Image
                    src={getImageUrl(employee.profileImage)}
                    alt={employee.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-800 font-semibold text-3xl">
                    {employee.name?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <div
                  className={`w-3 h-3 rounded-full ${employee.status === 'active' ? 'bg-gray-800' : 'bg-gray-400'}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-light text-gray-900">
                {employee.name}
              </h1>
              <div className="flex items-center gap-3">
                <span className="text-lg text-gray-600">
                  {employee.position ?? "N/A"}
                </span>
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                <span className="text-lg text-gray-600">
                  {employee.department}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-400 text-gray-900 hover:bg-yellow-500">
                  {employee.status}
                </Badge>
              </div>
            </div>
          </div>

          <EmployeeActions employee={employee} />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column - Contact & Personal Info */}
        <div className="col-span-12 lg:col-span-8 space-y-8 max-lg:order-1">
          {/* Contact Information */}
          <Card className="p-8 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-4 ">
              <div className="p-3 bg-yellow-400 rounded-xl">
                <User className="h-6 w-6 text-gray-900" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Contact Information
                </h3>
                <p className="text-sm text-gray-600">
                  Personal and professional details
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-yellow-100 transition-colors">
                      <AtSign className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Email
                    </span>
                  </div>
                  <p className="text-lg text-gray-900 ml-11">
                    {employee.email}
                  </p>
                </div>
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-yellow-100 transition-colors">
                      <Phone className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Phone
                    </span>
                  </div>
                  <p className="text-lg text-gray-900 ml-11">
                    {formatPakistaniPhoneNumber(employee.phone)}
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-yellow-100 transition-colors">
                      <MapPin className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Address
                    </span>
                  </div>
                  <p className="text-lg text-gray-900 ml-11 leading-relaxed">
                    {employee.address}
                  </p>
                </div>
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-yellow-100 transition-colors">
                      <Shield className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      ID Card
                    </span>
                  </div>
                  <p className="text-lg text-gray-900 ml-11">{employee.cnic}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Employment Details */}
          <Card className="p-8 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-4 ">
              <div className="p-3 bg-gray-800 rounded-xl">
                <BriefcaseBusiness className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Employment Details
              </h3>

            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-yellow-100 transition-colors">
                      <Calendar className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Join Date
                    </span>
                  </div>
                  <p className="text-lg text-gray-900 ml-11">
                    {formatDate(employee.joinDate)}
                  </p>
                </div>
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-yellow-100 transition-colors">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Position
                    </span>
                  </div>
                  <p className="text-lg text-gray-900 ml-11">
                    {employee.position}
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-yellow-100 transition-colors">
                      <Building className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Department
                    </span>
                  </div>
                  <div className="ml-11">
                    <Badge className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 text-base px-3 py-1">
                      {employee.department}
                    </Badge>
                  </div>
                </div>
                <div className="group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-yellow-100 transition-colors">
                      <Coins className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Salary
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 ml-11">
                    {formatPakistaniCurrency(employee.salary)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Emergency Contact */}
          <Card className="p-8 border-0 shadow-sm bg-yellow-50">
            <div className="flex items-center gap-4 ">
              <div className="p-3 bg-destructive rounded-xl">
                <Siren className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Emergency Contact
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white rounded-lg group-hover:bg-yellow-100 transition-colors">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Contact Person
                  </span>
                </div>
                <p className="text-lg text-gray-900 ml-11">
                  {employee.emergencyContact}
                </p>
              </div>
              <div className="group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white rounded-lg group-hover:bg-yellow-100 transition-colors">
                    <Phone className="h-4 w-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Phone Number
                  </span>
                </div>
                <p className="text-lg text-gray-900 ml-11">
                  {formatPakistaniPhoneNumber(employee.emergencyPhone)}
                </p>
              </div>
            </div>
          </Card>

          <AttendanceTimeline 
            attendanceRecords={employee.attendanceRecords} 
            employeeId={employee.$id || employee.id} 
          />

          {/* Salary History */}
          <SalaryHistory salaryPayments={employee.salaryPayments} />

          {/* Notes */}
          {employee.notes && (
            <Card className="p-8 border-0 shadow-sm bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-800 rounded-xl">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Notes</h3>

              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {employee.notes}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Quick Actions */}
          <Card className="p-6 border-0 shadow-sm bg-gray-900 text-white">
            <div className="flex items-center gap-3 ">
              <div className="p-2 bg-yellow-400 rounded-lg">
                <Shield className="h-5 w-5 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start bg-transparent border-gray-700 text-white hover:bg-yellow-400 hover:text-gray-900 hover:border-yellow-400"
              >
                <a href={`https://wa.me/:+${employee.phone}`}>
                  <MessageCircle className="h-4 w-4 mr-3" />
                  Chat on Whatsapp
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start bg-transparent border-gray-700 text-white hover:bg-yellow-400 hover:text-gray-900 hover:border-yellow-400"
              >
                <a
                  href={`mailto:${employee.email}?body=Hello ${employee.name},`}
                >
                  <Mail className="h-4 w-4 mr-3" />
                  Send Email
                </a>
              </Button>
            </div>
          </Card>

          {/* Employee Tenure */}
          <Card className="p-6 border-0 shadow-sm bg-white">
            <div className="flex items-center gap-3 ">
              <div className="p-2 bg-gray-800 rounded-lg">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Tenure</h3>
            </div>
            <div className="text-center py-4">
              {(() => {
                const start = new Date(employee.joinDate);
                const now = new Date();

                const years = differenceInYears(now, start);
                const months = differenceInMonths(now, start) % 12;
                const days =
                  differenceInDays(now, start) -
                  (years * 365 + months * 30); // Approx, but works visually

                return (
                  <>
                    <div className="text-2xl md:text-3xl font-semibold text-gray-900 mb-1">
                      {years > 0 && (
                        <span className="inline-block mr-2">
                          <span className="font-bold">{years}</span>y
                        </span>
                      )}
                      {months > 0 && (
                        <span className="inline-block mr-2">
                          <span className="font-bold">{months}</span>m
                        </span>
                      )}
                      {days >= 0 && (
                        <span className="inline-block">
                          <span className="font-bold">{days}</span>d
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 uppercase tracking-wide">
                      With Company
                    </p>
                  </>
                );
              })()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}