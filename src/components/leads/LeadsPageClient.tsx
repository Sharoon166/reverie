"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Lead, LeadStatus, LeadPriority, LeadSource } from "@/types/lead";
import { Download, Users, TrendingUp, Calendar, Phone, Mail, DollarSign, Search, Filter, MoreVertical, UserPlus } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import CSVImport from "@/components/CSVImport";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/Pagination";
import { LeadForm, type LeadFormValues } from "@/components/forms";
import { PRIORITY_LEVELS, LEAD_STATUS } from "@/lib/constants";

export type LeadsPageClientProps = {
  initialLeads: Lead[];
  employees: { id: string; name: string }[];
  actions: {
    create: (formData: FormData) => Promise<Lead>;
    update: (id: string, formData: FormData) => Promise<Lead>;
    remove: (id: string) => Promise<void>;
    convert: (id: string) => Promise<Lead>;
  };
};

function getStatusColor(status: LeadStatus) {
  switch (status) {
    case 'new': return 'bg-yellow-400 text-gray-900';
    case 'contacted': return 'bg-yellow-500 text-gray-900';
    case 'qualified': return 'bg-gray-800 text-white';
    case 'proposal sent': return 'bg-yellow-600 text-gray-900';
    case 'negotiation': return 'bg-gray-700 text-white';
    case 'converted': return 'bg-yellow-400 text-gray-900';
    case 'lost': return 'bg-gray-800 text-white';
    case 'follow-up': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-400 text-white';
  }
}

function getPriorityColor(priority: LeadPriority) {
  switch (priority) {
    case 'critical': return 'bg-gray-800 text-white';
    case 'high': return 'bg-yellow-500 text-gray-900';
    case 'medium': return 'bg-yellow-400 text-gray-900';
    case 'low': return 'bg-gray-400 text-white';
    default: return 'bg-gray-400 text-white';
  }
}

