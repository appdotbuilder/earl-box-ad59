
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type UploadFileInput, type FileRecord } from '../schema';

export const uploadFile = async (input: UploadFileInput): Promise<FileRecord> => {
  try {
    // Insert file record
    const result = await db.insert(filesTable)
      .values({
        filename: input.filename,
        original_name: input.original_name,
        file_path: input.file_path,
        file_size: input.file_size,
        mime_type: input.mime_type,
        share_token: input.share_token
      })
      .returning()
      .execute();

    const fileRecord = result[0];
    return fileRecord;
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};
