
import { z } from 'zod';

// File upload schema
export const fileSchema = z.object({
  id: z.number(),
  filename: z.string(),
  original_name: z.string(),
  file_path: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  share_token: z.string(),
  created_at: z.coerce.date()
});

export type FileRecord = z.infer<typeof fileSchema>;

// Input schema for uploading files
export const uploadFileInputSchema = z.object({
  filename: z.string(),
  original_name: z.string(),
  file_path: z.string(),
  file_size: z.number().max(200 * 1024 * 1024, 'File size cannot exceed 200MB'), // 200MB limit
  mime_type: z.string().refine(
    (type) => type.startsWith('image/') || type.startsWith('video/'),
    'Only image and video files are allowed'
  ),
  share_token: z.string()
});

export type UploadFileInput = z.infer<typeof uploadFileInputSchema>;

// Schema for getting file by share token
export const getFileByTokenInputSchema = z.object({
  share_token: z.string()
});

export type GetFileByTokenInput = z.infer<typeof getFileByTokenInputSchema>;

// Schema for upload statistics
export const uploadStatsSchema = z.object({
  total_uploads: z.number(),
  total_size: z.number()
});

export type UploadStats = z.infer<typeof uploadStatsSchema>;

// Schema for generating share URL
export const generateShareUrlInputSchema = z.object({
  share_token: z.string(),
  base_url: z.string()
});

export type GenerateShareUrlInput = z.infer<typeof generateShareUrlInputSchema>;

// Schema for share URL response
export const shareUrlResponseSchema = z.object({
  share_url: z.string()
});

export type ShareUrlResponse = z.infer<typeof shareUrlResponseSchema>;
