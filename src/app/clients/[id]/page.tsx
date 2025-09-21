import ClientDetailClient from '@/components/clients/ClientDetailClient';
import { getClientById, updateClientAction, deleteClientAction } from '@/actions/clients';
import type { Client } from '@/types/client';

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getClientById(String(id));
  const client = { ...(data as Client), id: String((data as Client)?.id ?? (data as Client)?.$id ?? id) };
  return (
    <ClientDetailClient
      initialClient={client}
      actions={{
        update: updateClientAction as unknown as (id: string, formData: FormData) => Promise<Client>,
        remove: deleteClientAction as unknown as (id: string) => Promise<void>,
      }}
    />
  );
}
