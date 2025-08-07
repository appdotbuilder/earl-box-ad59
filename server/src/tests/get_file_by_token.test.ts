
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type GetFileByTokenInput, type UploadFileInput } from '../schema';
import { getFileByToken } from '../handlers/get_file_by_token';

// Test file data
const testFileData: UploadFileInput = {
  filename: 'test-image.jpg',
  original_name: 'My Test Image.jpg',
  file_path: '/uploads/test-image.jpg',
  file_size: 1024000, // 1MB
  mime_type: 'image/jpeg',
  share_token: 'test-token-123456789'
};

describe('getFileByToken', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return file record when token exists', async () => {
    // Insert test file
    const insertResult = await db.insert(filesTable)
      .values(testFileData)
      .returning()
      .execute();

    const insertedFile = insertResult[0];

    // Test the handler
    const input: GetFileByTokenInput = {
      share_token: testFileData.share_token
    };

    const result = await getFileByToken(input);

    // Verify result matches inserted file
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedFile.id);
    expect(result!.filename).toEqual('test-image.jpg');
    expect(result!.original_name).toEqual('My Test Image.jpg');
    expect(result!.file_path).toEqual('/uploads/test-image.jpg');
    expect(result!.file_size).toEqual(1024000);
    expect(result!.mime_type).toEqual('image/jpeg');
    expect(result!.share_token).toEqual('test-token-123456789');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when token does not exist', async () => {
    // Test with non-existent token
    const input: GetFileByTokenInput = {
      share_token: 'non-existent-token'
    };

    const result = await getFileByToken(input);

    expect(result).toBeNull();
  });

  it('should handle different file types correctly', async () => {
    // Insert video file
    const videoFileData = {
      ...testFileData,
      filename: 'test-video.mp4',
      original_name: 'My Test Video.mp4',
      file_path: '/uploads/test-video.mp4',
      file_size: 50000000, // 50MB
      mime_type: 'video/mp4',
      share_token: 'video-token-987654321'
    };

    await db.insert(filesTable)
      .values(videoFileData)
      .returning()
      .execute();

    // Test retrieval
    const input: GetFileByTokenInput = {
      share_token: 'video-token-987654321'
    };

    const result = await getFileByToken(input);

    expect(result).not.toBeNull();
    expect(result!.filename).toEqual('test-video.mp4');
    expect(result!.mime_type).toEqual('video/mp4');
    expect(result!.file_size).toEqual(50000000);
    expect(typeof result!.file_size).toEqual('number');
  });

  it('should handle large file sizes correctly', async () => {
    // Test with maximum allowed file size
    const largeFileData = {
      ...testFileData,
      file_size: 200 * 1024 * 1024, // 200MB max
      share_token: 'large-file-token'
    };

    await db.insert(filesTable)
      .values(largeFileData)
      .returning()
      .execute();

    const input: GetFileByTokenInput = {
      share_token: 'large-file-token'
    };

    const result = await getFileByToken(input);

    expect(result).not.toBeNull();
    expect(result!.file_size).toEqual(200 * 1024 * 1024);
    expect(typeof result!.file_size).toEqual('number');
  });
});
