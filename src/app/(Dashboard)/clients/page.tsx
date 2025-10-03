import type { Client } from '@/types/client';
import ClientsPageClient from '@/components/clients/ClientsPageClient';
import {
  getAllClients,
  createClientAction,
  updateClientAction,
  updateClientNotesAction,
  deleteClientAction,
} from '@/actions/clients';
import { getOrCreateCurrentQuarter } from '@/utils/quarterCreation';

export default async function ClientsPage() {
  const res = await getAllClients();
  const quarter = await getOrCreateCurrentQuarter();
  type RowLike = Partial<Client> & { $id?: string; id?: string };
  const rows = Array.isArray((res as unknown as { rows?: RowLike[] })?.rows)
    ? (res as unknown as { rows: RowLike[] }).rows
    : [];
  const clients: Client[] = rows.map((r) => ({
    ...(r as Client),
    id: String(r.id ?? r.$id ?? ''),
  }));

  return (
    <ClientsPageClient
      initialClients={clients}
      quarter={quarter}
      actions={{
        create: createClientAction,
        update: updateClientAction,
        updateNotes: updateClientNotesAction,
        remove: deleteClientAction,
      }}
    />
  );
}
