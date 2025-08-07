
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type GenerateShareUrlInput } from '../schema';
import { generateShareUrl } from '../handlers/generate_share_url';

// Test input data
const testInput: GenerateShareUrlInput = {
  base_url: 'https://example.com',
  share_token: 'abc123token456'
};

describe('generateShareUrl', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate a valid share URL', async () => {
    const result = await generateShareUrl(testInput);

    expect(result.share_url).toEqual('https://example.com/share/abc123token456');
    expect(result.share_url).toContain(testInput.base_url);
    expect(result.share_url).toContain(testInput.share_token);
  });

  it('should handle base URL with trailing slash', async () => {
    const inputWithTrailingSlash: GenerateShareUrlInput = {
      base_url: 'https://example.com/',
      share_token: 'test-token'
    };

    const result = await generateShareUrl(inputWithTrailingSlash);

    expect(result.share_url).toEqual('https://example.com/share/test-token');
    expect(result.share_url).not.toContain('//share');
  });

  it('should handle different URL schemes', async () => {
    const httpInput: GenerateShareUrlInput = {
      base_url: 'http://localhost:3000',
      share_token: 'local-token'
    };

    const result = await generateShareUrl(httpInput);

    expect(result.share_url).toEqual('http://localhost:3000/share/local-token');
  });

  it('should handle complex share tokens', async () => {
    const complexTokenInput: GenerateShareUrlInput = {
      base_url: 'https://myapp.com',
      share_token: 'abcd1234-efgh-5678-ijkl-9012mnop3456'
    };

    const result = await generateShareUrl(complexTokenInput);

    expect(result.share_url).toEqual('https://myapp.com/share/abcd1234-efgh-5678-ijkl-9012mnop3456');
  });

  it('should throw error for empty base URL', async () => {
    const invalidInput: GenerateShareUrlInput = {
      base_url: '',
      share_token: 'valid-token'
    };

    await expect(generateShareUrl(invalidInput)).rejects.toThrow(/base url is required/i);
  });

  it('should throw error for empty share token', async () => {
    const invalidInput: GenerateShareUrlInput = {
      base_url: 'https://example.com',
      share_token: ''
    };

    await expect(generateShareUrl(invalidInput)).rejects.toThrow(/share token is required/i);
  });

  it('should handle whitespace-only inputs', async () => {
    const whitespaceInput: GenerateShareUrlInput = {
      base_url: '   ',
      share_token: 'valid-token'
    };

    await expect(generateShareUrl(whitespaceInput)).rejects.toThrow(/base url is required/i);
  });
});
