'use server'
import { APPWRITE_DB, db, ID } from '@/lib/appwrite';
import type { LeadFormValues } from '@/components/forms';
import { revalidatePath } from 'next/cache';
import { Query } from 'appwrite';
import type { Client, ClientSource, Currency } from '@/types/client';
import type { LeadSource, LeadStatus, LeadPriority } from '@/types/lead';

type modifiedLead = {
    $createdAt: string;
    $updatedAt: string;
    $databaseId: string;
    $tableId: string;
    $id: string;  
}

// ---- Server Actions for form submissions from client components ----
export async function getLeadById(id: string) {
    return getLeadsById(id);
}

type LeadPayload = {
    name?: string;
    company?: string;
    contact?: string;
    email?: string;
    phone?: string;
    source?: LeadSource;
    status?: LeadStatus;
    priority?: LeadPriority;
    estimatedValue?: number;
    currency?: Currency;
    nextFollowup?: string;
    lastContact?: string;
    assignedTo?: string;
    notes?: string;
};

function parseLeadForm(formData: FormData): LeadPayload {
    const get = (k: string) => formData.get(k);
    const toNum = (v: FormDataEntryValue | null) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    };
    const toStr = (v: FormDataEntryValue | null) => {
        const s = (v ?? '').toString();
        return s.length ? s : undefined;
    };
    
    // Create a new FormData to filter out unwanted fields
    const filteredFormData = new FormData();
    const allowedFields = new Set([
        'name', 'company', 'contact', 'email', 'phone', 'source',
        'status', 'priority', 'estimatedValue', 'currency',
        'nextFollowup', 'lastContact', 'assignedTo', 'notes'
    ]);
    
    // Only include allowed fields
    for (const [key, value] of formData.entries()) {
        if (allowedFields.has(key)) {
            filteredFormData.append(key, value);
        }
    }
    
    const payload: LeadPayload = {};
    // Basic
    if (get('name')) payload.name = toStr(get('name'));
    if (get('company')) payload.company = toStr(get('company'));
    if (get('contact')) payload.contact = toStr(get('contact'));
    if (get('email')) payload.email = toStr(get('email'));
    if (get('phone')) payload.phone = toStr(get('phone'));
    const src = toStr(get('source'));
    if (src) payload.source = src as LeadSource;
    const st = toStr(get('status'));
    if (st) payload.status = st as LeadStatus;
    const pr = toStr(get('priority'));
    if (pr) payload.priority = pr as LeadPriority;
    // Numeric and enum
    if (get('estimatedValue')) payload.estimatedValue = toNum(get('estimatedValue'));
    const cur = toStr(get('currency'));
    if (cur) payload.currency = cur as Currency;
    // Dates and assigned
    if (get('nextFollowup')) payload.nextFollowup = toStr(get('nextFollowup'));
    if (get('lastContact')) payload.lastContact = toStr(get('lastContact'));
    if (get('assignedTo')) payload.assignedTo = toStr(get('assignedTo'));
    if (get('notes')) payload.notes = toStr(get('notes'));
    
    return payload;
}

export async function createLeadAction(formData: FormData) {
    const payload = parseLeadForm(formData);
    const created = await db.createRow({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.leads,
        data: payload,
        rowId: ID.unique(),
    });
    revalidatePath('/leads');
    return created;
}

export async function updateLeadAction(id: string, formData: FormData) {
    const mapped = parseLeadForm(formData);
    const updated = await db.updateRow({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.leads,
        rowId: id,
        data: mapped,
    });
    revalidatePath('/leads');
    revalidatePath(`/leads/${id}`);
    return updated;
}

export async function deleteLeadAction(id: string) {
    await db.deleteRow({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.leads,
        rowId: id,
    });
    revalidatePath('/leads');
    revalidatePath(`/leads/${id}`);
}

// Create a client from a lead and mark the lead as converted
export async function convertLeadToClientAction(id: string) {
    try {
        // Fetch the lead
        const lead = await db.getRow({
            databaseId: APPWRITE_DB.databaseId,
            tableId: APPWRITE_DB.tables.leads,
            rowId: id,
        });
        if (!lead) throw new Error('Lead not found');

        // Map to client payload (camelCase client schema)
        const clientPayload: Omit<Client, 'id' | '$id'> = {
            name: lead.name,
            contact: lead.contact ?? lead.name,
            email: lead.email || undefined,
            phone: lead.phone || undefined,
            company: lead.company || undefined,
            source: (lead.source as ClientSource) || 'Website',
            status: 'Active',
            startDate: new Date().toISOString().split('T')[0],
            notes: `Converted from lead ${lead.name} (${id})`,
        };

        // Create the client
        const createdClient = await db.createRow({
            databaseId: APPWRITE_DB.databaseId,
            tableId: APPWRITE_DB.tables.clients,
            data: clientPayload,
            rowId: ID.unique(),
        });

        // Update lead status to converted
        await db.updateRow({
            databaseId: APPWRITE_DB.databaseId,
            tableId: APPWRITE_DB.tables.leads,
            rowId: id,
            data: { status: 'converted' },
        });

        revalidatePath('/clients');
        revalidatePath('/leads');
        revalidatePath(`/leads/${id}`);
        return createdClient;
    } catch (error) {
        console.error('Error converting lead to client:', error);
        throw new Error('Failed to convert lead to client');
    }
}

export async function getAllLeads() {
    const res = await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.leads,
        queries: [Query.limit(25)],
    });
    return res;
}

export async function getLeadsById(id:string) {
    const res = await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.leads,
        queries: [Query.equal('$id', id)],
    });
    return res.rows.at(0) as unknown as modifiedLead;
}

export async function createLead(lead:LeadFormValues) {
    const payload = lead;
    const created = await db.createRow({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.leads,
        data: payload,
        rowId: ID.unique(),
    });
    revalidatePath('/leads');
    return created;
}
export async function deleteLead(id:string) {
    await db.deleteRow({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.leads,
        rowId: id,
    });
    revalidatePath('/leads');
    revalidatePath(`/leads/${id}`)
}

export async function updateLead(id:string,lead:LeadFormValues) {
    const payload = lead;
    await db.updateRow({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.leads,
        rowId: id,
        data: payload,
    });
    revalidatePath('/leads');
    revalidatePath(`/leads/${id}`)
}

export async function convertLeadToClient(id:string) {
    await convertLeadToClientAction(id);
    return true;
}