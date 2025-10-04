'use server';

import { APPWRITE_DB, db, ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { createQuarter } from '@/utils/quarterCreation';

// Utilities
function quarterRange(year: number, q: 1 | 2 | 3 | 4) {
  const startMonth = (q - 1) * 3; // 0-indexed month
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59, 999)); // last day of quarter
  const iso = (d: Date) => d.toISOString().split('.')[0] + 'Z'; // trim ms for consistency
  return { start, end, startISO: iso(start), endISO: iso(end) };
}
function monthsOfQuarter(year: number, q: 1 | 2 | 3 | 4) {
  const start = (q - 1) * 3 + 1; // 1..12
  const months: string[] = [];
  for (let i = 0; i < 3; i++) {
    const m = start + i;
    months.push(`${year}-${String(m).padStart(2, '0')}`);
  }
  return months;
}

export type QuarterlySummary = {
  id: string; // e.g., q1-2025
  name: string; // e.g., Q1-2025
  status: 'active' | 'closed' | 'archived';
  startDate: string; // ISO
  endDate: string; // ISO
  totalRevenue: number;
  totalExpenses: number;
  totalSalaries: number;
  netProfit: number;
  profitMargin: number;
  counts: {
    clients: number;
    newClients: number;
    leads: number;
    convertedLeads: number;
    invoices: number;
    paidInvoices: number;
  };
};

// Check if a quarter is closed
export async function isQuarterClosed(
  quarter: number,
  year: number
): Promise<boolean> {
  try {
    const quarterId = `q${quarter}-${year}`;
    const existingClosure = await db.listRows({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.quarters,
      queries: [
        Query.equal('quarterId', quarterId),
        Query.equal('status', 'closed'),
        Query.limit(1),
      ],
    });

    return existingClosure.rows && existingClosure.rows.length > 0;
  } catch (error) {
    console.error('Error checking quarter status:', error);
    return false; // If table doesn't exist or error, assume not closed
  }
}

// Get current quarter info
export async function getCurrentQuarterInfo() {
  const now = new Date();
  const quarter = (Math.floor(now.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  const year = now.getFullYear();
  return { quarter, year };
}

export async function getQuarterlySummaries(year?: number) {
  const now = new Date();
  const y = year ?? now.getFullYear();

  const quarters: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
  const results: QuarterlySummary[] = [];

  for (const q of quarters) {
    const { startISO, endISO, start, end } = quarterRange(y, q);
    const name = `Q${q}-${y}`;
    const id = `q${q}-${y}`;

    // Get expenses
    let totalExpenses = 0;
    try {
      const expensesRes = await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.expenses,
        queries: [
          Query.greaterThanEqual('date', startISO.slice(0, 10)),
          Query.lessThanEqual('date', endISO.slice(0, 10)),
          Query.limit(1000),
        ],
      });
      for (const row of expensesRes.rows) {
        totalExpenses += Number(row.amount || 0);
      }
    } catch (e) {
      console.warn('[reports] expenses query failed', e);
    }

    // Get salary payments
    let totalSalaries = 0;
    try {
      const months = monthsOfQuarter(y, q);
      const salaryRes = await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.salary_payments,
        queries: [Query.equal('month', months), Query.limit(1000)],
      });
      for (const row of salaryRes.rows) {
        totalSalaries += Number(row.netAmount ?? row.amount ?? 0);
      }
    } catch (e) {
      console.warn('[reports] salary payments query failed', e);
    }

    // Get invoices
    let totalRevenue = 0;
    let invoices = 0;
    let paidInvoices = 0;
    try {
      const invRes = await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.invoices,
        queries: [
          Query.greaterThanEqual('issueDate', startISO.slice(0, 10)),
          Query.lessThanEqual('issueDate', endISO.slice(0, 10)),
          Query.limit(1000),
        ],
      });
      invoices = invRes.total ?? invRes.rows.length;
      for (const row of invRes.rows) {
        const amt = Number(row.amount || 0);
        const status = (row.status || '').toString().toLowerCase();
        if (status === 'paid') {
          totalRevenue += amt;
          paidInvoices += 1;
        }
      }
    } catch (e) {
      console.warn('[reports] invoices query failed', e);
    }

    // Get clients
    let clients = 0;
    let newClients = 0;
    try {
      const clientsRes = await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.clients,
        queries: [Query.limit(1000)],
      });
      clients = clientsRes.total ?? clientsRes.rows.length;
      for (const row of clientsRes.rows) {
        const sd = row.startDate as string | undefined;
        if (sd && sd >= startISO.slice(0, 10) && sd <= endISO.slice(0, 10))
          newClients += 1;
      }
    } catch (e) {
      console.warn('[reports] clients query failed', e);
    }

    // Get leads
    let leads = 0;
    let convertedLeads = 0;
    try {
      const leadsRes = await db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.leads,
        queries: [Query.limit(1000)],
      });
      leads = leadsRes.total ?? leadsRes.rows.length;
      for (const row of leadsRes.rows) {
        const status = (row.status || '').toString().toLowerCase();
        if (status === 'converted') convertedLeads += 1;
      }
    } catch (e) {
      console.warn('[reports] leads query failed', e);
    }

    const netProfit = totalRevenue - totalExpenses - totalSalaries;
    const profitMargin =
      totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 1000) / 10 : 0;

    // Determine status
    let status: 'active' | 'closed' | 'archived' = 'archived';
    const nowTs = Date.now();

    // First check if quarter is explicitly closed in the database
    const isClosed = await isQuarterClosed(q, y);
    if (isClosed) {
      status = 'closed';
    } else if (nowTs < start.getTime()) {
      status = 'archived';
    } else if (nowTs > end.getTime()) {
      status = 'closed';
    } else {
      status = 'active';
    }

    results.push({
      id,
      name,
      status,
      startDate: startISO,
      endDate: endISO,
      totalRevenue,
      totalExpenses,
      totalSalaries,
      netProfit,
      profitMargin,
      counts: {
        clients,
        newClients,
        leads,
        convertedLeads,
        invoices,
        paidInvoices,
      },
    });
  }

  return results;
}

