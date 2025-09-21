import { NextRequest, NextResponse } from 'next/server';
import { APPWRITE_DB, db } from '@/lib/appwrite';

// GET /api/clients/[id]
export async function GET(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = await Promise.resolve(context.params);
    const row = await db.getRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.clients,
      rowId: params.id,
    });
    return NextResponse.json(row);
  } catch (error: unknown) {
    console.error('GET /api/clients/[id] error:', error);
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
}

// PATCH /api/clients/[id]
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = await Promise.resolve(context.params);
    const data = await request.json();
    const updated = await db.updateRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.clients,
      rowId: params.id,
      data,
    });
    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('PATCH /api/clients/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE /api/clients/[id]
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const params = await Promise.resolve(context.params);
    await db.deleteRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.clients,
      rowId: params.id,
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE /api/clients/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
