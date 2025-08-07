
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
  original_name: 'my-photo.jpg',
  file_path: '/uploads/test-image.jpg',
  file_size: 1024 * 1024, // 1MB
  mime_type: 'image/jpeg',
  share_token: 'abc123def456ghi789'
};

// Test input for video file
const testVideoInput: UploadFileInput = {
  filename: 'test-video.mp4',
  original_name: 'my-video.mp4',
  file_path: '/uploads/test-video.mp4',
  file_size: 50 * 1024 * 1024, // 50MB
  mime_type: 'video/mp4',
  share_token: 'xyz789uvw456rst123'
};

describe('uploadFile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should upload an image file', async () => {
    const result = await uploadFile(testImageInput);

    // Basic field validation
    expect(result.filename).toEqual('test-image.jpg');
    expect(result.original_name).toEqual('my-photo.jpg');
    expect(result.file_path).toEqual('/uploads/test-image.jpg');
    expect(result.file_size).toEqual(1024 * 1024);
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.share_token).toEqual('abc123def456ghi789');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should upload a video file', async () => {
    const result = await uploadFile(testVideoInput);

    // Basic field validation
    expect(result.filename).toEqual('test-video.mp4');
    expect(result.original_name).toEqual('my-video.mp4');
    expect(result.file_path).toEqual('/uploads/test-video.mp4');
    expect(result.file_size).toEqual(50 * 1024 * 1024);
    expect(result.mime_type).toEqual('video/mp4');
    expect(result.share_token).toEqual('xyz789uvw456rst123');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save file to database', async () => {
    const result = await uploadFile(testImageInput);

    // Query database to verify file was saved
    const files = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, result.id))
      .execute();

    expect(files).toHaveLength(1);
    expect(files[0].filename).toEqual('test-image.jpg');
    expect(files[0].original_name).toEqual('my-photo.jpg');
    expect(files[0].file_path).toEqual('/uploads/test-image.jpg');
    expect(files[0].file_size).toEqual(1024 * 1024);
    expect(files[0].mime_type).toEqual('image/jpeg');
    expect(files[0].share_token).toEqual('abc123def456ghi789');
    expect(files[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle unique share token constraint', async () => {
    // Upload first file
    await uploadFile(testImageInput);

    // Try to upload another file with same share token
    const duplicateTokenInput: UploadFileInput = {
      ...testVideoInput,
      share_token: testImageInput.share_token // Same token
    };

    expect(uploadFile(duplicateTokenInput)).rejects.toThrow(/duplicate key value violates unique constraint|UNIQUE constraint failed/i);
  });

  it('should handle large file sizes correctly', async () => {
    const largeFileInput: UploadFileInput = {
      filename: 'large-video.mov',
      original_name: 'large-video.mov',
      file_path: '/uploads/large-video.mov',
      file_size: 199 * 1024 * 1024, // 199MB (under 200MB limit)
      mime_type: 'video/quicktime',
      share_token: 'large123file456token'
    };

    const result = await uploadFile(largeFileInput);

    expect(result.file_size).toEqual(199 * 1024 * 1024);
    expect(result.filename).toEqual('large-video.mov');
    expect(result.mime_type).toEqual('video/quicktime');
  });
});
