'use server';

import { APPWRITE_DB, db, ID } from '@/lib/appwrite';
import type { Client, Currency } from '@/types/client';
import type { ClientFormValues } from '@/components/forms';
import { revalidatePath } from 'next/cache';

type ModifiedClient = Client & {
  $createdAt: string;
  $updatedAt: string;
  $databaseId: string;
  $tableId: string;
  $id: string;
};

function toCamel(data: ClientFormValues): Partial<Client> {
  return {
    name: data.name,
    company: data.company || undefined,
    contact: data.contact,
    email: data.email || undefined,
    phone: data.phone || undefined,
    source: data.source,
    startDate: data.startDate.toISOString().split('T')[0],
    status: data.status,
    numberOfProjects: data.numberOfProjects ?? undefined,
    totalSpent: data.totalSpent ?? undefined,
    totalSpentCurrency: data.totalSpentCurrency ?? undefined,
    totalProfit: data.totalProfit ?? undefined,
    totalProfitCurrency: data.totalProfitCurrency ?? undefined,
    retainer: data.retainer ?? undefined,
    notes: data.notes || undefined,
  };
}

export async function getAllClients() {
  const res = await db.listRows({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.clients,
  });
  return res;
}

export async function getClientById(id: string) {
  const row = await db.getRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.clients,
    rowId: id,
  });
  return row as unknown as ModifiedClient;
}

export async function createClient(data: ClientFormValues) {
  const payload = toCamel(data);
  const created = await db.createRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.clients,
    data: payload,
    rowId: ID.unique(),
  });
  revalidatePath('/clients');
  return created;
}

export async function updateClient(
  id: string,
  data: Partial<ClientFormValues>
) {
  // Map only provided fields
  const mapped: Partial<Client> = {};
  if (data.name !== undefined) mapped.name = data.name;
  if (data.company !== undefined) mapped.company = data.company;
  if (data.contact !== undefined) mapped.contact = data.contact;
  if (data.email !== undefined) mapped.email = data.email;
  if (data.phone !== undefined) mapped.phone = data.phone;
  if (data.source !== undefined) mapped.source = data.source;
  if (data.startDate !== undefined)
    mapped.startDate = data.startDate.toISOString().split('T')[0];
  if (data.status !== undefined) mapped.status = data.status;
  if (data.numberOfProjects !== undefined)
    mapped.numberOfProjects = data.numberOfProjects;
  if (data.totalSpent !== undefined) mapped.totalSpent = data.totalSpent;
  if (data.totalSpentCurrency !== undefined)
    mapped.totalSpentCurrency = data.totalSpentCurrency;
  if (data.totalProfit !== undefined) mapped.totalProfit = data.totalProfit;
  if (data.totalProfitCurrency !== undefined)
    mapped.totalProfitCurrency = data.totalProfitCurrency;
  if (data.retainer !== undefined) mapped.retainer = data.retainer;
  if (data.notes !== undefined) mapped.notes = data.notes;

  const updated = await db.updateRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.clients,
    rowId: id,
    data: mapped,
  });
  revalidatePath('/clients');
  revalidatePath(`/clients/${id}`);
  return updated;
}

export async function deleteClient(id: string) {
  await db.deleteRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.clients,
    rowId: id,
  });
  revalidatePath('/clients');
  revalidatePath(`/clients/${id}`);
}

// Convenience helpers to parse FormData coming from client components
function parseClientForm(formData: FormData): Partial<Client> {
  const get = (k: string) => formData.get(k);
  const toNum = (v: FormDataEntryValue | null) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const toStr = (v: FormDataEntryValue | null) => {
    const s = (v ?? '').toString();
    return s.length ? s : undefined;
  };

  const startDate = toStr(get('startDate'));

  return {
    name: toStr(get('name'))!,
    company: toStr(get('company')),
    contact: toStr(get('contact'))!,
    email: toStr(get('email')),
    phone: toStr(get('phone')),
    source: toStr(get('source')) as Client['source'],
    startDate: startDate,
    status: (toStr(get('status')) as Client['status']) || 'Active',
    numberOfProjects: toNum(get('numberOfProjects')),
    totalSpent: toNum(get('totalSpent')),
    totalProfit: toNum(get('totalProfit')),
    retainer: toNum(get('retainer')),
    notes: toStr(get('notes')),
  };
}

export async function createClientAction(formData: FormData): Promise<Client> {
  const formDataObj = parseClientForm(formData);
  // Ensure all required fields are properly initialized
  const clientData: ClientFormValues = {
    ...formDataObj,
    name: formDataObj.name || '',
    contact: formDataObj.contact || '',
    phone: formDataObj.phone || '', // Ensure phone is provided
    source: formDataObj.source || 'Website',
    startDate: formDataObj.startDate
      ? new Date(formDataObj.startDate)
      : new Date(),
    status: formDataObj.status || 'Active',
    // Ensure other required fields have default values
    numberOfProjects: formDataObj.numberOfProjects ?? 0,
    totalSpent: formDataObj.totalSpent ?? 0,
    totalProfit: formDataObj.totalProfit ?? 0,
    retainer: formDataObj.retainer ?? 0,
  };

  const row = await createClient(clientData);

  // Transform the Appwrite row to match the Client type
  const client: Client = {
    id: row.$id,
    name: row.name,
    contact: row.contact,
    source: row.source,
    startDate: row.startDate,
    status: row.status,
    company: row.company,
    email: row.email,
    phone: row.phone,
    category: row.category,
    numberOfProjects: row.numberOfProjects,
    totalSpent: row.totalSpent,
    totalSpentCurrency: row.totalSpentCurrency as Currency,
    totalProfit: row.totalProfit,
    totalProfitCurrency: row.totalProfitCurrency as Currency,
    retainer: row.retainer,
    notes: row.notes,
    isHighValue: row.isHighValue,
  };

  revalidatePath('/clients');
  return client;
}

export async function updateClientAction(
  id: string,
  formData: FormData
): Promise<Client> {
  const mapped = parseClientForm(formData);
  const updated = (await db.updateRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.clients,
    rowId: id,
    data: mapped,
  })) as unknown as Client & { $id: string };
  revalidatePath('/clients');
  revalidatePath(`/clients/${id}`);
  return {
    id: updated.$id,
    name: updated.name,
    company: updated.company,
    contact: updated.contact,
    email: updated.email,
    phone: updated.phone,
    source: updated.source,
    startDate: updated.startDate,
    status: updated.status,
    numberOfProjects: updated.numberOfProjects,
    totalSpent: updated.totalSpent,
    totalSpentCurrency: updated.totalSpentCurrency,
    totalProfit: updated.totalProfit,
    totalProfitCurrency: updated.totalProfitCurrency,
    retainer: updated.retainer,
    notes: updated.notes,
  };
}

export async function updateClientNotesAction(id: string): Promise<Client> {
  // Fetch the full client to ensure we have all required fields
  const client = await getClientById(id);

  revalidatePath('/clients');
  revalidatePath(`/clients/${id}`);

  return {
    id: client.$id,
    name: client.name,
    company: client.company,
    contact: client.contact,
    email: client.email,
    phone: client.phone,
    source: client.source,
    startDate: client.startDate,
    status: client.status,
    numberOfProjects: client.numberOfProjects,
    totalSpent: client.totalSpent,
    totalSpentCurrency: client.totalSpentCurrency,
    totalProfit: client.totalProfit,
    totalProfitCurrency: client.totalProfitCurrency,
    retainer: client.retainer,
    notes: client.notes,
  };
}

export async function deleteClientAction(id: string) {
  await deleteClient(id);
}
