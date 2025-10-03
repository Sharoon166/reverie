'use server';

import { APPWRITE_DB, db, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import type { AttendanceRecord } from '@/types';

export async function markAttendance(
  employeeId: string,
  attendance: AttendanceRecord
) {
  try {
    // 1. Check if attendance already exists for this employee & date
    const existing = await db.listRows({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.attendance,
      queries: [
        Query.equal('employee', employeeId),
        Query.equal('date', attendance.date),
      ],
    });

    if (existing.total > 0) {
      // Update existing
      const existingRow = existing.rows[0];
      const updated = await db.updateRow({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.attendance,
        rowId: existingRow.$id,
        data: { ...attendance, employee: employeeId },
      });

      return updated as unknown as AttendanceRecord;
    }

    // Create new
    const att = await db.createRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.attendance,
      rowId: ID.unique(),
      data: { ...attendance, employee: employeeId },
    });

    return att as unknown as AttendanceRecord;
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === 'Unique constraint violation'
    ) {
      // Unique constraint violation — fetch and update instead
      const existing = await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.attendance,
        queries: [
          Query.equal('employee', employeeId),
          Query.equal('date', attendance.date),
        ],
      });

      if (existing.total > 0) {
        const existingRow = existing.rows[0];
        const updated = await db.updateRow({
          databaseId: APPWRITE_DB.databaseId,
          tableId: APPWRITE_DB.tables.attendance,
          rowId: existingRow.$id,
          data: { ...attendance, employee: employeeId },
        });

        return updated as unknown as AttendanceRecord;
      }
    }

    console.error('Error marking attendance:', error);
    throw error;
  }
}

export async function getAttendance(employeeId: string) {
  try {
    const records = await db.listRows({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.attendance,
      queries: [
        Query.equal('employee', employeeId), // filter by employee
        Query.orderDesc('date'), // optional: newest first
      ],
    });

    return records.rows as unknown as AttendanceRecord[];
  } catch (error: unknown) {
    console.error('Error fetching attendance:', error);
    throw error;
  }
}
