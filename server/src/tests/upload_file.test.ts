
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type UploadFileInput } from '../schema';
import { uploadFile } from '../handlers/upload_file';
import { eq } from 'drizzle-orm';

// Test input for image file
const testImageInput: UploadFileInput = {
  filename: 'test-image.jpg',
  original_name: 'My Photo.jpg',
  file_path: '/uploads/2024/test-image.jpg',
  file_size: 1024000, // 1MB
  mime_type: 'image/jpeg',
  share_token: 'abc123xyz789'
};

// Test input for video file
const testVideoInput: UploadFileInput = {
  filename: 'test-video.mp4',
  original_name: 'My Video.mp4',
  file_path: '/uploads/2024/test-video.mp4',
  file_size: 50 * 1024 * 1024, // 50MB
  mime_type: 'video/mp4',
  share_token: 'video123token'
};

describe('uploadFile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should upload an image file', async () => {
    const result = await uploadFile(testImageInput);

    // Basic field validation
    expect(result.filename).toEqual('test-image.jpg');
    expect(result.original_name).toEqual('My Photo.jpg');
    expect(result.file_path).toEqual('/uploads/2024/test-image.jpg');
    expect(result.file_size).toEqual(1024000);
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.share_token).toEqual('abc123xyz789');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should upload a video file', async () => {
    const result = await uploadFile(testVideoInput);

    // Basic field validation
    expect(result.filename).toEqual('test-video.mp4');
    expect(result.original_name).toEqual('My Video.mp4');
    expect(result.file_size).toEqual(50 * 1024 * 1024);
    expect(result.mime_type).toEqual('video/mp4');
    expect(result.share_token).toEqual('video123token');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save file metadata to database', async () => {
    const result = await uploadFile(testImageInput);

    // Query using proper drizzle syntax
    const files = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, result.id))
      .execute();

    expect(files).toHaveLength(1);
    expect(files[0].filename).toEqual('test-image.jpg');
    expect(files[0].original_name).toEqual('My Photo.jpg');
    expect(files[0].file_path).toEqual('/uploads/2024/test-image.jpg');
    expect(files[0].file_size).toEqual(1024000);
    expect(files[0].mime_type).toEqual('image/jpeg');
    expect(files[0].share_token).toEqual('abc123xyz789');
    expect(files[0].created_at).toBeInstanceOf(Date);
  });

  it('should create unique share tokens', async () => {
    const input1 = { ...testImageInput, share_token: 'token1' };
    const input2 = { ...testVideoInput, share_token: 'token2' };

    const result1 = await uploadFile(input1);
    const result2 = await uploadFile(input2);

    expect(result1.share_token).toEqual('token1');
    expect(result2.share_token).toEqual('token2');
    expect(result1.share_token).not.toEqual(result2.share_token);
  });

  it('should handle large file sizes correctly', async () => {
    const largeFileInput: UploadFileInput = {
      ...testVideoInput,
      file_size: 199 * 1024 * 1024 // 199MB (under 200MB limit)
    };

    const result = await uploadFile(largeFileInput);

    expect(result.file_size).toEqual(199 * 1024 * 1024);
    expect(typeof result.file_size).toEqual('number');
  });

  it('should query files by share token correctly', async () => {
    await uploadFile(testImageInput);

    const files = await db.select()
      .from(filesTable)
      .where(eq(filesTable.share_token, 'abc123xyz789'))
      .execute();

    expect(files).toHaveLength(1);
    expect(files[0].share_token).toEqual('abc123xyz789');
    expect(files[0].filename).toEqual('test-image.jpg');
  });
});
