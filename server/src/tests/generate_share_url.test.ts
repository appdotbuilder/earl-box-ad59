
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type GenerateShareUrlInput } from '../schema';
import { generateShareUrl } from '../handlers/generate_share_url';

describe('generateShareUrl', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate a share URL with proper format', async () => {
    const input: GenerateShareUrlInput = {
      base_url: 'https://example.com',
      share_token: 'abc123def456'
    };

    const result = await generateShareUrl(input);

    expect(result.share_url).toEqual('https://example.com/share/abc123def456');
  });

  it('should handle base URL with trailing slash', async () => {
    const input: GenerateShareUrlInput = {
      base_url: 'https://example.com/',
      share_token: 'xyz789'
    };

    const result = await generateShareUrl(input);

    expect(result.share_url).toEqual('https://example.com/share/xyz789');
  });

  it('should work with localhost URLs', async () => {
    const input: GenerateShareUrlInput = {
      base_url: 'http://localhost:3000',
      share_token: 'local123'
    };

    const result = await generateShareUrl(input);

    expect(result.share_url).toEqual('http://localhost:3000/share/local123');
  });

  it('should handle complex share tokens', async () => {
    const input: GenerateShareUrlInput = {
      base_url: 'https://myapp.example.org',
      share_token: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
    };

    const result = await generateShareUrl(input);

    expect(result.share_url).toEqual('https://myapp.example.org/share/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6');
  });

  it('should handle base URL with port number', async () => {
    const input: GenerateShareUrlInput = {
      base_url: 'https://staging.example.com:8080',
      share_token: 'staging456'
    };

    const result = await generateShareUrl(input);

    expect(result.share_url).toEqual('https://staging.example.com:8080/share/staging456');
  });

  it('should handle base URL with path', async () => {
    const input: GenerateShareUrlInput = {
      base_url: 'https://example.com/app',
      share_token: 'path123'
    };

    const result = await generateShareUrl(input);

    expect(result.share_url).toEqual('https://example.com/app/share/path123');
  });
});
