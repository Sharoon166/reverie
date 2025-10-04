'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KPICard } from '@/components/ui/kpi-card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';
import type {
  Client,
  ClientSource,
  ClientStatus,
  Currency,
} from '@/types/client';
import {
  Download,
  Users,
  Coins,
  TrendingUp,
  Building,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  UserPlus,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import CSVImport from '@/components/CSVImport';
import { usePagination } from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';
import {
  ClientForm,
  NotesForm,
  type ClientFormValues,
} from '@/components/forms';
import { formatPakistaniCurrency } from '@/lib/utils';
import { ClientTargetsDialog } from '@/components/targets/ClientTargetsDialog';
import type { Quarter } from '@/types/quarter';


export type ClientsPageClientProps = {
  quarter: Quarter | null;
  initialClients: Client[];
  actions: {
    create: (formData: FormData) => Promise<Client>;
    update: (id: string, formData: FormData) => Promise<Client>;
    updateNotes: (id: string, formData: FormData) => Promise<Client>;
    remove: (id: string) => Promise<void>;
  };
};

export default function ClientsPageClient({
  quarter,
  initialClients,
  actions,
}: ClientsPageClientProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients || []);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [isPending, startTransition] = useTransition();
  const [isTargetsDialogOpen, setIsTargetsDialogOpen] = useState(false);

  const isLoading = isPending;

  const filteredClients = clients.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
  );

  const pagination = usePagination({ data: filteredClients, itemsPerPage: 6 });

  const now = new Date();
  const getQuarter = (date: Date) => Math.floor((date.getMonth() + 3) / 3);

  const totalRevenue = filteredClients.reduce(
    (sum, c) => sum + (c.totalSpent || 0),
    0
  );
  const activeClients = filteredClients.filter(
    (c) => c.status === 'Active'
  ).length;
  const totalProjects = filteredClients.reduce(
    (sum, c) => sum + (c.numberOfProjects || 0),
    0
  );

  // KPI Metrics
  const totalClientsAllTime = filteredClients.length;
  const totalAgenciesAllTime = new Set(
    filteredClients.map((c) => c.company).filter(Boolean)
  ).size;

  // Calculate quarterly metrics
  const currentQuarterStart = new Date(
    now.getFullYear(),
    Math.floor(now.getMonth() / 3) * 3,
    1
  );
  const acquiredThisQuarter = filteredClients.filter(
    (c) => new Date(c.startDate) >= currentQuarterStart
  ).length;
  
  // Calculate high value clients (clients with multiple projects)
  const highValueClients = filteredClients.filter(
    (c) => (c.numberOfProjects || 0) > 1
  ).length;
  
  // Calculate monthly retainer revenue
  const monthlyRetainerRevenue = filteredClients.reduce(
    (sum, c) => sum + (c.retainer || 0),
    0
  );

  const quarterlyTotalProjects = filteredClients.reduce((sum, client) => {
    // Assuming client has a projects array with createdAt dates
    // This is a simplified calculation - adjust based on your actual data structure
    return sum + (client.numberOfProjects || 0);
  }, 0);

  function valuesToFormData(values: ClientFormValues) {
    const fd = new FormData();
    fd.set('name', values.name);
    fd.set('company', values.company || '');
    fd.set('contact', values.contact);
    fd.set('email', values.email || '');
    fd.set('phone', values.phone || '');
    fd.set('source', values.source);
    fd.set('startDate', values.startDate.toISOString().split('T')[0]);
    fd.set('status', values.status);
    if (values.numberOfProjects !== undefined)
      fd.set('numberOfProjects', String(values.numberOfProjects));
    if (values.totalSpent !== undefined)
      fd.set('totalSpent', String(values.totalSpent));
    if (values.totalSpentCurrency)
      fd.set('totalSpentCurrency', values.totalSpentCurrency);
    if (values.totalProfit !== undefined)
      fd.set('totalProfit', String(values.totalProfit));
    if (values.totalProfitCurrency)
      fd.set('totalProfitCurrency', values.totalProfitCurrency);
    if (values.retainer !== undefined)
      fd.set('retainer', String(values.retainer));
    if (values.notes !== undefined) fd.set('notes', values.notes);
    return fd;
  }

  async function handleFormSubmit(data: ClientFormValues) {
    startTransition(async () => {
      try {
        const clientData = { ...data } as ClientFormValues;

        if (formMode === 'create') {
          const createdRaw = await actions.create(valuesToFormData(clientData));
          const created = {
            ...createdRaw,
            id: String(
              (createdRaw as Client)?.id ?? (createdRaw as Client)?.$id ?? ''
            ),
          } as Client;
          setClients((prev) => [...prev, created]);
          toast.success(`Client "${created.name}" created successfully`);
        } else {
          const id = String(formData.id);
          const updatedRaw = await actions.update(
            id,
            valuesToFormData(clientData)
          );
          const updated = {
            ...updatedRaw,
            id: String(
              (updatedRaw as Client)?.id ?? (updatedRaw as Client)?.$id ?? id
            ),
          } as Client;
          setClients((prev) =>
            prev.map((c) => (String(c.id) === id ? updated : c))
          );
          toast.success(`Client "${updated.name}" updated successfully`);
        }

        setShowFormDialog(false);
        setFormData({});
      } catch (e) {
        console.error(e);
        toast.error(
          `Failed to ${formMode === 'create' ? 'create' : 'update'} client. Please try again.`
        );
      }
    });
  }

  async function handleNotesSubmit(data: { notes?: string }) {
    startTransition(async () => {
      try {
        const id = String(selectedClient?.id);
        const fd = new FormData();
        fd.set('notes', data.notes || '');
        const updatedRaw = await actions.updateNotes(id, fd);
        const updated = {
          ...updatedRaw,
          id: String(
            (updatedRaw as Client)?.id ?? (updatedRaw as Client)?.$id ?? id
          ),
        } as Client;
        setClients((prev) =>
          prev.map((c) => (String(c.id) === id ? updated : c))
        );

        toast.success('Notes updated successfully');
        setShowNotesDialog(false);
        setSelectedClient(null);
      } catch (e) {
        console.error(e);
        toast.error('Failed to update notes. Please try again.');
      }
    });
  }

  async function handleDownloadPDF() {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, pageWidth, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('REVERIE', 20, 25);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Client Management Report', pageWidth - 20, 25, {
        align: 'right',
      });

      doc.setTextColor(0, 0, 0);

      doc.setFontSize(10);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
        20,
        50
      );
      doc.text(`Total Records: ${filteredClients.length}`, pageWidth - 20, 50, {
        align: 'right',
      });

      let yPos = 70;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos - 5, pageWidth - 30, 45, 'F');

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', 20, yPos + 5);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      doc.setFont('helvetica', 'bold');
      doc.text('Total Clients:', 20, yPos + 20);
      doc.text('Active Clients:', 100, yPos + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(filteredClients.length.toString(), 60, yPos + 20);
      const percent = filteredClients.length
        ? Math.round((activeClients / filteredClients.length) * 100)
        : 0;
      doc.text(`${activeClients} (${percent}%)`, 140, yPos + 20);

      doc.setFont('helvetica', 'bold');
      doc.text('Total Revenue:', 20, yPos + 30);
      doc.text('Total Projects:', 100, yPos + 30);
      doc.setFont('helvetica', 'normal');
      doc.text(`$${totalRevenue.toLocaleString()}`, 60, yPos + 30);
      doc.text(totalProjects.toString(), 140, yPos + 30);

      yPos = 130;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Client Directory', 20, yPos);

      yPos += 15;
      doc.setFillColor(59, 130, 246);
      doc.rect(15, yPos - 5, pageWidth - 30, 12, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENT NAME', 20, yPos + 3);
      doc.text('COMPANY', 70, yPos + 3);
      doc.text('EMAIL', 110, yPos + 3);
      doc.text('STATUS', 150, yPos + 3);
      doc.text('REVENUE', 170, yPos + 3);

      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPos += 15;

      filteredClients.forEach((client, index) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 30;
          doc.setFillColor(59, 130, 246);
          doc.rect(15, yPos - 5, pageWidth - 30, 12, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('CLIENT NAME', 20, yPos + 3);
          doc.text('COMPANY', 70, yPos + 3);
          doc.text('EMAIL', 110, yPos + 3);
          doc.text('STATUS', 150, yPos + 3);
          doc.text('REVENUE', 170, yPos + 3);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          yPos += 15;
        }

        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(15, yPos - 4, pageWidth - 30, 10, 'F');
        }

        doc.setFontSize(8);
        doc.text(client.name || 'N/A', 20, yPos + 2);
        doc.text(client.company || 'N/A', 70, yPos + 2);
        doc.text(client.email || 'N/A', 110, yPos + 2);

        if (client.status === 'Active') {
          doc.setTextColor(34, 197, 94);
        } else {
          doc.setTextColor(107, 114, 128);
        }
        doc.text(client.status || 'N/A', 150, yPos + 2);
        doc.setTextColor(0, 0, 0);

        doc.text(
          `${client.totalSpent || 0} ${client.totalSpentCurrency || ''}`,
          170,
          yPos + 2
        );

        yPos += 10;
      });

      doc.save(`clients-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Cards generation error:', error);
      toast.error('Failed to generate client cards. Please try again.', {
        id: 'cards-download',
      });
    }
  }

  function handleClientClick(clientId: string) {
    router.push(`/clients/${clientId}`);
  }

  async function handleCSVImport(data: Record<string, unknown>[]) {
    startTransition(async () => {
      try {
        const payloads: Partial<Client>[] = data.map((row) => ({
          name: String(row.name || ''),
          company: String(row.company || ''),
          contact: String(row.contact || row.name || ''),
          email: String(row.email || ''),
          phone: String(row.phone || ''),
          source: (row.source as ClientSource) || 'Website',
          startDate: String(
            row.startDate ||
            row.start_date ||
            new Date().toISOString().split('T')[0]
          ),
          numberOfProjects:
            Number(row.numberOfProjects ?? row.no_of_projects) || 0,
          totalSpent: Number(row.totalSpent ?? row.total_spent) || 0,
          totalSpentCurrency: (row.totalSpentCurrency ??
            row.total_spent_currency ??
            'PKR') as Currency,
          totalProfit: Number(row.totalProfit ?? row.total_profit) || 0,
          totalProfitCurrency: (row.totalProfitCurrency ??
            row.total_profit_currency ??
            'PKR') as Currency,
          retainer: Number(row.retainer) || 0,
          notes: String(row.notes || ''),
          status: (row.status as ClientStatus) || 'Active',
        }));

        const createdListRaw = await Promise.all(
          payloads.map(async (p) => {
            const fd = new FormData();
            Object.entries(p).forEach(([k, v]) => {
              if (v !== undefined && v !== null) fd.set(k, String(v));
            });
            return actions.create(fd);
          })
        );
        const createdList = createdListRaw.map(
          (r) => ({ ...r, id: String(r?.id ?? r?.$id ?? '') }) as Client
        );
        setClients((prev) => [...prev, ...createdList]);
      } catch (e) {
        console.error(e);
        toast.error('Failed to import some clients');
      }
    });
  }

  return (
    <div className="pt-16 space-y-4">
      {/* Header Section */}
      <div className="space-y-1 mb-8">
        <div className="flex flex-wrap gap-y-3 items-center justify-between">
          <div>
            <h2 className="text-4xl font-light text-gray-900">
              Client Management
            </h2>
            <p className="text-sm text-gray-600">
              Manage your clients and track business relationships
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CSVImport
              onImport={handleCSVImport}
              expectedColumns={[
                'name',
                'company',
                'email',
                'phone',
                'source',
                'startDate',
                'totalSpent',
                'totalSpentCurrency',
              ]}
              entityName="Client"
              sampleData={{
                name: 'John Smith',
                company: 'Acme Corp',
                email: 'john@acme.com',
                phone: '+92-300-1234567',
                source: 'LinkedIn',
                startDate: new Date().toISOString().split('T')[0],
                totalSpent: '100000',
                totalSpentCurrency: 'PKR',
              }}
            />
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={isLoading}
              className="border-gray-300 hover:bg-yellow-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={() => setIsTargetsDialogOpen(true)}
              disabled={isLoading}
            >
              <Target className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Set Targets
              </span>
            </Button>
            <Button
              onClick={() => {
                setFormMode('create');
                setFormData({});
                setShowFormDialog(true);
              }}
              disabled={isLoading}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div>
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-400 rounded-xl">
                <Users className="h-6 w-6 text-gray-900" />
              </div>
              <div>
                <div className="text-3xl font-light text-gray-900">
                  {filteredClients.length} <span className="text-base text-muted-foreground">({totalAgenciesAllTime} Agencies)</span>
                </div>
                <div className="text-sm text-gray-600">Total Clients</div>
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
                <div className="text-3xl font-light text-gray-900">
                  {activeClients}
                </div>
                <div className="text-sm text-gray-600">Active Clients</div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500 rounded-xl">
                <Coins className="h-6 w-6 text-gray-900" />
              </div>
              <div>
                <div className="text-3xl font-light text-gray-900">
                  {formatPakistaniCurrency(totalRevenue)}
                </div>
                <div className="text-sm text-gray-600">Total Revenue</div>
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
                <div className="text-3xl font-light text-gray-900">
                  {totalProjects}
                </div>
                <div className="text-sm text-gray-600">Total Projects</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="w-full mt-6">
        <h2 className="text-2xl font-semibold mb-4">
          Quarterly KPIs <span className="uppercase">{quarter?.quarterId}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KPICard
            title="Client Acquisition"
            subtitle={quarter?.quarterId.toUpperCase()}
            value={`${acquiredThisQuarter} / ${quarter?.clientAcquisitionTarget || 0}`}
            icon={<TrendingUp className="h-6 w-6 text-white" />}
            color="bg-gray-800"
            progress={quarter?.clientAcquisitionTarget ? (acquiredThisQuarter / quarter.clientAcquisitionTarget) * 100 : 0}
            description={`Target: ${quarter?.clientAcquisitionTarget}`}
          />
          <KPICard
            title="High Value Clients"
            value={`${highValueClients} / ${quarter?.highValueClientsTarget || 0}`}
            icon={<Users className="h-6 w-6 text-white" />}
            color="bg-green-600"
            progress={quarter?.highValueClientsTarget ? (highValueClients / quarter.highValueClientsTarget) * 100 : 0}
            description={`Target: ${quarter?.highValueClientsTarget || 0}`}
          />
          <KPICard
            title="Monthly Retainers"
            subtitle="Recurring Revenue"
            value={formatPakistaniCurrency(monthlyRetainerRevenue)}
            icon={<Coins className="h-6 w-6 text-gray-900" />}
            color="bg-blue-500"
            description={`${filteredClients.length} clients`}
          />
          <KPICard
            title="Total Projects"
            subtitle={quarter?.quarterId.toUpperCase()}
            value={quarterlyTotalProjects}
            icon={<Building className="h-6 w-6 text-gray-900" />}
            color="bg-yellow-500"
          />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search clients by name or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
        <div className="col-span-4 flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="border-gray-300 hover:bg-yellow-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Badge className="bg-yellow-400 text-gray-900">
            {filteredClients.length} results
          </Badge>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {!isLoading && filteredClients.length === 0 && (
          <div className="col-span-12 text-center text-sm text-gray-500">
            No clients
          </div>
        )}
        {pagination.paginatedData.map((client, idx) => (
          <div
            key={
              client.id ||
              String(
                (client as unknown as { $id?: unknown }).$id ?? `client-${idx}`
              )
            }
          >
            <Card
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleClientClick(String(client.id))}
            >
              <div className="space-y-4">
                {/* Client Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-gray-900 font-bold text-lg">
                      {client.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {client.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {client.company || 'No company'}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      client.status === 'Active'
                        ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                        : 'bg-gray-400 text-white'
                    }
                  >
                    {client.status}
                  </Badge>
                </div>

                {/* Client Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span>{client.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{client.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Since{' '}
                      {new Date(client.startDate ?? '').toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between items-center gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-xl font-semibold">
                      {client.numberOfProjects ?? 0}
                    </div>
                    <div className="text-xs text-gray-500">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold">
                      {client.totalSpent
                        ? formatPakistaniCurrency(client.totalSpent)
                        : 0}
                    </div>
                    <div className="text-xs text-gray-500">Revenue</div>
                  </div>
                </div>

                {/* Source and Category Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Badge className="bg-gray-800 text-white hover:bg-gray-900">
                      {client.source}
                    </Badge>
                    {client.category && (
                      <Badge
                        className={
                          client.category === 'Agency Partner'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {client.category}
                      </Badge>
                    )}
                    {client.isHighValue && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        High Value
                      </Badge>
                    )}
                  </div>
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

      {/* Client Form Dialog */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'create' ? 'Add Client' : 'Edit Client'}
            </DialogTitle>
            <DialogDescription>
              Fill in the client details below.
            </DialogDescription>
          </DialogHeader>
          <ClientForm
            initialData={
              formMode === 'edit' ? (formData as Partial<Client>) : undefined
            }
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
            mode={formMode}
          />
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Client Notes</DialogTitle>
            <DialogDescription>
              Add or update notes for {selectedClient?.name}.
            </DialogDescription>
          </DialogHeader>
          <NotesForm
            initialNotes={selectedClient?.notes}
            onSubmit={handleNotesSubmit}
            isLoading={isLoading}
            entityName="client"
          />
        </DialogContent>
      </Dialog>

      {/* Client Targets Dialog */}
      <ClientTargetsDialog
        open={isTargetsDialogOpen}
        quarter={quarter}
        onOpenChange={setIsTargetsDialogOpen}
        onSuccess={() => {
          setIsTargetsDialogOpen(false);
        }}
      />
    </div>
  );
}
