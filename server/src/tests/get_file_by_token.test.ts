
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type GetFileByTokenInput } from '../schema';
import { getFileByToken } from '../handlers/get_file_by_token';
import { eq } from 'drizzle-orm';

// Test file data
const testFileData = {
  filename: 'test-image.jpg',
  original_name: 'My Test Image.jpg',
  file_path: '/uploads/test-image.jpg',
  file_size: 1024000, // 1MB
  mime_type: 'image/jpeg',
  share_token: 'abc123def456ghi789'
};

describe('getFileByToken', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return file record when token exists', async () => {
    // Create test file
    const insertResult = await db.insert(filesTable)
      .values(testFileData)
      .returning()
      .execute();
    
    const createdFile = insertResult[0];

    // Test retrieval by token
    const input: GetFileByTokenInput = {
      share_token: 'abc123def456ghi789'
    };

    const result = await getFileByToken(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdFile.id);
    expect(result!.filename).toEqual('test-image.jpg');
    expect(result!.original_name).toEqual('My Test Image.jpg');
    expect(result!.file_path).toEqual('/uploads/test-image.jpg');
    expect(result!.file_size).toEqual(1024000);
    expect(result!.mime_type).toEqual('image/jpeg');
    expect(result!.share_token).toEqual('abc123def456ghi789');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(typeof result!.file_size).toEqual('number');
  });

  it('should return null when token does not exist', async () => {
    // Create test file with different token
    await db.insert(filesTable)
      .values(testFileData)
      .returning()
      .execute();

    // Test retrieval with non-existent token
    const input: GetFileByTokenInput = {
      share_token: 'nonexistent-token'
    };

    const result = await getFileByToken(input);

    expect(result).toBeNull();
  });

  it('should return null when no files exist in database', async () => {
    // Test retrieval with empty database
    const input: GetFileByTokenInput = {
      share_token: 'any-token'
    };

    const result = await getFileByToken(input);

    expect(result).toBeNull();
  });

  it('should match exact token only', async () => {
    // Create test file
    await db.insert(filesTable)
      .values(testFileData)
      .returning()
      .execute();

    // Test with partial token (should not match)
    const partialTokenInput: GetFileByTokenInput = {
      share_token: 'abc123' // Only part of the token
    };

    const partialResult = await getFileByToken(partialTokenInput);
    expect(partialResult).toBeNull();

    // Test with exact token (should match)
    const exactTokenInput: GetFileByTokenInput = {
      share_token: 'abc123def456ghi789'
    };

    const exactResult = await getFileByToken(exactTokenInput);
    expect(exactResult).not.toBeNull();
    expect(exactResult!.share_token).toEqual('abc123def456ghi789');
  });

  it('should verify file is saved correctly in database', async () => {
    // Create test file
    const insertResult = await db.insert(filesTable)
      .values(testFileData)
      .returning()
      .execute();
    
    const createdFile = insertResult[0];

    // Verify file exists in database with correct token
    const savedFiles = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, createdFile.id))
      .execute();

    expect(savedFiles).toHaveLength(1);
    expect(savedFiles[0].share_token).toEqual('abc123def456ghi789');
    expect(savedFiles[0].filename).toEqual('test-image.jpg');
    expect(savedFiles[0].file_size).toEqual(1024000);
    expect(savedFiles[0].created_at).toBeInstanceOf(Date);
  });
});
