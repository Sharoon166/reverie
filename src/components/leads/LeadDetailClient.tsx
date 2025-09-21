"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import type { Lead, LeadPriority, LeadSource, LeadStatus } from "@/types/lead";
import { toast } from "sonner";
import { ArrowLeft, Edit, Trash2, UserCheck, Mail, Phone, Building, Calendar, DollarSign, User, Target, Clock, FileText } from "lucide-react";
import { LEAD_SOURCES, LEAD_STATUS, PRIORITY_LEVELS } from '@/lib/constants';
import { Currency } from "@/types";

export type LeadDetailClientProps = {
  initialLead: Lead;
  actions: {
    update: (id: string, formData: FormData) => Promise<Lead>;
    remove: (id: string) => Promise<void>;
    convert: (id: string) => Promise<Lead>;
  }
};

function getStatusColor(status: string) {
  const s = String(status).toLowerCase();
  switch (s) {
    case 'new': return 'bg-blue-100 text-blue-800';
    case 'contacted': return 'bg-yellow-100 text-yellow-800';
    case 'qualified': return 'bg-green-100 text-green-800';
    case 'proposal sent': return 'bg-purple-100 text-purple-800';
    case 'negotiation': return 'bg-orange-100 text-orange-800';
    case 'converted': return 'bg-emerald-100 text-emerald-800';
    case 'lost': return 'bg-red-100 text-red-800';
    case 'follow-up': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getPriorityColor(priority: string) {
  const p = String(priority).toLowerCase();
  switch (p) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export default function LeadDetailClient({ initialLead, actions }: LeadDetailClientProps) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState<Lead>({} as Lead);
  const [isPending, startTransition] = useTransition();
  const isLoading = isPending;

  useEffect(() => { setFormData(initialLead); }, [initialLead]);

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString() : undefined;

  function toFormData(data: Lead) {
    const fd = new FormData();
    const map = (k: string, v: unknown) => { if (v !== undefined && v !== null) fd.set(k, String(v)); };
    map('name', data.name);
    map('company', data.company);
    map('contact', data.contact);
    map('email', data.email);
    map('phone', data.phone);
    map('source', data.source);
    map('status', data.status);
    map('priority', data.priority);
    map('estimatedValue', data.estimatedValue ?? data.estimatedValue);
    map('currency', data.currency);
    map('nextFollowup', data.nextFollowup ?? data.nextFollowup);
    map('lastContact', data.lastContact ?? data.lastContact);
    map('assignedTo', data.assignedTo ?? data.assignedTo);
    map('notes', data.notes);
    return fd;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const id = String(lead.id);
        const updatedRaw = await actions.update(id, toFormData(formData));
        const updated = { ...(updatedRaw as Lead), id: String((updatedRaw as Lead)?.id ?? (updatedRaw as Lead)?.$id ?? id) };
        setLead(updated);
        setFormData(updated);
        setShowEditDialog(false);
        toast.success('Lead updated successfully');
      } catch {
        toast.error('Failed to update lead. Please try again.');
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await actions.remove(String(lead.id));
        toast.success('Lead deleted successfully');
        router.push('/leads');
      } catch {
        toast.error('Failed to delete lead. Please try again.');
      }
    });
  }

  function handleConvertToClient() {
    startTransition(async () => {
      try {
        await actions.convert(String(lead.id));
        toast.success('Lead converted to client successfully');
        router.push('/clients');
      } catch {
        toast.error('Failed to convert lead to client. Please try again.');
      }
    });
  }

  if (!lead) {
    return (
      <div className="pt-16 space-y-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lead details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/leads')} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />Back to Leads</Button>
          <div className="h-6 w-px bg-gray-300" />
          <div>
            <h1 className="text-3xl font-light">{lead.name}</h1>
            <p className="text-sm text-muted-foreground">{lead.company || 'Individual Lead'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {String(lead.status).toLowerCase() !== 'converted' && String(lead.status).toLowerCase() !== 'lost' && (
            <Button variant="outline" onClick={handleConvertToClient} disabled={isLoading}><UserCheck className="h-4 w-4 mr-2" />Convert to Client</Button>
          )}
          <Button variant="outline" onClick={() => setShowEditDialog(true)} disabled={isLoading}><Edit className="h-4 w-4 mr-2" />Edit</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge variant="outline" className={getStatusColor(lead.status)}>{lead.status}</Badge>
        <Badge variant="outline" className={getPriorityColor(lead.priority)}>{lead.priority} Priority</Badge>
        <Badge variant="outline" className="bg-blue-100 text-blue-800">{lead.source}</Badge>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4"><User className="h-5 w-5 text-gray-600" /><h3 className="text-lg font-semibold">Contact Information</h3></div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-gray-400" /><div><p className="text-sm text-gray-600">Email</p><p className="font-medium">{lead.email || 'Not provided'}</p></div></div>
                <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-gray-400" /><div><p className="text-sm text-gray-600">Phone</p><p className="font-medium">{lead.phone || 'Not provided'}</p></div></div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3"><Building className="h-4 w-4 text-gray-400" /><div><p className="text-sm text-gray-600">Company</p><p className="font-medium">{lead.company || 'Individual'}</p></div></div>
                <div className="flex items-center gap-3"><User className="h-4 w-4 text-gray-400" /><div><p className="text-sm text-gray-600">Assigned To</p><p className="font-medium">{lead.assignedTo || 'Unassigned'}</p></div></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4"><Clock className="h-5 w-5 text-gray-600" /><h3 className="text-lg font-semibold">Timeline</h3></div>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-gray-400" /><div><p className="text-sm text-gray-600">Last Contact</p><p className="font-medium">{fmtDate(lead.lastContact) || 'Never'}</p></div></div>
              <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-gray-400" /><div><p className="text-sm text-gray-600">Next Follow-up</p><p className="font-medium">{fmtDate(lead.nextFollowup) || 'Not scheduled'}</p></div></div>
            </div>
          </Card>

          {lead.notes && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4"><FileText className="h-5 w-5 text-gray-600" /><h3 className="text-lg font-semibold">Notes</h3></div>
              <p className="text-gray-700 leading-relaxed">{lead.notes}</p>
            </Card>
          )}
        </div>

        <div className="col-span-4 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4"><DollarSign className="h-5 w-5 text-gray-600" /><h3 className="text-lg font-semibold">Estimated Value</h3></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{lead.estimatedValue ? `${lead.estimatedValue} ${lead.currency}` : 'TBD'}</div>
              <p className="text-sm text-gray-600 mt-1">Potential Revenue</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4"><Target className="h-5 w-5 text-gray-600" /><h3 className="text-lg font-semibold">Lead Source</h3></div>
            <div className="text-center"><Badge variant="outline" className="bg-blue-100 text-blue-800 text-lg px-4 py-2">{lead.source}</Badge></div>
          </Card>
        </div>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update the lead information below.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSave}>
            <div className="grid grid-cols-2 gap-4">
              <Input required placeholder="Full Name" value={formData.name ?? ''} onChange={e => setFormData((f: Lead) => ({ ...f, name: e.target.value }))} disabled={isLoading} />
              <Input placeholder="Company Name" value={formData.company ?? ''} onChange={e => setFormData((f: Lead) => ({ ...f, company: e.target.value }))} disabled={isLoading} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input type="email" placeholder="Email Address" value={formData.email ?? ''} onChange={e => setFormData((f: Lead) => ({ ...f, email: e.target.value }))} disabled={isLoading} />
              <Input placeholder="Phone Number" value={formData.phone ?? ''} onChange={e => setFormData((f: Lead) => ({ ...f, phone: e.target.value }))} disabled={isLoading} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <select required className="w-full border rounded px-3 py-2" value={formData.source ?? ''} onChange={e => setFormData((f: Lead) => ({ ...f, source: e.target.value as LeadSource }))} disabled={isLoading}>
                {LEAD_SOURCES.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              <select required className="w-full border rounded px-3 py-2" value={formData.status ?? ''} onChange={e => setFormData((f: Lead) => ({ ...f, status: e.target.value as LeadStatus }))} disabled={isLoading}>
                {LEAD_STATUS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              <select required className="w/full border rounded px-3 py-2" value={formData.priority ?? ''} onChange={e => setFormData((f: Lead) => ({ ...f, priority: e.target.value as LeadPriority }))} disabled={isLoading}>
                {PRIORITY_LEVELS.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input type="number" min={0} placeholder="Estimated Value" value={formData.estimatedValue ?? ''} onChange={e => setFormData((f: Lead) => ({ ...f, estimatedValue: Number(e.target.value) }))} disabled={isLoading} />
              <select className="border rounded px-3 py-2" value={formData.currency ?? ''} onChange={e => setFormData((f: Lead) => ({ ...f, currency: e.target.value as Currency }))} disabled={isLoading}>
                <option value="USD">USD</option>
                <option value="PKR">PKR</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input type="date" placeholder="Next Follow-up" value={formData.nextFollowup ?? ''} onChange={e => setFormData((f: Lead) => ({ ...f, nextFollowup: e.target.value }))} disabled={isLoading} />
              <Input placeholder="Assigned To" value={formData.assignedTo ?? ''} onChange={e => setFormData((f: Lead) => ({ ...f, assignedTo: e.target.value }))} disabled={isLoading} />
            </div>
            <textarea className="w-full border rounded px-3 py-2" placeholder="Lead Notes" rows={4} value={formData.notes ?? ''} onChange={e => setFormData((f: Lead) => ({ ...f, notes: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <DialogClose asChild><Button type="button" variant="ghost" disabled={isLoading}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