export default function LeadsPageClient({ initialLeads, employees, actions }: LeadsPageClientProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initialLeads || []);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [isPending, startTransition] = useTransition();
  const isLoading = isPending;

  const now = useMemo(() => new Date(), []);
  const getQuarter = useCallback((d: Date) => Math.floor(d.getMonth() / 3) + 1, []);
  const sameQuarter = useCallback((dateStr: string, ref: Date) => {
    const d = new Date(dateStr);
    return d.getFullYear() === ref.getFullYear() && getQuarter(d) === getQuarter(ref);
  }, [getQuarter]);

  const leadsThisQuarter = useMemo(
    () => leads.filter((l) => sameQuarter(String((l).createdDate ?? (l)?.createdDate ?? ''), now)),
    [leads, now, sameQuarter]
  );
  const totalQualifiedThisQuarter = useMemo(() => leadsThisQuarter.filter((l) => String((l).status).toLowerCase() === 'qualified').length, [leadsThisQuarter]);
  const convertedThisQuarter = useMemo(() => leadsThisQuarter.filter((l) => String((l).status).toLowerCase() === 'converted').length, [leadsThisQuarter]);
  const conversionRate = useMemo(() => totalQualifiedThisQuarter > 0 ? Math.round((convertedThisQuarter / totalQualifiedThisQuarter) * 100) : 0, [convertedThisQuarter, totalQualifiedThisQuarter]);

  const filteredLeads = leads.filter((lead) =>
    String(lead.status).toLowerCase() !== 'converted' &&
    (lead.name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.company?.toLowerCase().includes(search.toLowerCase()) ||
      (lead.email ?? '').toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || String(lead.status) === filterStatus) &&
    (!filterPriority || String(lead.priority) === filterPriority)
  );

  const pagination = usePagination({ data: filteredLeads, itemsPerPage: 12 });

  const totalValue = filteredLeads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);
  const qualifiedLeads = filteredLeads.filter((lead) => String(lead.status).toLowerCase() === 'qualified').length;
  const newLeads = filteredLeads.filter((lead) => String(lead.status).toLowerCase() === 'new').length;

  function handleEdit(lead: Lead) {
    setFormMode('edit');
    setFormData(lead);
    setShowFormDialog(true);
  }

  function valuesToFormData(values: LeadFormValues) {
    const fd = new FormData();
    fd.set('name', values.name);
    fd.set('company', values.company || '');
    fd.set('contact', values.contact);
    fd.set('email', values.email || '');
    fd.set('phone', values.phone || '');
    fd.set('source', values.source);
    fd.set('status', values.status);
    fd.set('priority', values.priority);
    if (values.estimatedValue !== undefined) fd.set('estimatedValue', String((values).estimatedValue));
    if (values.currency) fd.set('currency', values.currency);
    if (values.nextFollowup) fd.set('nextFollowup', values?.nextFollowup.toISOString().split('T')[0]);
    if (values.assignedTo) fd.set('assignedTo', values?.assignedTo);
    if (values.notes !== undefined) fd.set('notes', values.notes);
    return fd;
  }

  function handleDelete(leadId: string) {
    startTransition(async () => {
      try {
        const lead = leads.find((l) => l.id === leadId);
        await actions.remove(leadId);
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
        toast.success(`Lead "${lead?.name}" deleted successfully`);
      } catch {
        toast.error('Failed to delete lead. Please try again.');
      }
    });
  }

  function handleConvertToClient(lead: Lead) {
    startTransition(async () => {
      try {
        await actions.convert(lead.id);
        toast.success(`Lead "${lead.name}" converted to client`);
        router.push('/clients');
      } catch {
        toast.error('Failed to convert lead. Please try again.');
      }
    });
  }

  function handleDownloadPDF() {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Leads Summary', 15, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 15, 20, { align: 'right' });
      let y = 35;
      doc.text(`Current Quarter: Q${getQuarter(now)} ${now.getFullYear()}`, 15, y); y += 6;
      doc.text(`Total Leads: ${filteredLeads.length}`, 15, y); y += 6;
      doc.text(`Conversion Rate: ${conversionRate}%`, 15, y); y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Leads', 15, y); y += 6;
      doc.setFont('helvetica', 'normal');
      filteredLeads.forEach((l, idx) => { if (y > 270) { doc.addPage(); y = 20; } doc.text(`${idx + 1}. ${l.name} (${l.status}) - ${l.company || 'Individual'}`, 15, y); y += 6; });
      doc.save(`leads-summary-Q${getQuarter(now)}-${now.getFullYear()}.pdf`);
    } catch { toast.error('Failed to export PDF'); }
  }

  function handleLeadClick(leadId: string) { router.push(`/leads/${leadId}`); }

  async function handleFormSubmit(data: LeadFormValues): Promise<void> {
    try {
      if (formMode === 'create') {
        const createdRaw = await actions.create(valuesToFormData(data));
        const created = { ...(createdRaw as Lead), id: String((createdRaw as Lead)?.id ?? (createdRaw as Lead)?.$id ?? '') } as Lead;
        setLeads((prev) => [...prev, created]);
        toast.success(`Lead "${created.name}" created successfully`);
      } else {
        const id = String(formData.id);
        const updatedRaw = await actions.update(id, valuesToFormData(data));
        const updated = { ...(updatedRaw as Lead), id: String((updatedRaw as Lead)?.id ?? (updatedRaw as Lead)?.$id ?? '') } as Lead;
        setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
        toast.success(`Lead "${updated.name}" updated successfully`);
      }
      setShowFormDialog(false);
      setFormData({});
    } catch {
      toast.error(`Failed to ${formMode === 'create' ? 'create' : 'update'} lead. Please try again.`);
    }
  }

  function handleCSVImport(data: Record<string, unknown>[]) {
    startTransition(async () => {
      try {
        const createdListRaw = await Promise.all(
          data.map(async (row) => {
            const fd = new FormData();
            const map = (k: string, v: unknown) => { if (v !== undefined && v !== null && v !== '') fd.set(k, String(v)); };
            map('name', row.name);
            map('company', row.company);
            map('contact', (row as Lead).contact ?? row.name);
            map('email', row.email);
            map('phone', row.phone);
            map('source', (row.source as LeadSource) || 'website');
            map('status', (row.status as LeadStatus) || 'new');
            map('priority', (row.priority as LeadPriority) || 'medium');
            map('estimatedValue', Number((row as Lead).estimatedValue ?? (row as Lead).estimatedValue) || 0);
            map('currency', (row as Lead).currency || 'PKR');
            // Do not send createdDate; Appwrite manages $createdAt and schema may not include createdDate
            map('lastContact', (row as Lead).lastContact);
            map('nextFollowup', (row as Lead).nextFollowup);
            map('assignedTo', (row as Lead).assignedTo);
            map('notes', row.notes);
            return actions.create(fd);
          })
        );
        const createdList = createdListRaw.map((r) => ({ ...(r as Lead), id: String((r as Lead)?.id ?? '') } as Lead));
        setLeads((prev) => [...prev, ...createdList]);
      } catch {
        toast.error('Failed to import some leads');
      }
    });
  }

  return (
    <div className="pt-16 space-y-4">
      {/* Header */}
      <div className="space-y-1 mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          <div>
            <h2 className="text-4xl font-light text-gray-900">Lead Management</h2>
            <p className="text-sm max-lg:text-center text-gray-600">Track and nurture your sales leads</p>
          </div>
          <div className="flex items-center gap-3">
            <CSVImport onImport={handleCSVImport} expectedColumns={["name", "company", "email", "phone", "source", "status", "priority", "estimated_value", "currency"]} entityName="Lead" sampleData={{ name: 'Jane Doe', company: 'Acme', email: 'jane@acme.com', phone: '+92-300-1234567', source: 'website', status: 'new', priority: 'medium', estimated_value: '5000', currency: 'PKR' }} />
            <Button variant="outline" onClick={handleDownloadPDF} disabled={isLoading} className="border-gray-300 hover:bg-yellow-50"><Download className="h-4 w-4 mr-2" />Export PDF</Button>
            <Button onClick={() => { setFormMode('create'); setFormData({}); setShowFormDialog(true); }} disabled={isLoading} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"><UserPlus className="h-4 w-4 mr-2" />Add Lead</Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div>
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-400 rounded-xl"><Users className="h-6 w-6 text-gray-900" /></div>
              <div>
                <div className="text-3xl font-light text-gray-900">{filteredLeads.length}</div>
                <div className="text-sm text-gray-600">Total Leads</div>
              </div>
            </div>
          </Card>
        </div>
        <div>
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-800 rounded-xl"><TrendingUp className="h-6 w-6 text-white" /></div>
              <div>
                <div className="text-3xl font-light text-gray-900">{qualifiedLeads}</div>
                <div className="text-sm text-gray-600">Qualified</div>
              </div>
            </div>
          </Card>
        </div>
        <div>
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500 rounded-xl"><Calendar className="h-6 w-6 text-gray-900" /></div>
              <div>
                <div className="text-3xl font-light text-gray-900">{newLeads}</div>
                <div className="text-sm text-gray-600">New Leads</div>
              </div>
            </div>
          </Card>
        </div>
        <div>
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-700 rounded-xl"><DollarSign className="h-6 w-6 text-white" /></div>
              <div>
                <div className="text-3xl font-light text-gray-900">${totalValue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search leads by name, company, or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div>
          <select className="w-full border rounded px-3 py-2" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {LEAD_STATUS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div>
          <select className="w-full border rounded px-3 py-2" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="">All Priority</option>
            {PRIORITY_LEVELS.map((p) => (<option key={p} value={p}>{p}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" className="border-gray-300 hover:bg-yellow-50"><Filter className="h-4 w-4 mr-2" />Filters</Button>
          <Badge className="bg-yellow-400 text-gray-900">{filteredLeads.length} results</Badge>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pagination.paginatedData.map((lead) => (
          <div key={lead.id}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleLeadClick(lead.id)}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">{lead.name.charAt(0)}</div>
                    <div>
                      <div className="font-semibold text-gray-900">{lead.name}</div>
                      <div className="text-sm text-gray-600">{lead.company || 'Individual'}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className={getStatusColor(lead.status)}>{lead.status}</Badge>
                    <Badge variant="outline" className={getPriorityColor(lead.priority)}>{lead.priority}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="h-4 w-4" /><span>{lead.email || 'No email'}</span></div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="h-4 w-4" /><span>{lead.phone || 'No phone'}</span></div>
                  <div className="flex items-center gap-2 text-sm text-gray-600"><Calendar className="h-4 w-4" /><span>Created {new Date((lead as Lead).createdDate ?? (lead as Lead)?.createdDate ?? new Date()).toLocaleDateString()}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-xl font-semibold">{lead.estimatedValue ? `${lead.estimatedValue} ${lead.currency}` : 'TBD'}</div>
                    <div className="text-xs text-gray-500">Est. Value</div>
                  </div>
                  <div className="text-center">
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">{lead.source}</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">{lead.assignedTo && `Assigned: ${lead.assignedTo}`}</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        onClick={(e) => e.stopPropagation()}
                        disabled={isLoading}
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(lead);
                        }}
                        className="cursor-pointer"
                      >
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConvertToClient(lead);
                        }}
                        className="cursor-pointer"
                      >
                        Convert to Client
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(lead.id);
                        }}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                      >
                        Delete Lead
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
        <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.goToPage} canGoPrev={pagination.canGoPrev} canGoNext={pagination.canGoNext} startIndex={pagination.startIndex} endIndex={pagination.endIndex} totalItems={pagination.totalItems} />
      </div>

      {/* Lead Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formMode === 'create' ? 'Add Lead' : 'Edit Lead'}</DialogTitle>
            <DialogDescription>Fill in the lead details below.</DialogDescription>
          </DialogHeader>
          <LeadForm initialData={formMode === 'edit' ? (formData as Partial<Lead>) : undefined} onSubmit={handleFormSubmit} isLoading={isLoading} mode={formMode} employees={employees} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
