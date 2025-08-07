
import { type GenerateShareUrlInput, type ShareUrlResponse } from '../schema';

export const generateShareUrl = async (input: GenerateShareUrlInput): Promise<ShareUrlResponse> => {
  try {
    // Validate that base_url is provided
    if (!input.base_url.trim()) {
      throw new Error('Base URL is required');
    }

    // Validate that share_token is provided
    if (!input.share_token.trim()) {
      throw new Error('Share token is required');
    }

    // Remove trailing slash from base_url if present
    const baseUrl = input.base_url.replace(/\/$/, '');
    
    // Construct the share URL
    const shareUrl = `${baseUrl}/share/${input.share_token}`;

    return {
      share_url: shareUrl
    };
  } catch (error) {
    console.error('Share URL generation failed:', error);
    throw error;
  }
};
