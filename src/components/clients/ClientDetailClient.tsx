"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Client, ClientStatus, ClientSource, Currency } from "@/types/client";
import { toast } from "sonner";
import { ArrowLeft, Download, CreditCard, Edit, Trash2, User, Mail, Phone, Calendar, DollarSign, Building, FileText, Target, TrendingUp } from "lucide-react";
import jsPDF from "jspdf";
import { CLIENT_SOURCES, CLIENT_STATUS, CURRENCIES } from '@/lib/constants';

export type ClientDetailClientProps = {
  initialClient: Client;
  actions: {
    update: (id: string, formData: FormData) => Promise<Client>;
    remove: (id: string) => Promise<void>;
  }
};

function getSourceColor(source: ClientSource) {
  switch (source) {
    case "Website": return "bg-blue-100 text-blue-800";
    case "LinkedIn": return "bg-sky-100 text-sky-800";
    case "Referral": return "bg-purple-100 text-purple-800";
    case "Cold Email": return "bg-yellow-100 text-yellow-800";
    case "Facebook": return "bg-indigo-100 text-indigo-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

function getStatusColor(status: ClientStatus) {
  switch (status) {
    case "Active": return "bg-green-100 text-green-800";
    case "Inactive": return "bg-gray-100 text-gray-800";
    default: return "bg-gray-100 text-gray-800";
  }
}

export default function ClientDetailClient({ initialClient, actions }: ClientDetailClientProps) {
  const router = useRouter();
  const [client, setClient] = useState<Client>(initialClient);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [isPending, startTransition] = useTransition();
  const isLoading = isPending;

  useEffect(() => {
    setFormData(initialClient);
  }, [initialClient]);

  function toFormData(data: Partial<Client>) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });
    return fd;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const id = String(client.id);
        const updatedRaw = await actions.update(id, toFormData(formData));
        const updated = { ...(updatedRaw as Client), id: String((updatedRaw as Client)?.id ?? (updatedRaw as Client)?.$id ?? id) } as Client;
        setClient(updated);
        setFormData(updated);
        setShowEditDialog(false);
        toast.success("Client updated successfully");
      } catch (err) {
        console.error(err);
        toast.error("Failed to update client. Please try again.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        const id = String(client.id);
        await actions.remove(id);
        toast.success("Client deleted successfully");
        router.push("/clients");
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete client. Please try again.");
      }
    });
  }

  async function handleExportCard() {
    try {
      toast.loading(`Generating client card for ${client.name}...`, { id: "client-card-download" });
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      doc.setFillColor(59, 130, 246);
      doc.rect(20, 30, pageWidth - 40, 120, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text("REVERIE", 30, 50);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(client.name, 30, 70);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(client.company || "Individual Client", 30, 80);
      doc.setFontSize(10);
      doc.text(`Client ID: ${client.id}`, 30, 90);
      doc.text(`Since: ${new Date(client.startDate).toLocaleDateString()}`, 30, 100);
      doc.text(`Status: ${client.status}`, 30, 110);
      doc.text(`Projects: ${client.numberOfProjects || 0}`, 30, 120);
      doc.text(`Revenue: ${client.totalSpent} ${client.totalSpentCurrency}`, 30, 130);
      doc.setFillColor(248, 250, 252);
      doc.rect(20, 170, pageWidth - 40, 80, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Contact Information", 30, 185);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Email: ${client.email || 'N/A'}`, 30, 195);
      doc.text(`Phone: ${client.phone || 'N/A'}`, 30, 205);
      doc.text(`Contact: ${client.contact}`, 30, 215);
      doc.text(`Source: ${client.source}`, 30, 225);
      if (client.notes) {
        const splitNotes = doc.splitTextToSize(`Notes: ${client.notes}`, pageWidth - 60);
        doc.text(splitNotes, 30, 235);
      }
      const fileName = `client-card-${client.name.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      doc.save(fileName);
      toast.success(`Client card for ${client.name} downloaded successfully`, { id: "client-card-download" });
    } catch (error) {
      console.error("Card generation error:", error);
      toast.error("Failed to generate client card. Please try again.", { id: "client-card-download" });
    }
  }

  async function handleDownloadPDF() {
    try {
      toast.loading(`Generating PDF for ${client.name}...`, { id: "client-pdf-download" });
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text("REVERIE", 20, 25);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text("Client Profile Report", pageWidth - 20, 25, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(client.name, 20, 55);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 65);
      const statusColor: [number, number, number] = client.status === 'Active' ? [34, 197, 94] : [107, 114, 128];
      doc.setFillColor(...statusColor);
      doc.roundedRect(pageWidth - 60, 50, 40, 12, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(client.status, pageWidth - 40, 58, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      let yPos = 85;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos - 5, pageWidth - 30, 70, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("Contact Information", 20, yPos + 5);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setFont('helvetica', 'bold');
      doc.text("Full Name:", 20, yPos + 20);
      doc.text("Company:", 20, yPos + 30);
      doc.text("Email:", 20, yPos + 40);
      doc.text("Phone:", 20, yPos + 50);
      doc.setFont('helvetica', 'normal');
      doc.text(client.name, 50, yPos + 20);
      doc.text(client.company || 'N/A', 50, yPos + 30);
      doc.text(client.email || 'N/A', 50, yPos + 40);
      doc.text(client.phone || 'N/A', 50, yPos + 50);
      doc.setFont('helvetica', 'bold');
      doc.text("Contact Person:", 110, yPos + 20);
      doc.text("Source:", 110, yPos + 30);
      doc.text("Start Date:", 110, yPos + 40);
      doc.text("Projects:", 110, yPos + 50);
      doc.setFont('helvetica', 'normal');
      doc.text(client.contact, 150, yPos + 20);
      doc.text(client.source, 150, yPos + 30);
      doc.text(new Date(client.startDate).toLocaleDateString(), 150, yPos + 40);
      doc.text((client.numberOfProjects || 0).toString(), 150, yPos + 50);
      yPos = 170;
      doc.setFillColor(254, 249, 195);
      doc.rect(15, yPos - 5, pageWidth - 30, 50, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text("Financial Summary", 20, yPos + 5);
      const cardWidth = 50; const cardHeight = 25; const cardSpacing = 10;
      doc.setFillColor(255, 255, 255);
      doc.rect(20, yPos + 15, cardWidth, cardHeight, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(20, yPos + 15, cardWidth, cardHeight);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text("TOTAL SPENT", 22, yPos + 22);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${client.totalSpent || 0} ${client.totalSpentCurrency}`, 22, yPos + 32);
      doc.setFillColor(255, 255, 255);
      doc.rect(20 + cardWidth + cardSpacing, yPos + 15, cardWidth, cardHeight, 'F');
      doc.rect(20 + cardWidth + cardSpacing, yPos + 15, cardWidth, cardHeight);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text("TOTAL PROFIT", 22 + cardWidth + cardSpacing, yPos + 22);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${client.totalProfit || 0} ${client.totalProfitCurrency}`, 22 + cardWidth + cardSpacing, yPos + 32);
      doc.setFillColor(255, 255, 255);
      doc.rect(20 + (cardWidth + cardSpacing) * 2, yPos + 15, cardWidth, cardHeight, 'F');
      doc.rect(20 + (cardWidth + cardSpacing) * 2, yPos + 15, cardWidth, cardHeight);
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text("RETAINER", 22 + (cardWidth + cardSpacing) * 2, yPos + 22);
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${client.retainer || 0}`, 22 + (cardWidth + cardSpacing) * 2, yPos + 32);
      if (client.notes) {
        yPos = 235;
        doc.setFillColor(248, 250, 252);
        doc.rect(15, yPos - 5, pageWidth - 30, 40, 'F');
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text("Notes", 20, yPos + 5);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const splitNotes = doc.splitTextToSize(client.notes, pageWidth - 50);
        doc.text(splitNotes, 20, yPos + 18);
      }
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text("Confidential - Reverie CRM System", 20, footerY);
      doc.text(`Client ID: ${client.id}`, pageWidth - 20, footerY, { align: 'right' });
      const fileName = `client-${client.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success(`Client report for ${client.name} downloaded successfully`, { id: "client-pdf-download" });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate client PDF. Please try again.", { id: "client-pdf-download" });
    }
  }

  return (
    <div className="pt-16 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/clients")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-light">{client.name}</h1>
              <p className="text-sm text-muted-foreground">{client.company || 'Individual Client'}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCard} disabled={isLoading}>
            <CreditCard className="h-4 w-4 mr-2" />
            Export Card
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
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

      <div className="flex items-center gap-4">
        <Badge variant="outline" className={getStatusColor(client.status)}>
          {client.status}
        </Badge>
        <Badge variant="outline" className={getSourceColor(client.source)}>
          {client.source}
        </Badge>
        <Badge variant="outline" className="bg-gray-100 text-gray-800">
          Since {new Date(client.startDate).toLocaleDateString()}
        </Badge>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Contact Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{client.email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{client.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-medium">{client.company || 'Individual'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Contact Person</p>
                    <p className="font-medium">{client.contact}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Business Relationship</h3>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="font-medium">{new Date(client.startDate).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Target className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Source</p>
                  <Badge variant="outline" className={getSourceColor(client.source)}>
                    {client.source}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Projects</p>
                  <p className="font-medium">{client.numberOfProjects || 0} completed</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Financial Overview</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-600 font-medium">Total Spent</p>
                </div>
                <p className="text-2xl font-bold text-blue-700">
                  {client.totalSpent || 0} {client.totalSpentCurrency}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-600 font-medium">Total Profit</p>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {client.totalProfit || 0} {client.totalProfitCurrency}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <p className="text-sm text-purple-600 font-medium">Monthly Retainer</p>
                </div>
                <p className="text-2xl font-bold text-purple-700">{client.retainer || 0}</p>
              </div>
            </div>
          </Card>

          {client.notes && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold">Notes</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">{client.notes}</p>
            </Card>
          )}
        </div>

        <div className="col-span-4 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Status</h3>
            </div>
            <div className="text-center">
              <Badge variant="outline" className={`${getStatusColor(client.status)} text-lg px-4 py-2`}>
                {client.status}
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Revenue</h3>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {client.totalSpent || 0} {client.totalSpentCurrency}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Revenue</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Projects</h3>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {client.numberOfProjects || 0}
              </div>
              <p className="text-sm text-gray-600 mt-1">Completed Projects</p>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update the client information below.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid grid-cols-2 gap-4">
              <Input required placeholder="Full Name" value={formData.name ?? ""} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} disabled={isLoading} />
              <Input placeholder="Company Name" value={formData.company ?? ""} onChange={e => setFormData(f => ({ ...f, company: e.target.value }))} disabled={isLoading} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input required placeholder="Contact Person" value={formData.contact ?? ""} onChange={e => setFormData(f => ({ ...f, contact: e.target.value }))} disabled={isLoading} />
              <Input type="email" placeholder="Email Address" value={formData.email ?? ""} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} disabled={isLoading} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Phone Number" value={formData.phone ?? ""} onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))} disabled={isLoading} />
              <select required className="w-full border rounded px-3 py-2" value={formData.source ?? ""} onChange={e => setFormData(f => ({ ...f, source: e.target.value as ClientSource }))} disabled={isLoading}>
                <option value="" disabled>Select Source</option>
                {CLIENT_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input required type="date" placeholder="Start Date" value={formData.startDate ?? ""} onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))} disabled={isLoading} />
              <select required className="w-full border rounded px-3 py-2" value={formData.status ?? ""} onChange={e => setFormData(f => ({ ...f, status: e.target.value as ClientStatus }))} disabled={isLoading}>
                <option value="" disabled>Select Status</option>
                {CLIENT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input type="number" min={0} placeholder="Number of Projects" value={formData.numberOfProjects ?? ""} onChange={e => setFormData(f => ({ ...f, numberOfProjects: Number(e.target.value) }))} disabled={isLoading} />
              <Input type="number" min={0} placeholder="Total Spent" value={formData.totalSpent ?? ""} onChange={e => setFormData(f => ({ ...f, totalSpent: Number(e.target.value) }))} disabled={isLoading} />
              <select className="border rounded px-3 py-2" value={formData.totalSpentCurrency ?? ""} onChange={e => setFormData(f => ({ ...f, totalSpentCurrency: e.target.value as Currency }))} disabled={isLoading}>
                <option value="" disabled>Currency</option>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input type="number" min={0} placeholder="Total Profit" value={formData.totalProfit ?? ""} onChange={e => setFormData(f => ({ ...f, totalProfit: Number(e.target.value) }))} disabled={isLoading} />
              <select className="border rounded px-3 py-2" value={formData.totalProfitCurrency ?? ""} onChange={e => setFormData(f => ({ ...f, totalProfitCurrency: e.target.value as Currency }))} disabled={isLoading}>
                <option value="" disabled>Currency</option>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <Input type="number" min={0} placeholder="Monthly Retainer" value={formData.retainer ?? ""} onChange={e => setFormData(f => ({ ...f, retainer: Number(e.target.value) }))} disabled={isLoading} />
            </div>
            <textarea className="w-full border rounded px-3 py-2" placeholder="Additional Notes" rows={4} value={formData.notes ?? ""} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} disabled={isLoading} />
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isLoading}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
