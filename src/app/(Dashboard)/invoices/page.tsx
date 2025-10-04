import InvoicesPageClient from '@/components/invoices/InvoicesPageClient';
import { getAllInvoices } from '@/actions/invoices';
import { getAllClients } from '@/actions/clients';
import { getOrCreateCurrentQuarter } from '@/utils/quarterCreation';

export default async function InvoicesPage() {
  const invoices = await getAllInvoices();
  const quarter  = await getOrCreateCurrentQuarter();
  const clientsRes = await getAllClients();
  const raw =
    (clientsRes as unknown as { rows?: unknown[] })?.rows ??
    (clientsRes as unknown as unknown[]);
  const list = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
  const clients = list.map((c) => ({
    id: String(c.$id ?? c.id ?? ''),
    name: String(c.name ?? ''),
    company: (c.company as string) || undefined,
  }));
  return <InvoicesPageClient quarter={quarter} initialInvoices={invoices} clients={clients} />;
}
