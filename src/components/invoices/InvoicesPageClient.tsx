"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, DollarSign, Calendar as CalendarIcon, Building, Plus, Search, Filter, MoreVertical, Receipt, CheckCircle, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/Pagination";
import { InvoiceForm, type InvoiceFormValues } from '@/components/forms/InvoiceForm';
import { INVOICE_STATUS } from '@/lib/constants';
import type { InvoiceRow } from "@/actions/invoices";
import { createInvoice, deleteInvoice, getAllInvoices, markInvoicePaid, updateInvoice } from "@/actions/invoices";
import { useRouter } from "next/navigation";

export type ClientOption = { id: string; name: string; company?: string };

function getStatusColor(status: string) {
  switch (status) {
    case "Paid": return "bg-yellow-400 text-gray-900";
    case "Overdue": return "bg-gray-800 text-white";
    case "Draft": return "bg-gray-400 text-white";
    case "Sent": return "bg-yellow-500 text-gray-900";
    case "Cancelled": return "bg-gray-800 text-white";
    case "Partially Paid": return "bg-yellow-600 text-gray-900";
    default: return "bg-gray-400 text-white";
  }
}

function getServiceTypeColor(serviceType: string) {
  switch (serviceType) {
    case "Web Development": return "bg-yellow-400 text-gray-900";
    case "App Development": return "bg-gray-800 text-white";
    case "AI/ML Solutions": return "bg-yellow-500 text-gray-900";
    case "Retainers": return "bg-gray-700 text-white";
    case "Consulting": return "bg-yellow-600 text-gray-900";
    default: return "bg-gray-600 text-white";
  }
}

interface Props {
  initialInvoices: InvoiceRow[];
  clients: ClientOption[];
}

