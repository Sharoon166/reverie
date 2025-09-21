import LeadsPageClient from '@/components/leads/LeadsPageClient';
import { getAllLeads, createLeadAction, updateLeadAction, deleteLeadAction, convertLeadToClientAction } from '@/actions/leads';
import { getAllEmployees } from '@/actions/employees';
import type { Lead } from '@/types/lead';

export default async function LeadsPage() {
  const res = await getAllLeads();
  const rows = (typeof res === 'object' && res !== null && Array.isArray((res as { rows?: unknown[] }).rows))
    ? ((res as { rows?: unknown[] }).rows as unknown[])
    : [];
  const leads: Lead[] = rows.map((r) => {
    const row = r as Record<string, unknown>;
    const idRaw = row.id ?? row.$id;
    return { ...(row as Lead), id: String(idRaw ?? '') };
  });
  const empRes = await getAllEmployees();
  let employees: { id: string; name: string }[] = [];
  
  if (Array.isArray(empRes)) {
    // Handle case where the API returns the array directly
    employees = empRes.map(emp => ({
      id: String(emp.id || emp.$id || ''),
      name: String(emp.name || 'Unknown')
    }));
  } else if (empRes && typeof empRes === 'object' && empRes !== null) {
    const empData = empRes as { rows?: Array<{ id?: string; $id?: string; name?: string }> };
    if (empData.rows && Array.isArray(empData.rows)) {
      // Handle case where the API returns { rows: [...] }
      employees = empData.rows.map(emp => ({
        id: String(emp.id || emp.$id || ''),
        name: String(emp.name || 'Unknown')
      }));
    }
  }

  return (
    <LeadsPageClient
      initialLeads={leads}
      employees={employees}
      actions={{
        create: createLeadAction as unknown as (formData: FormData) => Promise<Lead>,
        update: updateLeadAction as unknown as (id: string, formData: FormData) => Promise<Lead>,
        remove: deleteLeadAction as unknown as (id: string) => Promise<void>,
        convert: convertLeadToClientAction as unknown as (id: string) => Promise<Lead>,
      }}
    />
  );
}
