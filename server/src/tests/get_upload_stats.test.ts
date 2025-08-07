
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type UploadFileInput } from '../schema';
import { getUploadStats } from '../handlers/get_upload_stats';

// Test file data
const testFile1: Omit<UploadFileInput, 'share_token'> = {
  filename: 'test1.jpg',
  original_name: 'Test Image 1.jpg',
  file_path: '/uploads/test1.jpg',
  file_size: 1024000, // 1MB
  mime_type: 'image/jpeg'
};

const testFile2: Omit<UploadFileInput, 'share_token'> = {
  filename: 'test2.mp4',
  original_name: 'Test Video.mp4',
  file_path: '/uploads/test2.mp4',
  file_size: 5242880, // 5MB
  mime_type: 'video/mp4'
};

describe('getUploadStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats when no files exist', async () => {
    const stats = await getUploadStats();

    expect(stats.total_uploads).toEqual(0);
    expect(stats.total_size).toEqual(0);
  });

  it('should return correct stats for single file', async () => {
    // Insert test file
    await db.insert(filesTable).values({
      ...testFile1,
      share_token: 'test-token-1'
    }).execute();

    const stats = await getUploadStats();

    expect(stats.total_uploads).toEqual(1);
    expect(stats.total_size).toEqual(1024000);
  });

  it('should return correct stats for multiple files', async () => {
    // Insert multiple test files
    await db.insert(filesTable).values([
      {
        ...testFile1,
        share_token: 'test-token-1'
      },
      {
        ...testFile2,
        share_token: 'test-token-2'
      }
    ]).execute();

    const stats = await getUploadStats();

    expect(stats.total_uploads).toEqual(2);
    expect(stats.total_size).toEqual(1024000 + 5242880); // Sum of both file sizes
  });

  it('should handle large file sizes correctly', async () => {
    const largeFile = {
      filename: 'large.mp4',
      original_name: 'Large Video.mp4',
      file_path: '/uploads/large.mp4',
      file_size: 100 * 1024 * 1024, // 100MB
      mime_type: 'video/mp4',
      share_token: 'large-token'
    };

    await db.insert(filesTable).values(largeFile).execute();

    const stats = await getUploadStats();

    expect(stats.total_uploads).toEqual(1);
    expect(stats.total_size).toEqual(100 * 1024 * 1024);
    expect(typeof stats.total_size).toBe('number');
  });
});