// PDF generation has been moved to the frontend using jsPDF

/**
 * Export quarterly data as a ZIP file
 */
export async function exportQuarterlyData(quarterId: string): Promise<Buffer> {
  try {
    // This is a placeholder implementation
    // In a real application, you would collect all relevant data for the quarter
    // and create a ZIP file with the data in a structured format (e.g., JSON, CSV)

    // For now, we'll return a simple ZIP buffer with a readme file
    const zipContent =
      `Quarterly Data Export: ${quarterId}\n\n` +
      'This is a placeholder for the data export.\n' +
      'In a real implementation, this would be a ZIP file containing:\n' +
      '- financial_data.csv\n' +
      '- client_list.json\n' +
      '- invoice_summary.xlsx\n' +
      '- other_relevant_data/\n';

    // In a real implementation, you would use a ZIP library like jszip or archiver
    // to create a proper ZIP file with the actual data

    // For now, return a simple text buffer
    return Buffer.from(zipContent, 'utf-8');
  } catch (error) {
    console.error('Error exporting quarterly data:', error);
    throw new Error('Failed to export quarterly data');
  }
}

export async function closeQuarter(
  quarterId: string,
  withdrawalAmount: number = 0
) {
  // Parse quarter ID
  const [qPart, yearPart] = quarterId.split('-');
  const quarter = parseInt(qPart.replace('q', '')) as 1 | 2 | 3 | 4;
  const year = parseInt(yearPart);

  // Get quarter data
  const summaries = await getQuarterlySummaries(year);
  const quarterData = summaries.find((s) => s.id === quarterId);

  if (!quarterData) {
    throw new Error(`Quarter ${quarterId} not found`);
  }

  if (quarterData.status !== 'active') {
    throw new Error(`Quarter ${quarterId} is not active and cannot be closed`);
  }

  const cashOnHand =
    quarterData.totalRevenue -
    quarterData.totalExpenses -
    quarterData.totalSalaries;

  if (withdrawalAmount > cashOnHand) {
    throw new Error(
      `Withdrawal amount (${withdrawalAmount}) cannot exceed cash on hand (${cashOnHand})`
    );
  }

  try {
    // 1. Lock all records for the quarter
    const { startISO, endISO } = quarterRange(year, quarter);

    // Get all records that need to be locked
    const [leads, clients, invoices, expenses] = await Promise.all([
      // Get leads to archive
      db.listRows({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.leads,
        queries: [
          Query.greaterThanEqual('$createdAt', startISO),
          Query.lessThanEqual('$createdAt', endISO),
        ],
      }),
      // Get clients to deactivate
      db.listRows(APPWRITE_DB.databaseId, 'clients', [
        Query.greaterThanEqual('startDate', startISO.slice(0, 10)),
        Query.lessThanEqual('startDate', endISO.slice(0, 10)),
      ]),
      // Get invoices to close
      db.listRows(APPWRITE_DB.databaseId, 'invoices', [
        Query.greaterThanEqual('issueDate', startISO.slice(0, 10)),
        Query.lessThanEqual('issueDate', endISO.slice(0, 10)),
      ]),
      // Get expenses to lock
      db.listRows(APPWRITE_DB.databaseId, 'expenses', [
        Query.greaterThanEqual('date', startISO.slice(0, 10)),
        Query.lessThanEqual('date', endISO.slice(0, 10)),
      ]),
    ]);

    // Update all records in parallel
    await Promise.all([
      // Update leads
      ...leads.rows.map((doc) =>
        db.updateRow(APPWRITE_DB.databaseId, 'leads', doc.$id, {
          status: 'archived',
        })
      ),
      // Update clients
      ...clients.rows.map((doc) =>
        db.updateRow(APPWRITE_DB.databaseId, 'clients', doc.$id, {
          status: 'inactive',
        })
      ),
      // Update invoices
      ...invoices.rows.map((doc) =>
        db.updateRow(APPWRITE_DB.databaseId, 'invoices', doc.$id, {
          status: 'closed',
        })
      ),
      // Update expenses
      ...expenses.rows.map((doc) =>
        db.updateRow(APPWRITE_DB.databaseId, 'expenses', doc.$id, {
          locked: true,
        })
      ),
    ]);

    // 4. Update or create quarter closure record
    const summaryText =
      `Clients: ${quarterData.counts.clients} (${quarterData.counts.newClients} new), ` +
      `Leads: ${quarterData.counts.leads} (${quarterData.counts.convertedLeads} converted), ` +
      `Invoices: ${quarterData.counts.invoices} (${quarterData.counts.paidInvoices} paid), ` +
      `Revenue: PKR ${quarterData.totalRevenue}, ` +
      `Expenses: PKR ${quarterData.totalExpenses}, ` +
      `Salaries: PKR ${quarterData.totalSalaries}, ` +
      `Profit: PKR ${quarterData.netProfit}`;

    // First get or create the quarter to ensure it exists
    const quarterRecord = await createQuarter(year, quarter);
    
    // Update the quarter with closure details
    const quarterDataToUpdate = {
      status: 'closed',
      closedDate: new Date().toISOString(),
      totalRevenue: quarterData.totalRevenue,
      totalExpenses: quarterData.totalExpenses,
      totalSalaries: quarterData.totalSalaries,
      netProfit: quarterData.netProfit,
      profitMargin: quarterData.profitMargin,
      cashOnHand,
      withdrawalAmount,
      remainingBalance: cashOnHand - withdrawalAmount,
      closedBy: 'system',
      summary: summaryText,
      $updatedAt: new Date().toISOString(),
    };

    // Update the existing quarter record
    const quarterClosure = await db.updateRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.quarters,
      rowId: quarterRecord.$id,
      data: quarterDataToUpdate
    });

    // 5. If there's a remaining balance, create a starting balance for next quarter
    const remainingBalance = cashOnHand - withdrawalAmount;
    if (remainingBalance > 0) {
      // const nextQuarter = quarter === 4 ? 1 : ((quarter + 1) as 1 | 2 | 3 | 4);
      // const nextYear = quarter === 4 ? year + 1 : year;
      // const nextQuarterId = `q${nextQuarter}-${nextYear}`;

      await db.createRow({
        databaseId: APPWRITE_DB.databaseId,
        tableId: APPWRITE_DB.tables.expenses,
        data: {
          date: new Date().toISOString().split('T')[0],
          description: `Opening balance from Q${quarter}-${year}`,
          amount: remainingBalance,
          category: 'opening-balance',
          paymentMethod: 'bank-transfer',
          status: 'completed',
          notes: `Carried forward from Q${quarter}-${year}`,
          locked: true,
        },
        rowId: ID.unique(),
      });
    }

    return {
      success: true,
      quarterId,
      closedDate: new Date().toISOString(),
      withdrawalAmount,
      remainingBalance,
      reportGenerated: true,
      quarterClosureId: quarterClosure.$id,
    };
  } catch (error) {
    console.error('Error closing quarter:', error);
    throw new Error(
      `Failed to close quarter: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