export default function InvoicesPageClient({ initialInvoices, clients }: Props) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRow[]>(initialInvoices);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterClient, setFilterClient] = useState<string>("");
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formData, setFormData] = useState<Partial<InvoiceRow>>({});
  const [isLoading, setIsLoading] = useState(false);

  const now = useMemo(() => new Date(), []);
  const getQuarter = useCallback((d: Date) => Math.floor(d.getMonth() / 3) + 1, []);
  const sameQuarter = useCallback((dateStr: string, ref: Date) => {
    const d = new Date(dateStr);
    return d.getFullYear() === ref.getFullYear() && getQuarter(d) === getQuarter(ref);
  }, [getQuarter]);
  function isOverdue(inv: InvoiceRow) {
    return inv.status !== 'Paid' && new Date(inv.dueDate) < new Date();
  }


  // Optionally refresh data from backend when returning to page
  useEffect(() => {
    (async () => {
      try {
        const fresh = await getAllInvoices();
        setInvoices(fresh);
      } catch {
        // ignore for now
      }
    })();
  }, []);

  const filteredInvoices = invoices.filter(inv =>
    (inv.clientName.toLowerCase().includes(search.toLowerCase()) ||
      (inv.companyName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || inv.status === filterStatus) &&
    (!filterClient || inv.clientId === filterClient)
  );

  const sortedFilteredInvoices = useMemo(() => {
    const arr = [...filteredInvoices];
    arr.sort((a, b) => {
      const rank = (inv: InvoiceRow) => (inv.status === 'Paid' ? 2 : (isOverdue(inv) ? 0 : 1));
      const rA = rank(a), rB = rank(b);
      if (rA !== rB) return rA - rB;
      const da = new Date(a.dueDate).getTime();
      const db = new Date(b.dueDate).getTime();
      return da - db;
    });
    return arr;
  }, [filteredInvoices]);

  const pagination = usePagination({ data: sortedFilteredInvoices, itemsPerPage: 12 });

  // KPIs
  const accountsReceivable = useMemo(() => invoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + inv.amount, 0), [invoices]);
  const overdueCount = useMemo(() => invoices.filter(inv => isOverdue(inv)).length, [invoices]);
  const totalInvoicesQuarter = useMemo(() => invoices.filter(inv => sameQuarter(inv.issueDate, now)).length, [invoices, now, sameQuarter]);
  const unpaidRetainers = useMemo(() => invoices.filter(inv => inv.serviceType === 'Retainers' && inv.status !== 'Paid').reduce((s, inv) => s + inv.amount, 0), [invoices]);

  function handleEdit(invoice: InvoiceRow) {
    setFormMode("edit");
    setFormData(invoice);
    setShowFormDialog(true);
  }

  async function handleDelete(invoiceId: string) {
    try {
      setIsLoading(true);
      await deleteInvoice(invoiceId);
      setInvoices(prev => prev.filter(inv => inv.$id !== invoiceId));
      toast.success(`Invoice deleted successfully`);
    } catch {
      toast.error("Failed to delete invoice. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMarkPaid(invoice: InvoiceRow) {
    try {
      setIsLoading(true);
      const updated = await markInvoicePaid(invoice.$id);
      setInvoices(prev => prev.map(inv => inv.$id === invoice.$id ? { ...inv, status: updated.status, paidDate: updated.paidDate } : inv));
      toast.success(`Invoice "${invoice.invoiceNumber}" marked as paid`);
    } catch {
      toast.error("Failed to update invoice status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFormSubmit(data: InvoiceFormValues) {
    try {
      setIsLoading(true);
      if (formMode === "create") {
        const created = await createInvoice(data);
        setInvoices(prev => [...prev, created]);
        toast.success(`Invoice "${created.invoiceNumber}" created successfully`);
      } else if (formData.$id) {
        const updated = await updateInvoice(formData.$id, data);
        setInvoices(prev => prev.map(inv => inv.$id === updated.$id ? updated : inv));
        toast.success(`Invoice "${updated.invoiceNumber}" updated successfully`);
      }
      setShowFormDialog(false);
      setFormData({});
    } catch {
      toast.error(`Failed to ${formMode === "create" ? "create" : "update"} invoice. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  }

  function handleInvoiceClick(invoice: InvoiceRow) {
    if (!invoice) {
      console.error('No invoice data provided');
      toast.error('Invalid invoice data');
      return;
    }

    // Try to get the ID in this order: $id, id, or fallback to invoiceNumber
    const invoiceId = invoice.$id || invoice.id || invoice.invoiceNumber;
    console.log('Invoice ID:', invoiceId);
    
    if (!invoiceId) {
      console.error('No valid identifier found in invoice object:', invoice);
      toast.error('Invalid invoice: Missing identifier');
      return;
    }
    
    console.log('Navigating to invoice:', invoiceId);
    try {
      router.push(`/invoices/${invoiceId}`);
    } catch (error) {
      console.error('Error navigating to invoice:', error);
      toast.error('Failed to navigate to invoice details');
    }
  }

  const exportInvoicePDF = (invoice: InvoiceRow) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      
      // Add header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('INVOICE', margin, 20);
      
      // Add invoice number and date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - margin, 20, { align: 'right' });
      doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, pageWidth - margin, 26, { align: 'right' });
      
      // Add client info
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', margin, 40);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.clientName, margin, 46);
      if (invoice.companyName) {
        doc.text(invoice.companyName, margin, 52);
      }
      // Use client's contact info if available in the future
      // if (invoice.clientEmail) {
      //   doc.text(invoice.clientEmail, margin, 58);
      // }
      
      // Add service details
      doc.setFont('helvetica', 'bold');
      doc.text('Service', margin, 80);
      doc.text('Amount', pageWidth - margin - 20, 80, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.line(margin, 85, pageWidth - margin, 85);
      
      // Add service row
      doc.text(invoice.serviceType || 'Service', margin, 95);
      doc.text(`${invoice.currency} ${invoice.amount.toFixed(2)}`, pageWidth - margin - 20, 95, { align: 'right' });
      
      // Add total
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', pageWidth - margin - 30, 115);
      doc.text(`${invoice.currency} ${invoice.amount.toFixed(2)}`, pageWidth - margin, 115, { align: 'right' });
      
      // Add status
      doc.setFillColor(invoice.status === 'Paid' ? '#fef9c3' : '#f3f4f6');
      doc.rect(margin, 130, 40, 10, 'F');
      doc.setFontSize(10);
      doc.text(`Status: ${invoice.status}`, margin + 2, 137);
      
      // Add due date if available
      if (invoice.dueDate) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, margin, 150);
      }
      
      // Save the PDF
      doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
      toast.success(`Invoice #${invoice.invoiceNumber} exported as PDF`);
    } catch (error) {
      console.error('Error exporting invoice to PDF:', error);
      toast.error('Failed to export invoice as PDF');
    }
  };

  return (
    <div className="pt-16 space-y-4">
      {/* Header Section */}
      <div className="space-y-1 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-light text-gray-900">Invoice Management</h2>
            <p className="text-sm text-gray-600">Create, track, and manage your invoices with ease</p>
          </div>
          <div className="flex items-center gap-3">

            <Button onClick={() => { setFormMode("create"); setFormData({}); setShowFormDialog(true); }} disabled={isLoading} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-12 gap-4 mb-8">
        <div className="col-span-3">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-400 rounded-xl">
                <Receipt className="h-6 w-6 text-gray-900" />
              </div>
              <div>
                <div className="text-3xl font-light text-gray-900">{totalInvoicesQuarter}</div>
                <div className="text-sm text-gray-600">Total Invoices (Current Quarter)</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-3">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500 rounded-xl">
                <DollarSign className="h-6 w-6 text-gray-900" />
              </div>
              <div>
                <div className="text-3xl font-light text-gray-900">Rs. {accountsReceivable.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Accounts Receivable</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-3">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-800 rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-light text-gray-900">Rs. {unpaidRetainers.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Unpaid Retainers</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-3">
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-700 rounded-xl">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="text-3xl font-light text-gray-900">{overdueCount}</div>
                <div className="text-sm text-gray-600">Overdue</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search invoices by number, client, or company..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="col-span-2">
          <select className="w-full border rounded px-3 py-2" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {INVOICE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <select className="w-full border rounded px-3 py-2" value={filterClient} onChange={e => setFilterClient(e.target.value)}>
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-span-2 flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" className="border-gray-300 hover:bg-yellow-50">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Badge className="bg-yellow-400 text-gray-900">
            {filteredInvoices.length} results
          </Badge>
        </div>
      </div>

      {/* Retainer Invoices */}
      <div className="space-y-3 mb-2">
        <h3 className="text-lg font-semibold">Retainer Invoices</h3>
      </div>
      <div className="grid grid-cols-12 gap-4">
        {pagination.paginatedData.filter(i => i.serviceType === 'Retainers').map((invoice) => (
          <div key={invoice.$id} className="col-span-4">
            <Card
              className={`p-6 hover:shadow-lg transition-shadow cursor-pointer ${isOverdue(invoice) ? 'border border-red-300 bg-red-50' : ''} ${invoice.status === 'Paid' ? 'opacity-60' : ''}`}
              onClick={() => handleInvoiceClick(invoice)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-gray-900 font-bold text-sm">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{invoice.invoiceNumber}</div>
                      <div className="text-sm text-gray-600">{invoice.clientName}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="h-4 w-4" />
                    <span>{invoice.companyName || 'No company'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{invoice.description || invoice.serviceType}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-xl font-semibold">{invoice.amount} {invoice.currency}</div>
                    <div className="text-xs text-gray-500">Amount</div>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className={getServiceTypeColor(invoice.serviceType)}>
                      {invoice.serviceType}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Issued: {new Date(invoice.issueDate).toLocaleDateString()}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                        disabled={isLoading}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); handleEdit(invoice); }}
                        disabled={isLoading}
                      >
                        Edit Invoice
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); exportInvoicePDF(invoice); }}
                        disabled={isLoading}
                      >
                        Export to PDF
                      </DropdownMenuItem>
                      {invoice.status !== 'Paid' && (
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleMarkPaid(invoice); }}
                          disabled={isLoading}
                        >
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); handleDelete(invoice.$id); }}
                        disabled={isLoading}
                      >
                        Delete Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Normal Invoices */}
      <div className="space-y-3 mt-8 mb-2">
        <h3 className="text-lg font-semibold">Normal Invoices</h3>
      </div>
      <div className="grid grid-cols-12 gap-4">
        {pagination.paginatedData.filter(i => i.serviceType !== 'Retainers').map((invoice) => (
          <div key={invoice.$id} className="col-span-4">
            <Card
              className={`p-6 hover:shadow-lg transition-shadow cursor-pointer ${isOverdue(invoice) ? 'border border-red-300 bg-red-50' : ''} ${invoice.status === 'Paid' ? 'opacity-60' : ''}`}
              onClick={() => handleInvoiceClick(invoice)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-gray-900 font-bold text-sm">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{invoice.invoiceNumber}</div>
                      <div className="text-sm text-gray-600">{invoice.clientName}</div>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="h-4 w-4" />
                    <span>{invoice.companyName || 'No company'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span>{invoice.description || invoice.serviceType}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-xl font-semibold">{invoice.amount} {invoice.currency}</div>
                    <div className="text-xs text-gray-500">Amount</div>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className={getServiceTypeColor(invoice.serviceType)}>
                      {invoice.serviceType}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Issued: {new Date(invoice.issueDate).toLocaleDateString()}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                        disabled={isLoading}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); handleEdit(invoice); }}
                        disabled={isLoading}
                      >
                        Edit Invoice
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); exportInvoicePDF(invoice); }}
                        disabled={isLoading}
                      >
                        Export to PDF
                      </DropdownMenuItem>
                      {invoice.status !== 'Paid' && (
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleMarkPaid(invoice); }}
                          disabled={isLoading}
                        >
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={(e) => { e.stopPropagation(); handleDelete(invoice.$id); }}
                        disabled={isLoading}
                      >
                        Delete Invoice
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-8">
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.goToPage}
          canGoPrev={pagination.canGoPrev}
          canGoNext={pagination.canGoNext}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          totalItems={pagination.totalItems}
        />
      </div>

      {/* Invoice Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "Add Invoice" : "Edit Invoice"}</DialogTitle>
            <DialogDescription>Fill in the invoice details below.</DialogDescription>
          </DialogHeader>
          {/* Map camelCase invoice row to the InvoiceForm's expected snake_case shape */}
          {(() => {
            type InvoiceFormInitial = {
              client_id?: string;
              client_name?: string;
              company_name?: string;
              invoice_number?: string;
              issue_date?: string; // ISO YYYY-MM-DD
              due_date?: string;   // ISO YYYY-MM-DD
              service_type?: string;
              description?: string;
              amount?: number;
              currency?: string;
              status?: string;
              notes?: string;
              paid_date?: string;
            } | undefined;

            const toFormInitial = (inv?: Partial<InvoiceRow>): InvoiceFormInitial => {
              if (!inv) return undefined;
              return {
                client_id: inv.clientId,
                client_name: inv.clientName,
                company_name: inv.companyName,
                invoice_number: inv.invoiceNumber,
                issue_date: inv.issueDate,
                due_date: inv.dueDate,
                service_type: inv.serviceType,
                description: inv.description,
                amount: inv.amount,
                currency: inv.currency,
                status: inv.status,
                notes: inv.notes,
                paid_date: inv.paidDate,
              };
            };

            const initialForForm = formMode === 'edit' ? toFormInitial(formData) : undefined;

            return (
              <InvoiceForm
                initialData={initialForForm}
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
                mode={formMode}
                clients={clients}
              />
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
