import { NextRequest, NextResponse } from 'next/server';
import type { Client } from '@/types/client';
import { getAllClients, createClient } from '@/actions/clients';
import { ClientFormValues } from '@/components/forms';

// GET /api/clients - list clients (limit 100 for now)
export async function GET() {
  try {
    const res = await getAllClients();
    return NextResponse.json({ rows: res?.rows ?? [] });
  } catch (error: unknown) {
    console.warn('GET /api/clients error, returning empty list:', error);
    return NextResponse.json({ rows: [] });
  }
}

// POST /api/clients - create client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data: Partial<Client> = body;
    if (!data.name || !data.contact || !data.source || !data.startDate || !data.status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Map to ClientFormValues shape with correct field names
    const formShape = {
      name: data.name,
      company: data.company ?? '',
      contact: data.contact!,
      email: data.email ?? '',
      phone: data.phone ?? '',
      source: data.source,
      startDate: new Date(String(data.startDate)),
      status: data.status,
      numberOfProjects: data.numberOfProjects ?? undefined,
      totalSpent: data.totalSpent ?? undefined,
      totalSpentCurrency: data.totalSpentCurrency,
      totalProfit: data.totalProfit ?? undefined,
      totalProfitCurrency: data.totalProfitCurrency,
      retainer: data.retainer ?? undefined,
      notes: data.notes ?? '',
    } as ClientFormValues;

    const created = await createClient(formShape);
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/clients error:', error);
    const status = error instanceof Error && error.message.includes('401') ? 401 : 500;
    return NextResponse.json({ error: 'Failed to create client' }, { status });
  }
}
