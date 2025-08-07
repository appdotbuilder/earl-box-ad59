
import { type GenerateShareUrlInput, type ShareUrlResponse } from '../schema';

export const generateShareUrl = async (input: GenerateShareUrlInput): Promise<ShareUrlResponse> => {
  try {
    // Ensure base URL ends with no trailing slash for consistent formatting
    const baseUrl = input.base_url.replace(/\/$/, '');
    
    // Construct the full share URL using the base URL and share token
    const shareUrl = `${baseUrl}/share/${input.share_token}`;
    
    return {
      share_url: shareUrl
    };
  } catch (error) {
    console.error('Share URL generation failed:', error);
    throw error;
  }
};
