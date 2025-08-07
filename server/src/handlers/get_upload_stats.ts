
import { db } from '../db';
import { filesTable } from '../db/schema';
import { count, sum } from 'drizzle-orm';
import { type UploadStats } from '../schema';

export const getUploadStats = async (): Promise<UploadStats> => {
  try {
    // Query to get count of files and sum of file sizes
    const result = await db.select({
      total_uploads: count(filesTable.id),
      total_size: sum(filesTable.file_size)
    })
    .from(filesTable)
    .execute();

    const stats = result[0];
    
    return {
      total_uploads: stats.total_uploads,
      total_size: Number(stats.total_size) || 0 // Convert bigint sum to number, default to 0 if null
    };
  } catch (error) {
    console.error('Failed to get upload stats:', error);
    throw error;
  }
};
