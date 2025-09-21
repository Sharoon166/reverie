// components/expenses/ExpensesPageClient.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Expense } from '@/types/expense';
import {
  Download,
  DollarSign,
  Plus,
  Target,
  Receipt,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { ExpenseForm, type ExpenseFormValues } from '@/components/forms/ExpenseForm';
import { ExpenseTargetForm } from '@/components/forms/ExpenseTargetForm';
import ExpensesTable from './ExpensesTable';
import { getAllExpenses } from '@/actions/expenses';
import { createOrUpdateExpenseTarget, getExpenseTarget } from '@/actions/expenseTargets';

interface ExpensesPageClientProps {
  initialExpenses: Expense[];
  actions: {
    create: (data: ExpenseFormValues) => Promise<unknown>;
    update: (id: string, data: ExpenseFormValues) => Promise<unknown>;
    remove: (id: string) => Promise<void>;
  };
}

export default function ExpensesPageClient({ initialExpenses, actions }: ExpensesPageClientProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>(initialExpenses);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showTargetDialog, setShowTargetDialog] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Partial<Expense>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isQuarterClosed, setIsQuarterClosed] = useState(false);
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetInitial, setTargetInitial] = useState<{ targetAmount?: number; currency?: 'PKR' | 'USD'; month?: string }>();
  const [targetAmountDb, setTargetAmountDb] = useState<number>(0);
  const [targetCurrencyDb, setTargetCurrencyDb] = useState<'PKR' | 'USD'>('PKR');
  const now = new Date();
  
  function getQuarter(d: Date) { return Math.floor(d.getMonth() / 3) + 1; }
  
  const [selectedQuarter, setSelectedQuarter] = useState<number>(getQuarter(now));
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const selectedQuarterTag = `Q${selectedQuarter}-${selectedYear}`;

  const toTargetCurrency = (v: unknown): 'PKR' | 'USD' => (v === 'USD' ? 'USD' : 'PKR');

  // Load existing target for the selected quarter when opening the dialog
  const loadExpenseTarget = useCallback(async () => {
    try {
      setTargetLoading(true);
      const existing = await getExpenseTarget(selectedQuarter, selectedYear);
      const defaultMonth = `${selectedYear}-${String((selectedQuarter - 1) * 3 + 1).padStart(2, '0')}`;
      if (existing) {
        setTargetInitial({
          targetAmount: Number(existing.targetAmount) || undefined,
          currency: toTargetCurrency((existing as { currency?: unknown })?.currency),
          month: defaultMonth,
        });
        setTargetAmountDb(Number(existing.targetAmount) || 0);
        setTargetCurrencyDb(toTargetCurrency((existing as { currency?: unknown })?.currency));
      } else {
        setTargetInitial({ month: defaultMonth, currency: 'PKR' });
        setTargetAmountDb(0);
        setTargetCurrencyDb('PKR');
      }
    } catch {
      setTargetInitial({ month: `${selectedYear}-${String((selectedQuarter - 1) * 3 + 1).padStart(2, '0')}`, currency: 'PKR' });
    } finally {
      setTargetLoading(false);
    }
  }, [selectedQuarter, selectedYear]);

  // Load target when dialog opens or quarter/year changes
  useEffect(() => {
    if (showTargetDialog && !targetLoading) {
      loadExpenseTarget();
    }
  }, [showTargetDialog, targetLoading, loadExpenseTarget]);

  // Also load target for KPI when quarter/year changes (without opening dialog)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await getExpenseTarget(selectedQuarter, selectedYear);
        if (cancelled) return;
        if (existing) {
          setTargetAmountDb(Number(existing.targetAmount) || 0);
          setTargetCurrencyDb(toTargetCurrency((existing as { currency?: unknown })?.currency));
        } else {
          setTargetAmountDb(0);
          setTargetCurrencyDb('PKR');
        }
      } catch {
        if (!cancelled) {
          setTargetAmountDb(0);
          setTargetCurrencyDb('PKR');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [selectedQuarter, selectedYear]);

  // Check if current quarter is closed
  useEffect(() => {
    const checkQuarterStatus = async () => {
      try {
        const { isQuarterClosed: checkQuarterClosed } = await import('@/actions/reports');
        const isClosed = await checkQuarterClosed(selectedQuarter, selectedYear);
        setIsQuarterClosed(isClosed);
      } catch (error) {
        console.error('Error checking quarter status:', error);
        setIsQuarterClosed(false);
      }
    };

    checkQuarterStatus();
  }, [selectedQuarter, selectedYear]);

  // Filter expenses based on search term
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredExpenses(expenses);
      return;
    }
    
    const filtered = expenses.filter(expense => 
      expense.description?.toLowerCase().includes(term.toLowerCase()) ||
      expense.category?.toLowerCase().includes(term.toLowerCase()) ||
      expense.account?.toLowerCase().includes(term.toLowerCase()) ||
      expense.amount.toString().includes(term)
    );
    
    setFilteredExpenses(filtered);
  };

  // Filter expenses by selected quarter
  const quarterlyExpenses = filteredExpenses.filter((expense) =>
    expense.date && isDateInQuarter(expense.date, selectedQuarter, selectedYear)
  );

  function isDateInQuarter(dateStr: string, quarter: number, year: number) {
    const d = new Date(dateStr);
    return d.getFullYear() === year && getQuarter(d) === quarter;
  }

  // Calculate stats
  const totalExpenses = quarterlyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const targetAmount = targetAmountDb; // from backend
  const targetProgress = targetAmount > 0 ? (totalExpenses / targetAmount) * 100 : 0;

  async function handleTargetSubmit(data: { targetAmount: number; currency: 'PKR' | 'USD'; month: string }) {
    try {
      setTargetLoading(true);
      // Derive quarter/year from month
      const [yStr, mStr] = data.month.split('-');
      const y = Number(yStr);
      const m = Number(mStr);
      const q = (Math.floor((m - 1) / 3) + 1) as 1 | 2 | 3 | 4;
      await createOrUpdateExpenseTarget(q, y, Number(data.targetAmount), data.currency);
      toast.success('Expense target saved');
      setShowTargetDialog(false);
      setTargetInitial(undefined);
      // Update local state for immediate KPI refresh
      if (q === selectedQuarter && y === selectedYear) {
        setTargetAmountDb(Number(data.targetAmount) || 0);
        setTargetCurrencyDb(data.currency);
      }
    } catch {
      toast.error('Failed to save expense target');
    } finally {
      setTargetLoading(false);
    }
  }

  async function handleFormSubmit(data: ExpenseFormValues) {
    try {
      setIsLoading(true);
      if (formMode === 'create') {
        await actions.create({
          ...data,
          date: data.date,
          amount: Number(data.amount),
        });
        toast.success('Expense added successfully');
      } else {
        if (formData.id) {
          await actions.update(formData.id, {
            ...data,
            date: data.date,
            amount: Number(data.amount),
          });
          toast.success('Expense updated successfully');
        }
      }

      // Refresh expenses
      await fetchExpenses();
      setShowFormDialog(false);
      setFormData({});
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(expenseId: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      setIsLoading(true);
      await actions.remove(expenseId);
      toast.success('Expense deleted successfully');
      await fetchExpenses(); // Refresh the list
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchExpenses() {
    try {
      // This would typically call your API to refresh expenses
      // For now, we'll just simulate a refresh
      const res = await getAllExpenses();
      const rows = Array.isArray((res as unknown as { rows?: unknown })?.rows)
        ? ((res as unknown as { rows?: unknown[] }).rows as Record<string, unknown>[])
        : [];

      type Row = {
        [key: string]: unknown;
        id?: unknown;
        $id?: unknown;
        date?: unknown;
        description?: unknown;
        category?: unknown;
        account?: unknown;
        amount?: unknown;
        currency?: unknown;
        paidBy?: unknown;
        paid_by?: unknown;
        receiptUrl?: unknown;
        notes?: unknown;
        approvedBy?: unknown;
        status?: unknown;
        createdAt?: unknown;
        created_at?: unknown;
        updatedAt?: unknown;
        updated_at?: unknown;
      };

      const toCategory = (v: unknown): Expense['category'] => {
        const all: Expense['category'][] = [
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
        ];
        return all.includes(v as Expense['category']) ? (v as Expense['category']) : 'Other';
      };

      const toAccount = (v: unknown): Expense['account'] => {
        const all: Expense['account'][] = ['Bank', 'Cash', 'Credit Card', 'Digital Wallet'];
        return all.includes(v as Expense['account']) ? (v as Expense['account']) : 'Bank';
      };

      const toStatus = (v: unknown): Expense['status'] => {
        const all: Expense['status'][] = ['Pending', 'Approved', 'Rejected'];
        return all.includes(v as Expense['status']) ? (v as Expense['status']) : 'Pending';
      };

      const updatedExpenses: Expense[] = rows.map((r: Record<string, unknown>) => {
        const row = r as Row;
        const idRaw = row.id ?? row.$id;
        const createdRaw = row.createdAt ?? row.created_at;
        const updatedRaw = row.updatedAt ?? row.updated_at;
        const paidByRaw = row.paidBy ?? row.paid_by;

        return {
          id: String(idRaw ?? ''),
          date: typeof row.date === 'string' && row.date ? row.date : new Date().toISOString().split('T')[0],
          description: typeof row.description === 'string' ? row.description : '',
          category: toCategory(row.category),
          account: toAccount(row.account),
          amount: typeof row.amount === 'number' ? row.amount : Number(row.amount) || 0,
          currency: 'PKR',
          paidBy: typeof paidByRaw === 'string' ? paidByRaw : '',
          receiptUrl: typeof row.receiptUrl === 'string' ? row.receiptUrl : undefined,
          notes: typeof row.notes === 'string' ? row.notes : undefined,
          approvedBy: typeof row.approvedBy === 'string' ? row.approvedBy : undefined,
          status: toStatus(row.status),
          createdAt: typeof createdRaw === 'string' ? createdRaw : new Date().toISOString(),
          updatedAt: typeof updatedRaw === 'string' ? updatedRaw : new Date().toISOString(),
        } satisfies Expense;
      });
      
      setExpenses(updatedExpenses);
      setFilteredExpenses(updatedExpenses);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to load expenses');
    }
  }

  function handleEdit(expense: Expense) {
    setFormMode('edit');
    setFormData(expense);
    setShowFormDialog(true);
  }

  async function handleExportPDF() {
    try {
      setIsLoading(true);
      toast.loading('Generating expense report...', { id: 'pdf-export' });

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('REVERIE', 20, 25);

      doc.setFontSize(14);
      doc.text(`Expense Report - ${selectedQuarterTag}`, pageWidth - 20, 25, {
        align: 'right',
      });

      // Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Quarterly Summary', 20, 55);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Expenses: ${totalExpenses.toLocaleString()} PKR`, 20, 70);
      doc.text(`Target: ${targetAmount.toLocaleString()} PKR`, 20, 80);
      doc.text(`Progress: ${targetProgress.toFixed(1)}%`, 20, 90);

      // Expenses table
      let yPos = 110;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Expense Details', 20, yPos);

      yPos += 20;
      quarterlyExpenses.forEach((expense) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 30;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${expense.date}`, 20, yPos);
        doc.text(`${expense.description}`, 50, yPos);
        doc.text(`${expense.category}`, 120, yPos);
        doc.text(`${expense.amount} ${expense.currency}`, 160, yPos);

        yPos += 10;
      });

      doc.save(`expenses-${selectedQuarterTag}.pdf`);
      toast.success('PDF exported successfully', { id: 'pdf-export' });
    } catch {
      toast.error('Failed to export PDF', { id: 'pdf-export' });
    } finally {
      setIsLoading(false);
    }
  }



  return (
    <div className="pt-16 space-y-4">
      {/* Quarter Closed Warning */}
      {isQuarterClosed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div>
              <h3 className="text-red-800 font-medium">Quarter Q{selectedQuarter}-{selectedYear} is Closed</h3>
              <p className="text-red-600 text-sm">
                This quarter has been closed and locked. You cannot add, edit, or delete expenses for this period.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-light text-gray-900">
            Expense Management
          </h2>
          <p className="text-sm text-gray-600">
            Track and manage monthly expenses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTargetDialog(true)}
            disabled={isQuarterClosed}
            className="border-gray-300 hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Target className="h-4 w-4 mr-2" />
            Set Target
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={isLoading}
            className="border-gray-300 hover:bg-yellow-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>

          <Button
            onClick={() => {
              setFormMode('create');
              setFormData({
                date: new Date().toISOString().split('T')[0],
                currency: 'PKR',
                account: 'Bank',
                category: 'Other',
              });
              setShowFormDialog(true);
            }}
            disabled={isQuarterClosed}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

    {/* Search and Filters */}
    <div className="flex items-center gap-4 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input placeholder="Search expenses..." className="pl-10" value={searchTerm} onChange={(e) => handleSearch(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <select className="border rounded px-3 py-2" value={selectedQuarter} onChange={(e) => setSelectedQuarter(Number(e.target.value))}>
          <option value={1}>Q1</option>
          <option value={2}>Q2</option>
          <option value={3}>Q3</option>
          <option value={4}>Q4</option>
        </select>
        <Input type="number" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value) || now.getFullYear())} className="w-24" />
      </div>
      <Button variant="outline" onClick={fetchExpenses} disabled={isLoading} className="border-gray-300">
        <RefreshCw className="h-4 w-4 mr-2" />
        Refresh
      </Button>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-400 rounded-xl">
            <DollarSign className="h-6 w-6 text-gray-900" />
          </div>
          <div>
            <div className="text-3xl font-light text-gray-900">{totalExpenses.toLocaleString()} PKR</div>
            <div className="text-sm text-gray-600">Total Spent in {selectedQuarterTag}</div>
          </div>
        </div>
      </Card>
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-800 rounded-xl">
            <Target className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-3xl font-light text-gray-900">{targetProgress.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Target Progress</div>
          </div>
        </div>
      </Card>
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-500 rounded-xl">
            <Receipt className="h-6 w-6 text-gray-900" />
          </div>
          <div>
            <div className="text-3xl font-light text-gray-900">{quarterlyExpenses.length}</div>
            <div className="text-sm text-gray-600">Total Expenses Records</div>
          </div>
        </div>
      </Card>
    </div>

    {/* Expenses Table */}
    <ExpensesTable data={quarterlyExpenses} onEdit={handleEdit} onDelete={handleDelete} isLoading={isLoading} isQuarterClosed={isQuarterClosed} />

    {/* Add/Edit Expense Dialog */}
    <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{formMode === 'create' ? 'Add New Expense' : 'Edit Expense'}</DialogTitle>
          <DialogDescription>{formMode === 'create' ? 'Add a new expense to track your spending' : 'Update the expense details'}</DialogDescription>
        </DialogHeader>
        <ExpenseForm initialData={formMode === 'edit' ? formData : undefined} onSubmit={handleFormSubmit} isLoading={isLoading} mode={formMode} />
      </DialogContent>
    </Dialog>

    {/* Set Target Dialog */}
    <Dialog open={showTargetDialog} onOpenChange={(v) => { setShowTargetDialog(v); if (!v) setTargetInitial(undefined); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set Expense Target for {selectedQuarterTag}</DialogTitle>
          <DialogDescription>Define your monthly cap for this quarter.</DialogDescription>
        </DialogHeader>
        <ExpenseTargetForm
          initialData={targetInitial}
          previousTarget={{ amount: targetAmountDb, currency: targetCurrencyDb }}
          onSubmit={handleTargetSubmit}
          isLoading={targetLoading}
        />
      </DialogContent>
    </Dialog>
  </div>

)}