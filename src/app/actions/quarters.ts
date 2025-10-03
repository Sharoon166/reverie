'use server';

import { db, APPWRITE_DB } from '@/lib/appwrite';
import { revalidatePath } from 'next/cache';
import { Quarter } from '@/types/quarter';
import { Query } from 'appwrite';

const QUARTERS_COLLECTION = 'quarters';

export async function updateQuarter(
    quarterId: string,
    updates: Partial<Quarter>
): Promise<Quarter> {
    try {
        if (!quarterId) {
            throw new Error('Quarter ID is required');
        }

        // Get existing quarter data
        const existingQuarter = await db.getRow(
            APPWRITE_DB.databaseId,
            QUARTERS_COLLECTION,
            quarterId,
        ) as unknown as Quarter;

        if (!existingQuarter) {
            throw new Error('Quarter not found');
        }

        // Validate quarter status transitions
        if (updates.status && updates.status !== existingQuarter.status) {
            if (existingQuarter.status === 'closed' && updates.status !== 'archived') {
                throw new Error('Cannot reopen a closed quarter. Only archive is allowed.');
            }
            if (existingQuarter.status === 'archived') {
                throw new Error('Cannot modify an archived quarter');
            }
        }

        // Prepare update data
        const now = new Date().toISOString();
        const updateData = {
            ...updates,
            $updatedAt: now,
        };

        // If closing the quarter, set closedDate
        if (updates.status === 'closed' && !existingQuarter.closedDate) {
            updateData.closedDate = now;
        }

        // Update the quarter in the database
        const updatedQuarter = await db.updateRow(
            APPWRITE_DB.databaseId,
            QUARTERS_COLLECTION,
            quarterId,
            updateData
        ) as unknown as Quarter;

        // Revalidate relevant paths
        revalidatePath('/dashboard');
        revalidatePath('/leads');
        revalidatePath(`/quarters/${quarterId}`);
        revalidatePath('/targets');

        return updatedQuarter;
    } catch (error) {
        console.error('Error updating quarter:', error);
        throw new Error(
            error instanceof Error ? error.message : 'Failed to update quarter'
        );
    }
}

export async function getCurrentQuarter(): Promise<Quarter | null> {
    try {
        // In a real implementation, you would fetch the current quarter from your database
        // This is a placeholder implementation
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3) + 1;

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 300));

        // In a real app, you would do something like:
        // const response = await db.listDocuments(
        //   'your_database_id',
        //   'quarters',
        //   [
        //     Query.equal('year', now.getFullYear()),
        //     Query.equal('quarter', quarter),
        //     Query.limit(1)
        //   ]
        // );
        // 
        // return response.documents[0] as Quarter;

        // For now, return a mock quarter
        return {
            $id: `q${quarter}-${now.getFullYear()}`,
            $createdAt: new Date(now.getFullYear(), (quarter - 1) * 3, 1).toISOString(),
            $updatedAt: new Date().toISOString(),
            quarterId: `q${quarter}-${now.getFullYear()}`,
            quarter,
            year: now.getFullYear(),
            status: 'open',
            proposalsSentTarget: 50, // Default value
            meetingsBookedTarget: 20, // Default value
        } as Quarter;
    } catch (error) {
        console.error('Error getting current quarter:', error);
        return null;
    }
}
