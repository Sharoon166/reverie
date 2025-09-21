'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Download,
  FileText,
  TrendingUp,
  Users,
  DollarSign,
} from 'lucide-react';
import type { QuarterlySummary } from '@/actions/reports';
import { toast } from 'sonner';

interface Props {
  summaries: QuarterlySummary[];
}

export default function ReportsClient({ summaries }: Props) {
  const activeIndex = Math.max(
    0,
    summaries.findIndex((s) => s.status === 'active')
  );
  const [selected, setSelected] = useState<QuarterlySummary>(
    summaries[activeIndex] ?? summaries[0]
  );
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [isClosing, setIsClosing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedQuarter = selected;

  const sections = useMemo(
    () => [
      {
        title: 'Clients Summary',
        icon: Users,
        count: `${selectedQuarter.counts.clients} clients`,
      },
      {
        title: 'Leads Summary',
        icon: TrendingUp,
        count: `${selectedQuarter.counts.leads} leads`,
      },
      {
        title: 'Invoices',
        icon: FileText,
        count: `${selectedQuarter.counts.invoices} invoices`,
      },
      {
        title: 'Paid Invoices',
        icon: DollarSign,
        count: `${selectedQuarter.counts.paidInvoices} paid`,
      },
    ],
    [selectedQuarter]
  );

  const handleGenerateReport = async (quarterId: string) => {
    const generatePDFPromise = async () => {
      console.log('Generating report for quarter:', quarterId);

      // Call the server action to generate PDF
      const response = await fetch('/api/reports/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quarterId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      // Get the PDF blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${selectedQuarter.name}-Report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return `${selectedQuarter.name} report generated successfully`;
    };

    toast.promise(generatePDFPromise(), {
      loading: `Generating ${selectedQuarter.name} report...`,
      success: (message) => message,
      error: 'Failed to generate report. Please try again.',
    });
  };

  const handleCloseQuarter = async (quarterId: string) => {
    console.log('Closing quarter:', quarterId);
    // Show the close quarter dialog
    setShowCloseDialog(true);
    setWithdrawalAmount('');
  };

  const confirmCloseQuarter = async () => {
    const quarterId = selectedQuarter.id;

    const closeQuarterPromise = async () => {
      setIsClosing(true);

      try {
        const cashOnHand =
          selectedQuarter.totalRevenue -
          selectedQuarter.totalExpenses -
          selectedQuarter.totalSalaries;

        const withdrawal = withdrawalAmount ? parseFloat(withdrawalAmount) : 0;

        if (withdrawal > cashOnHand) {
          throw new Error('Withdrawal amount cannot exceed cash on hand!');
        }

        // Call server action to close quarter
        const { closeQuarter } = await import('@/actions/reports');
        const result = await closeQuarter(quarterId, withdrawal);
        
        if (!result.success) {
          throw new Error('Failed to close quarter');
        }

        setShowCloseDialog(false);

        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);

        return `Quarter ${selectedQuarter.name} has been closed successfully!`;
      } finally {
        setIsClosing(false);
      }
    };

    toast.promise(closeQuarterPromise(), {
      loading: `Closing ${selectedQuarter.name}...`,
      success: (message) => message,
      error: (error) =>
        error.message || 'Failed to close quarter. Please try again.',
    });
  };

  const handleExportData = async (quarterId: string) => {
    const exportDataPromise = async () => {
      console.log('Exporting data for quarter:', quarterId);

      const response = await fetch('/api/reports/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quarterId }),
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${selectedQuarter.name}-Data-Export.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return `${selectedQuarter.name} data exported successfully`;
    };

    toast.promise(exportDataPromise(), {
      loading: `Exporting ${selectedQuarter.name} data...`,
      success: (message) => message,
      error: 'Failed to export data. Please try again.',
    });
  };

  return (
    <div className="pt-16 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Quarters
          </h1>
          <p className="text-gray-600 mt-2">
            Manage quarterly reports and financial summaries
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => handleGenerateReport(selectedQuarter.id)}
          className="border-gray-300 hover:bg-yellow-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
      </div>

      {/* Quarter Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaries.map((quarter) => (
          <Card
            key={quarter.id}
            className={`cursor-pointer transition-all ${
              selectedQuarter.id === quarter.id
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelected(quarter)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{quarter.name}</CardTitle>
                <Badge className={getStatusColor(quarter.status)}>
                  {quarter.status}
                </Badge>
              </div>
              <CardDescription>
                {new Date(quarter.startDate).toLocaleDateString()} -{' '}
                {new Date(quarter.endDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Revenue:</span>
                  <span className="font-medium">
                    PKR {quarter.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expenses:</span>
                  <span className="font-medium">
                    PKR {quarter.totalExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Salaries:</span>
                  <span className="font-medium">
                    PKR {quarter.totalSalaries.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Profit:</span>
                  <span className="font-medium text-green-600">
                    PKR {quarter.netProfit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Margin:</span>
                  <span className="font-medium">{quarter.profitMargin}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Quarter Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Financial Summary - {selectedQuarter.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-700 font-medium">
                  Total Revenue
                </span>
                <span className="text-green-800 font-bold text-lg">
                  PKR {selectedQuarter.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-700 font-medium">Total Expenses</span>
                <span className="text-red-800 font-bold text-lg">
                  PKR {selectedQuarter.totalExpenses.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-700 font-medium">Total Salaries</span>
                <span className="text-red-800 font-bold text-lg">
                  PKR {selectedQuarter.totalSalaries.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700 font-medium">Net Profit</span>
                <span className="text-blue-800 font-bold text-lg">
                  PKR {selectedQuarter.netProfit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-700 font-medium">
                  Profit Margin
                </span>
                <span className="text-purple-800 font-bold text-lg">
                  {selectedQuarter.profitMargin}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quarter Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Quarter Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleGenerateReport(selectedQuarter.id)}
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate PDF Report
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleExportData(selectedQuarter.id)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>

              {selectedQuarter.status === 'active' && (
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => handleCloseQuarter(selectedQuarter.id)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Close Quarter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Sections Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Report Sections - {selectedQuarter.name}</CardTitle>
          <CardDescription>
            Preview of what will be included in the quarterly report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <section.icon className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {section.title}
                    </h4>
                    <p className="text-sm text-gray-600">{section.count}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Close Quarter Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close Quarter - {selectedQuarter.name}</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Closing the quarter will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Lock all data for this quarter</li>
                <li>Generate a final report</li>
                <li>Allow you to withdraw cash from earnings</li>
              </ul>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">
                Financial Summary
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Revenue:</span>
                  <span>
                    PKR {selectedQuarter.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Expenses:</span>
                  <span>
                    PKR {selectedQuarter.totalExpenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Salaries:</span>
                  <span>
                    PKR {selectedQuarter.totalSalaries.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Cash on Hand:</span>
                  <span className="text-green-600">
                    PKR{' '}
                    {(
                      selectedQuarter.totalRevenue -
                      selectedQuarter.totalExpenses -
                      selectedQuarter.totalSalaries
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawal">Withdrawal Amount (Optional)</Label>
              <Input
                id="withdrawal"
                type="number"
                placeholder="0"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                max={
                  selectedQuarter.totalRevenue -
                  selectedQuarter.totalExpenses -
                  selectedQuarter.totalSalaries
                }
              />
              <p className="text-xs text-gray-500">
                Maximum: PKR{' '}
                {(
                  selectedQuarter.totalRevenue -
                  selectedQuarter.totalExpenses -
                  selectedQuarter.totalSalaries
                ).toLocaleString()}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCloseDialog(false)}
              disabled={isClosing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmCloseQuarter}
              disabled={isClosing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClosing ? 'Closing...' : 'Close Quarter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
