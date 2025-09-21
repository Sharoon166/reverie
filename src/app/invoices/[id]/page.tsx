'use client';
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getInvoiceById, updateInvoice, deleteInvoice, markInvoicePaid } from "@/actions/invoices";
import type { InvoiceFormValues } from "@/components/forms/InvoiceForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Invoice, InvoiceStatus, ServiceType } from "@/types/invoice";
import { Currency } from "@/types/client";
import { ArrowLeft, Edit, Trash2, CheckCircle, Receipt, Calendar, DollarSign, User, Building, FileText, Download, Send } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import { SERVICE_TYPES, INVOICE_STATUS, CURRENCIES } from '@/lib/constants';
import Loading from "@/components/ui/loading";

// Mock invoice data

function getStatusColor(status: InvoiceStatus) {
  switch (status) {
    case "paid": return "bg-green-100 text-green-800";
    case "overdue": return "bg-red-100 text-red-800";
    case "draft": return "bg-gray-100 text-gray-800";
    case "sent": return "bg-blue-100 text-blue-800";
    case "cancelled": return "bg-gray-800 text-white";
    case "partially paid": return "bg-orange-100 text-orange-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getServiceTypeColor(serviceType: ServiceType) {
  switch (serviceType) {
    case "web development": return "bg-blue-100 text-blue-800";
    case "app development": return "bg-purple-100 text-purple-800";
    case "ai/ml solutions": return "bg-green-100 text-green-800";
    case "retainers": return "bg-yellow-100 text-yellow-800";
    case "consulting": return "bg-indigo-100 text-indigo-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Invoice>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showOutreachDialog, setShowOutreachDialog] = useState(false);
  const [outreachMessage, setOutreachMessage] = useState<string>("");

  // Fetch invoice data
  useEffect(() => {
    if (!invoiceId) return;

    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        const data = await getInvoiceById(invoiceId);
        setInvoice(data);
        setFormData(data);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Failed to load invoice');
        router.push('/invoices');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, router]);


  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceId) return;

    try {
      setIsLoading(true);

      // Map the form data to match InvoiceFormValues
      const formValues: InvoiceFormValues = {
        client_id: formData.clientId || '',
        client_name: formData.clientName || '',
        company_name: formData.companyName || '',
        invoice_number: formData.invoiceNumber || '',
        issue_date: formData.issueDate ? new Date(formData.issueDate.toString().split('T')[0] + 'T00:00:00') : new Date(new Date().toLocaleDateString()),
        due_date: formData.dueDate ? new Date(formData.dueDate.toString().split('T')[0] + 'T00:00:00') : new Date(new Date().toLocaleDateString()),
        service_type: (formData.serviceType as unknown as string)?.toLowerCase() === 'retainers' ? 'Retainers' :
          (formData.serviceType as unknown as string)?.toLowerCase() === 'app development' ? 'App Development' :
            (formData.serviceType as unknown as string)?.toLowerCase() === 'ai/ml solutions' ? 'AI/ML Solutions' :
              (formData.serviceType as unknown as string)?.toLowerCase() === 'consulting' ? 'Consulting' : 'Web Development',
        description: formData.description || '',
        amount: typeof formData.amount === 'number' ? formData.amount : 
          (typeof formData.amount === 'string' ? parseFloat(formData.amount) || 0 : 0), currency: (formData.currency as Currency) || 'USD',
        status: (formData.status as unknown as string)?.toLowerCase() === 'draft' ? 'Draft' :
          (formData.status as unknown as string)?.toLowerCase() === 'sent' ? 'Sent' :
            (formData.status as unknown as string)?.toLowerCase() === 'paid' ? 'Paid' :
              (formData.status as unknown as string)?.toLowerCase() === 'overdue' ? 'Overdue' :
                (formData.status as unknown as string)?.toLowerCase() === 'cancelled' ? 'Cancelled' : 'Draft',
        notes: formData.notes || ''
      };

      // Update the invoice using the server action
      const updatedInvoice = await updateInvoice(invoiceId, formValues);

      // Map the response to match the Invoice type
      const invoiceResponse: Invoice = {
        id: updatedInvoice.id || updatedInvoice.$id || '',
        clientId: updatedInvoice.clientId || '',
        clientName: updatedInvoice.clientName || '',
        companyName: updatedInvoice.companyName,
        invoiceNumber: updatedInvoice.invoiceNumber || '',
        issueDate: updatedInvoice.issueDate || '',
        dueDate: updatedInvoice.dueDate || '',
        serviceType: (updatedInvoice.serviceType?.toLowerCase() as ServiceType) || 'web development',
        description: updatedInvoice.description,
        amount: typeof updatedInvoice.amount === 'number' ? updatedInvoice.amount : 
          (typeof updatedInvoice.amount === 'string' ? parseFloat(updatedInvoice.amount) || 0 : 0),
        currency: (updatedInvoice.currency as Currency) || 'USD',
        status: (updatedInvoice.status?.toLowerCase() as InvoiceStatus) || 'draft',
        notes: updatedInvoice.notes,
        paidDate: updatedInvoice.paidDate,
        quarter: updatedInvoice.quarter || ''
      };

      // Create a new object without the $id property
      const {...invoiceWithoutId } = invoiceResponse;

      setInvoice(invoiceWithoutId);
      setFormData(invoiceWithoutId);
      setShowEditDialog(false);
      toast.success("Invoice updated successfully");
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error("Failed to update invoice. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!invoiceId) return;

    try {
      setIsLoading(true);

      // Delete the invoice using the server action
      await deleteInvoice(invoiceId);

      toast.success("Invoice deleted successfully");
      router.push("/invoices");
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error("Failed to delete invoice. Please try again.");
      setIsLoading(false);
    }
  }

  async function handleMarkPaid() {
    if (!invoiceId) return;

    try {
      setIsLoading(true);

      // Mark the invoice as paid using the server action
      const updatedInvoice = await markInvoicePaid(invoiceId);

      // Map the response to match the Invoice type
      const invoiceResponse: Invoice = {
        id: updatedInvoice.id || updatedInvoice.$id || '',
        clientId: updatedInvoice.clientId || '',
        clientName: updatedInvoice.clientName || '',
        companyName: updatedInvoice.companyName,
        invoiceNumber: updatedInvoice.invoiceNumber || '',
        issueDate: updatedInvoice.issueDate || '',
        dueDate: updatedInvoice.dueDate || '',
        serviceType: (updatedInvoice.serviceType?.toLowerCase() as ServiceType) || 'web development',
        description: updatedInvoice.description,
        amount: typeof updatedInvoice.amount === 'number' ? updatedInvoice.amount : 
          (typeof updatedInvoice.amount === 'string' ? parseFloat(updatedInvoice.amount) || 0 : 0),
        currency: (updatedInvoice.currency as Currency) || 'USD',
        status: 'paid' as InvoiceStatus,
        notes: updatedInvoice.notes,
        paidDate: updatedInvoice.paidDate || new Date().toISOString().split('T')[0],
        quarter: updatedInvoice.quarter || ''
      };

      setInvoice(invoiceResponse);
      setFormData(invoiceResponse);
      toast.success("Invoice marked as paid");
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error("Failed to update invoice status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleDownloadPDF() {
    if (!invoice) return;
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Header
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('INVOICE', 15, 20);
      doc.setFontSize(12);
      doc.text(`No: ${invoice.invoiceNumber}`, pageWidth - 15, 20, { align: 'right' });

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');

      // Bill To
      let y = 45;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To', 15, y);
      doc.setFont('helvetica', 'normal');
      y += 8;
      doc.text(`${invoice.clientName}`, 15, y); y += 6;
      if (invoice.companyName) { doc.text(`${invoice.companyName}`, 15, y); y += 6; }

      // Invoice Info
      y = 45;
      doc.setFont('helvetica', 'bold');
      doc.text('Invoice Info', pageWidth - 70, y);
      doc.setFont('helvetica', 'normal');
      y += 8;
      doc.text(`Issue: ${new Date(invoice.issueDate).toLocaleDateString()}`, pageWidth - 70, y);
      y += 6;
      doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, pageWidth - 70, y);
      if (invoice.paidDate) { y += 6; doc.text(`Paid: ${new Date(invoice.paidDate).toLocaleDateString()}`, pageWidth - 70, y); }

      // Line item
      y += 20;
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 15, y);
      doc.text('Amount (PKR)', pageWidth - 15, y, { align: 'right' });
      doc.setDrawColor(200); doc.line(15, y + 2, pageWidth - 15, y + 2);
      doc.setFont('helvetica', 'normal');
      y += 10;
      doc.text(invoice.description || invoice.serviceType, 15, y);
      doc.text(`${invoice.amount.toLocaleString()}`, pageWidth - 15, y, { align: 'right' });

      // Total
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Total', 15, y);
      doc.text(`${invoice.amount.toLocaleString()} ${invoice.currency}`, pageWidth - 15, y, { align: 'right' });

      // Footer
      y = doc.internal.pageSize.height - 15;
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text('Thank you for your business!', 15, y);

      doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
      toast.success('Invoice PDF exported');
    } catch {
      toast.error('Failed to export PDF');
    }
  }

  function handleSendInvoice() {
    if (!invoice) return;
    setOutreachMessage(`Hi ${invoice.clientName},\n\nPlease find invoice ${invoice.invoiceNumber} for ${invoice.serviceType}. Amount due: Rs. ${invoice.amount.toLocaleString()} by ${new Date(invoice.dueDate).toLocaleDateString()}.\n\nLet us know if you have any questions.\n\nBest regards,\nReverie`);
    setShowOutreachDialog(true);
  }

  if (!invoice) {
    return (
      <Loading />
    );
  }

  return (
    <div className="pt-16 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/invoices")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <div>
            <h1 className="text-3xl font-light">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-sm text-muted-foreground">{invoice.clientName} • {invoice.companyName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {invoice.status !== "paid" && (
            <Button variant="outline" onClick={handleMarkPaid} disabled={isLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowEditDialog(true)} disabled={isLoading}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        <Badge variant="outline" className={getStatusColor(invoice.status)}>
          {invoice.status}
        </Badge>
        <Badge variant="outline" className={getServiceTypeColor(invoice.serviceType)}>
          {invoice.serviceType}
        </Badge>
        {invoice.paidDate && (
          <Badge variant="outline" className="bg-green-100 text-green-800">
            Paid on {new Date(invoice.paidDate).toLocaleDateString()}
          </Badge>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Invoice Details */}
        <div className="col-span-8 space-y-6">
          {/* Client Information */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Client Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Client Name</p>
                  <p className="font-medium">{invoice.clientName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium">{invoice.companyName || 'Individual'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Service Details */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Service Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Service Type</p>
                <Badge variant="outline" className={getServiceTypeColor(invoice.serviceType)}>
                  {invoice.serviceType}
                </Badge>
              </div>
              {invoice.description && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Description</p>
                  <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {invoice.description}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Timeline</h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Issue Date</p>
                  <p className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Due Date</p>
                  <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
              {invoice.paidDate && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Paid Date</p>
                    <p className="font-medium text-green-600">{new Date(invoice.paidDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Notes</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">{invoice.notes}</p>
            </Card>
          )}
        </div>

        {/* Right Column - Amount & Actions */}
        <div className="col-span-4 space-y-6">
          {/* Invoice Amount */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Invoice Amount</h3>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">
                {invoice.amount} {invoice.currency}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Amount</p>
            </div>
          </Card>

          {/* Invoice Status */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Receipt className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Status</h3>
            </div>
            <div className="text-center">
              <Badge variant="outline" className={`${getStatusColor(invoice.status)} text-lg px-4 py-2`}>
                {invoice.status}
              </Badge>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={handleSendInvoice} disabled={isLoading}>
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleDownloadPDF} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              {invoice.status !== "paid" && (
                <Button variant="outline" className="w-full justify-start" onClick={handleMarkPaid} disabled={isLoading}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Paid
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Outreach Dialog */}
      <Dialog open={showOutreachDialog} onOpenChange={setShowOutreachDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Send Outreach Message</DialogTitle>
            <DialogDescription>
              Compose a personalized message to {invoice.clientName}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success('Outreach message sent');
              setShowOutreachDialog(false);
            }}
          >
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                className="w-full border rounded px-3 py-2 min-h-40"
                value={outreachMessage}
                onChange={(e) => setOutreachMessage(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowOutreachDialog(false)}>Cancel</Button>
              <Button type="submit" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">Send</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>Update the invoice information below.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSave}>
            <Input
              required
              placeholder="Invoice Number"
              value={formData.invoiceNumber ?? ""}
              onChange={e => setFormData(f => ({ ...f, invoiceNumber: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                required
                placeholder="Client Name"
                value={formData.clientName ?? ""}
                onChange={e => setFormData(f => ({ ...f, clientName: e.target.value }))}
              />
              <Input
                placeholder="Company Name"
                value={formData.companyName ?? ""}
                onChange={e => setFormData(f => ({ ...f, companyName: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                required
                type="date"
                placeholder="Issue Date"
                value={formData.issueDate ?? ""}
                onChange={e => setFormData(f => ({ ...f, issueDate: e.target.value }))}
              />
              <Input
                required
                type="date"
                placeholder="Due Date"
                value={formData.dueDate ?? ""}
                onChange={e => setFormData(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>

            <select
              required
              className="w-full border rounded px-3 py-2"
              value={formData.serviceType ?? ""}
              onChange={e => setFormData(f => ({ ...f, serviceType: e.target.value as ServiceType }))}
            >
              <option value="" disabled>Select Service Type</option>
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <textarea
              className="w-full border rounded px-3 py-2"
              placeholder="Service Description"
              rows={4}
              value={formData.description ?? ""}
              onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                required
                type="number"
                min={0}
                step="0.01"
                placeholder="Amount"
                value={formData.amount ?? ""}
                onChange={e => setFormData(f => ({ ...f, amount: Number(e.target.value) }))}
              />
              <select
                required
                className="border rounded px-3 py-2"
                value={formData.currency ?? ""}
                onChange={e => setFormData(f => ({ ...f, currency: e.target.value as Currency }))}
              >
                <option value="" disabled>Currency</option>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <select
              required
              className="w-full border rounded px-3 py-2"
              value={formData.status ?? ""}
              onChange={e => setFormData(f => ({ ...f, status: e.target.value as InvoiceStatus }))}
            >
              <option value="" disabled>Select Status</option>
              {INVOICE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <textarea
              className="w-full border rounded px-3 py-2"
              placeholder="Additional Notes"
              rows={3}
              value={formData.notes ?? ""}
              onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
            />

            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isLoading}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
