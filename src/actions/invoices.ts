'use server';

import { APPWRITE_DB, db, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import type { InvoiceFormValues } from '@/components/forms/InvoiceForm';
import { Invoice, InvoiceStatus, ServiceType, Currency } from '@/types';

export type InvoiceRow = {
  $id: string;
  id?: string;
  clientId: string;
  clientName: string;
  companyName?: string;
  invoiceNumber: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  serviceType: string;
  description?: string;
  amount: number;
  currency: string;
  status: string;
  notes?: string;
  paidDate?: string; // YYYY-MM-DD
  quarter?: string;
};

function toCamel(row): InvoiceRow {
  // Appwrite returns the ID in the $id field
  const id = row.$id || row.id || '';

  return {
    $id: id,
    id: id,
    clientId: row.clientId || '',
    clientName: row.clientName || '',
    companyName: row.companyName || undefined,
    invoiceNumber: row.invoiceNumber || '',
    issueDate: row.issueDate || '',
    dueDate: row.dueDate || '',
    serviceType: row.serviceType || '',
    description: row.description || undefined,
    amount: Number(row.amount || 0),
    currency: row.currency || 'USD',
    status: row.status || 'Draft',
    notes: row.notes || undefined,
    paidDate: row.paidDate || undefined,
  };
}

export async function getAllInvoices() {
  const res = await db.listRows({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.invoices,
    queries: [Query.limit(100)],
  });
  return (res.rows as unknown as Invoice[]).map(toCamel);
}

export async function getInvoiceById(id: string): Promise<Invoice> {
  const row = await db.getRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.invoices,
    rowId: id,
  });

  const invoiceData = toCamel(row as unknown as Invoice);

  // Convert to Invoice type with all required fields
  return {
    id: invoiceData.$id || invoiceData.id || '',
    clientId: invoiceData.clientId,
    clientName: invoiceData.clientName,
    companyName: invoiceData.companyName,
    invoiceNumber: invoiceData.invoiceNumber,
    issueDate: invoiceData.issueDate,
    dueDate: invoiceData.dueDate,
    serviceType: invoiceData.serviceType as ServiceType,
    description: invoiceData.description,
    amount: invoiceData.amount,
    currency: invoiceData.currency as Currency,
    status: invoiceData.status as InvoiceStatus,
    notes: invoiceData.notes,
    paidDate: invoiceData.paidDate,
    quarter: invoiceData.quarter || '',
    $id: invoiceData.$id || invoiceData.id || '',
  } as Invoice;
}

function mapFormToRow(data: InvoiceFormValues) {
  // InvoiceFormValues currently uses snake_case field names
  return {
    clientId: data.client_id,
    clientName: data.client_name,
    companyName: data.company_name || undefined,
    invoiceNumber: data.invoice_number,
    issueDate: data.issue_date.toISOString().split('T')[0],
    dueDate: data.due_date.toISOString().split('T')[0],
    serviceType: data.service_type,
    description: data.description || undefined,
    amount: Number(data.amount),
    currency: data.currency,
    status: data.status,
    notes: data.notes || undefined,
  } as const;
}

export async function createInvoice(data: InvoiceFormValues) {
  const payload = mapFormToRow(data);
  const created = await db.createRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.invoices,
    data: payload,
    rowId: ID.unique(),
  });
  return toCamel(created as unknown as Invoice);
}

export async function updateInvoice(id: string, data: InvoiceFormValues) {
  const payload = mapFormToRow(data);
  const updated = await db.updateRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.invoices,
    rowId: id,
    data: payload,
  });
  return toCamel(updated as unknown as Invoice);
}

export async function deleteInvoice(id: string) {
  await db.deleteRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.invoices,
    rowId: id,
  });
  return true;
}

export async function markInvoicePaid(id: string) {
  const today = new Date().toISOString().split('T')[0];
  const updated = await db.updateRow({
    databaseId: APPWRITE_DB.databaseId,
    tableId: APPWRITE_DB.tables.invoices,
    rowId: id,
    data: { status: 'Paid', paidDate: today },
  });
  return toCamel(updated as unknown as Invoice);
}
