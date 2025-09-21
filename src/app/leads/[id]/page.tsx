import LeadDetailClient from '@/components/leads/LeadDetailClient';
import { getLeadById, updateLeadAction, deleteLeadAction, convertLeadToClientAction } from '@/actions/leads';
import type { Lead } from '@/types/lead';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getLeadById(id);
  const obj = data as unknown as Record<string, unknown>;
  const idRaw = obj.id ?? obj.$id ?? id;
  const lead = { ...(obj as Lead), id: String(idRaw ?? id) } as Lead;
  return (
    <LeadDetailClient
      initialLead={lead}
      actions={{
        update: updateLeadAction as unknown as (id: string, formData: FormData) => Promise<Lead>,
        remove: deleteLeadAction as unknown as (id: string) => Promise<void>,
        convert: convertLeadToClientAction as unknown as (id: string) => Promise<Lead>,
      }}
    />
  );
}
