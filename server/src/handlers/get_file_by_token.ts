
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type GetFileByTokenInput, type FileRecord } from '../schema';
import { eq } from 'drizzle-orm';

export const getFileByToken = async (input: GetFileByTokenInput): Promise<FileRecord | null> => {
  try {
    // Query database for file with matching share_token
    const results = await db.select()
      .from(filesTable)
      .where(eq(filesTable.share_token, input.share_token))
      .execute();

    // Return file record if found, null if not found
    if (results.length === 0) {
      return null;
    }

    const file = results[0];
    
    // Return the file record with proper type conversion
    return {
      id: file.id,
      filename: file.filename,
      original_name: file.original_name,
      file_path: file.file_path,
      file_size: file.file_size, // bigint mode: 'number' handles conversion
      mime_type: file.mime_type,
      share_token: file.share_token,
      created_at: file.created_at
    };
  } catch (error) {
    console.error('Get file by token failed:', error);
    throw error;
  }
};
