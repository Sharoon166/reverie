'use server';

import { Quarter } from '@/types/quarter';
import { db, APPWRITE_DB } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';

export async function createQuarter(year: number, quarter: 1 | 2 | 3 | 4): Promise<Quarter> {
  const quarterId = `q${quarter}-${year}`;
  const quarterName = `Q${quarter}`;
  const now = new Date().toISOString();
  
  // Create quarter object with only the specified fields
  const newQuarter = {
    $id: '', // Will be set after creation
    quarterId,
    quarter, 
    year,
    status: 'open' as const,
    closedDate: null,
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    cashOnHand: 0,
    withdrawalAmount: 0,
    remainingBalance: 0,
    closedBy: null,
    summary: null,
    reportGenerated: false,
    totalSalaries: 0,
    closed: false,
    revenueTarget: null,
    expenseTarget: null,
    profitTarget: null,
    retainerRevenueTarget: null,
    quarterlyRevenueCollectionTarget: null,
    quarterlyExpenseTarget: null,
    totalLeadsTarget: null,
    conversionRateTarget: null,
    proposalsSentTarget: null,
    meetingsBookedTarget: null,
    partnershipOutreachTarget: null,
    clientAcquisitionTarget: null,
    highValueClientsTarget: null,
    totalSalariesTarget: null,
    employeesVsSalariesTarget: null,
    accountsReceivableTarget: null,
    $createdAt: now,
    $updatedAt: now
  };
  
  try {
    // Check if quarter already exists
    const existingQuarter = await db.listRows({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.quarters,
      queries: [
        Query.equal('quarterId', quarterId),
        Query.limit(1)
      ]
    });

    if (existingQuarter.rows && existingQuarter.rows.length > 0) {
      return existingQuarter.rows[0] as unknown as Quarter;
    }

    // Create new quarter in the database
    const createdQuarter = await db.createRow({
      databaseId: APPWRITE_DB.databaseId,
      tableId: APPWRITE_DB.tables.quarters,
      rowId: ID.unique(),
      data: newQuarter
    });

    // Return the created quarter with server-generated fields
    return {
      ...newQuarter,
      $id: createdQuarter.$id,
      $createdAt: createdQuarter.$createdAt,
      $updatedAt: createdQuarter.$updatedAt
    } as Quarter;
  } catch (error) {
    console.error('Error creating quarter:', error);
    throw new Error('Failed to create quarter');
  }
}

export async function getOrCreateCurrentQuarter(): Promise<Quarter> {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1 as 1 | 2 | 3 | 4;
  const currentYear = now.getFullYear();
  
  try {
    return await createQuarter(currentYear, currentQuarter);
  } catch (error) {
    console.error('Error in getOrCreateCurrentQuarter:', error);
    throw new Error('Failed to get or create current quarter');
  }
}
