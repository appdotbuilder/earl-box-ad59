
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { getUploadStats } from '../handlers/get_upload_stats';

describe('getUploadStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats when no files exist', async () => {
    const result = await getUploadStats();

    expect(result.total_uploads).toEqual(0);
    expect(result.total_size).toEqual(0);
  });

  it('should return correct stats for single file', async () => {
    // Insert a test file
    await db.insert(filesTable)
      .values({
        filename: 'test1.jpg',
        original_name: 'test1.jpg',
        file_path: '/uploads/test1.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg',
        share_token: 'token123'
      })
      .execute();

    const result = await getUploadStats();

    expect(result.total_uploads).toEqual(1);
    expect(result.total_size).toEqual(1024);
  });

  it('should return correct stats for multiple files', async () => {
    // Insert multiple test files
    await db.insert(filesTable)
      .values([
        {
          filename: 'test1.jpg',
          original_name: 'test1.jpg',
          file_path: '/uploads/test1.jpg',
          file_size: 1024,
          mime_type: 'image/jpeg',
          share_token: 'token123'
        },
        {
          filename: 'test2.mp4',
          original_name: 'test2.mp4',
          file_path: '/uploads/test2.mp4',
          file_size: 2048,
          mime_type: 'video/mp4',
          share_token: 'token456'
        },
        {
          filename: 'test3.png',
          original_name: 'test3.png',
          file_path: '/uploads/test3.png',
          file_size: 512,
          mime_type: 'image/png',
          share_token: 'token789'
        }
      ])
      .execute();

    const result = await getUploadStats();

    expect(result.total_uploads).toEqual(3);
    expect(result.total_size).toEqual(3584); // 1024 + 2048 + 512
  });

  it('should handle large file sizes correctly', async () => {
    // Insert file with large size (approaching bigint range)
    const largeSize = 100 * 1024 * 1024; // 100MB
    
    await db.insert(filesTable)
      .values({
        filename: 'large_video.mp4',
        original_name: 'large_video.mp4',
        file_path: '/uploads/large_video.mp4',
        file_size: largeSize,
        mime_type: 'video/mp4',
        share_token: 'large_token'
      })
      .execute();

    const result = await getUploadStats();

    expect(result.total_uploads).toEqual(1);
    expect(result.total_size).toEqual(largeSize);
    expect(typeof result.total_size).toEqual('number');
  });
});
