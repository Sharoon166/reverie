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
  Coins,
} from 'lucide-react';
import type { QuarterlySummary } from '@/actions/reports';
import { toast } from 'sonner';
import { cn, formatPakistaniCurrency } from '@/lib/utils';
import { formatDate } from '@/lib/date-utils';

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>('');
  const [isClosing, setIsClosing] = useState(false);
  const [quarterToClose, setQuarterToClose] = useState<{ id: string, endDate: Date } | null>(null);

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
        icon: Coins,
        count: `${selectedQuarter.counts.paidInvoices} paid`,
      },
    ],
    [selectedQuarter]
  );

  const handleGenerateReport = async (quarterId: string) => {
    const generatePDFPromise = async () => {
      console.log('Generating report for quarter:', quarterId);

      // Import jsPDF
      const { jsPDF } = await import('jspdf');

      // Create a new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // Set document metadata
      doc.setProperties({
        title: `Quarterly Report - ${selectedQuarter.name}`,
        subject: 'Business Performance Report',
        author: 'Reverie Business Management System',
        creator: 'Synctom',
        keywords: 'quarterly, report, business, performance',
      });

      // Add company name in header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('Synctom', 20, 20);

      // Add report title
      doc.setFontSize(24);
      doc.setTextColor(30, 41, 59); // Slate-900
      doc.text(`Quarterly Report`, 20, 50);
      doc.setFontSize(18);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text(selectedQuarter.name, 20, 60);

      // Add report generation date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(
        `Generated on: ${new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        20,
        70
      );

      // Add financial summary section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59); // Slate-900
      doc.text('Financial Overview', 20, 90);

      // Add financial metrics cards
      const metrics = [
        {
          label: 'Total Revenue',
          value: formatPakistaniCurrency(selectedQuarter.totalRevenue),
          color: '#10B981', // Emerald-500
        },
        {
          label: 'Total Expenses',
          value: formatPakistaniCurrency(selectedQuarter.totalExpenses),
          color: '#EF4444', // Red-500
        },
        {
          label: 'Total Salaries',
          value: formatPakistaniCurrency(selectedQuarter.totalSalaries),
          color: '#3B82F6', // Blue-500
        },
        {
          label: 'Net Profit',
          value: formatPakistaniCurrency(Math.abs(selectedQuarter.netProfit)),
          color: selectedQuarter.netProfit >= 0 ? '#10B981' : '#EF4444',
        },
      ];

      // Draw metrics cards
      metrics.forEach((metric, index) => {
        const x = 20 + (index % 2) * 90;
        const y = 105 + Math.floor(index / 2) * 30;

        // Card background
        doc.setFillColor(249, 250, 251); // Gray-50
        doc.roundedRect(x, y, 85, 25, 5, 5, 'F');

        // Card border
        doc.setDrawColor(226, 232, 240); // Gray-200
        doc.roundedRect(x, y, 85, 25, 5, 5);

        // Metric value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(metric.color);
        doc.text(metric.value, x + 10, y + 10);

        // Metric label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text(metric.label, x + 10, y + 18);
      });

      // Add business statistics section
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59); // Slate-900
      doc.text('Business Statistics', 20, 180);

      // Add statistics in a clean table
      const stats = [
        {
          label: 'Total Clients',
          value: selectedQuarter.counts.clients.toLocaleString(),
        },
        {
          label: 'New Clients',
          value: selectedQuarter.counts.newClients.toLocaleString(),
        },
        {
          label: 'Total Leads',
          value: selectedQuarter.counts.leads.toLocaleString(),
        },
        {
          label: 'Converted Leads',
          value: `${selectedQuarter.counts.convertedLeads} (${selectedQuarter.counts.leads > 0 ? Math.round((selectedQuarter.counts.convertedLeads / selectedQuarter.counts.leads) * 100) : 0}%)`,
        },
        {
          label: 'Invoices Generated',
          value: selectedQuarter.counts.invoices.toLocaleString(),
        },
        {
          label: 'Paid Invoices',
          value: `${selectedQuarter.counts.paidInvoices} (${selectedQuarter.counts.invoices > 0 ? Math.round((selectedQuarter.counts.paidInvoices / selectedQuarter.counts.invoices) * 100) : 0}%)`,
        },
      ];

      // Draw statistics table
      stats.forEach((stat, index) => {
        const y = 195 + index * 10;
        const isEven = index % 2 === 0;

        // Row background
        if (isEven) {
          doc.setFillColor(248, 250, 252); // Slate-50
          doc.rect(20, y - 5, 170, 10, 'F');
        }

        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // Slate-600
        doc.text(stat.label, 25, y);

        // Value
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59); // Slate-900
        doc.text(stat.value.toString(), 150, y, { align: 'right' });
      });

      // Add footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text('Confidential - For internal use only', 105, 287, {
        align: 'center',
      });
      doc.text('Page 1 of 1', 200, 287, { align: 'right' });

      // Add company info in footer
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59); // Slate-900
      doc.text('Synctom Business Management System', 20, 287);

      // Save the PDF
      doc.save(`${selectedQuarter.name}-Report.pdf`);

      return `${selectedQuarter.name} report generated successfully`;
    };

    toast.promise(generatePDFPromise(), {
      loading: `Generating ${selectedQuarter.name} report...`,
      success: (message) => message,
      error: 'Failed to generate report. Please try again.',
    });
  };


  const handleCloseQuarter = (quarter: QuarterlySummary) => {
    setQuarterToClose({
      id: quarter.id,
      endDate: new Date(quarter.endDate)
    });
    setShowCloseDialog(true);
  };

  const handleShowConfirmation = () => {
    const cashOnHand =
      selectedQuarter.totalRevenue -
      selectedQuarter.totalExpenses -
      selectedQuarter.totalSalaries;

    const withdrawal = withdrawalAmount ? parseFloat(withdrawalAmount) : 0;

    if (withdrawal > cashOnHand) {
      toast.error('Withdrawal amount cannot exceed cash on hand!');
      return;
    }

    setShowCloseDialog(false);
    setShowConfirmDialog(true);
  };

  const getDaysRemaining = () => {
    if (!quarterToClose) return { days: 0, endDate: new Date() };
    const today = new Date();
    const endDate = new Date(quarterToClose.endDate);
    const days = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    return { days, endDate };
  };

  const confirmCloseQuarter = async () => {
    const quarterId = selectedQuarter.id;
    const withdrawal = withdrawalAmount ? parseFloat(withdrawalAmount) : 0;

    const closeQuarterPromise = async () => {
      setIsClosing(true);

      try {
        // Call server action to close quarter
        const { closeQuarter } = await import('@/actions/reports');
        const result = await closeQuarter(quarterId, withdrawal);

        if (!result.success) {
          throw new Error('Failed to close quarter');
        }

        setShowCloseDialog(false);

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

  const isCurrentQuarter = selectedQuarter.status == "active";

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
          Export PDF for {selectedQuarter.name}
        </Button>
      </div>

      {/* Selected Quarter Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              {/* Quarter Selection */}
              <div className="grid gap-4">
                {summaries.map((quarter) => (
                  <Card
                    key={quarter.id}
                    className={`cursor-pointer transition-all ${selectedQuarter.id === quarter.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:shadow-md'
                      }`}
                    onClick={() => setSelected(quarter)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {quarter.name}
                        </CardTitle>
                        <Badge className={getStatusColor(quarter.status)}>
                          {quarter.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {formatDate(quarter.startDate)} -{' '}
                        {formatDate(quarter.endDate)}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>

              {selectedQuarter.status === 'active' && (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleCloseQuarter(selectedQuarter)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Close Quarter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Coins className="w-5 h-5 mr-2" />
              Financial Summary - {selectedQuarter.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isCurrentQuarter ? <div className='text-muted-foreground'>This Quarter is not closed yet!</div> : <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-green-700 font-medium">
                  Total Revenue
                </span>
                <span className="text-green-800 font-bold text-lg">
                  {formatPakistaniCurrency(selectedQuarter.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-700 font-medium">Total Expenses</span>
                <span className="text-red-800 font-bold text-lg">
                  {formatPakistaniCurrency(selectedQuarter.totalExpenses)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-red-700 font-medium">Total Salaries</span>
                <span className="text-red-800 font-bold text-lg">
                  {formatPakistaniCurrency(selectedQuarter.totalSalaries)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-blue-700 font-medium">Net Profit</span>
                <span className="text-blue-800 font-bold text-lg">
                  {formatPakistaniCurrency(selectedQuarter.netProfit)}
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
            </div>}
          </CardContent>
        </Card>
      </div>

      {/* Report Sections Preview */}
      {!isCurrentQuarter && <Card>
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
      </Card>}

      {/* Close Quarter Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Close Quarter - {selectedQuarter.name}</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Closing the quarter will:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Lock all data for this quarter</li>
              <li>Generate a final report</li>
              <li>Allow you to withdraw cash from earnings</li>
            </ul>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Financial Summary
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Revenue:</span>
                  <span>{formatPakistaniCurrency(selectedQuarter.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Expenses:</span>
                  <span>{formatPakistaniCurrency(selectedQuarter.totalExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Salaries:</span>
                  <span>{formatPakistaniCurrency(selectedQuarter.totalSalaries)}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-1">
                  <span>Cash on Hand:</span>
                  <span className={cn("text-green-500", {
                    "text-destructive": (selectedQuarter.totalRevenue - selectedQuarter.totalExpenses - selectedQuarter.totalSalaries) < 0
                  })}>
                    {' '}
                    {formatPakistaniCurrency(
                      selectedQuarter.totalRevenue -
                      selectedQuarter.totalExpenses -
                      selectedQuarter.totalSalaries
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawal" className='font-semibold'>Withdrawal Amount</Label>
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
              onClick={handleShowConfirmation}
              disabled={isClosing}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Close Quarter</DialogTitle>
            <DialogDescription>
              Are you sure you want to close this quarter? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-700">
                    This will permanently lock all data for this quarter. Please ensure all transactions are recorded before proceeding.
                  </p>
                </div>
              </div>
            </div>

            {getDaysRemaining().days > 0 && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h.01a1 1 0 100-2H10V9a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      This quarter is scheduled to close on{' '}
                      <span className="font-semibold">
                        {getDaysRemaining().endDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </span>.
                      <br />
                      There are still <span className="font-semibold">{getDaysRemaining().days} days</span> remaining.
                      You can choose to close it early or wait until the scheduled end date.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmDialog(false);
                setShowCloseDialog(true);
              }}
              disabled={isClosing}
            >
              Back
            </Button>
            <Button
              onClick={confirmCloseQuarter}
              disabled={isClosing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClosing ? 'Closing...' : 'Confirm Close Quarter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
