
import { serial, text, pgTable, timestamp, bigint, varchar } from 'drizzle-orm/pg-core';

export const filesTable = pgTable('files', {
  id: serial('id').primaryKey(),
  filename: varchar('filename', { length: 255 }).notNull(),
  original_name: varchar('original_name', { length: 255 }).notNull(),
  file_path: text('file_path').notNull(),
  file_size: bigint('file_size', { mode: 'number' }).notNull(),
  mime_type: varchar('mime_type', { length: 100 }).notNull(),
  share_token: varchar('share_token', { length: 64 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type FileRecord = typeof filesTable.$inferSelect; // For SELECT operations
export type NewFileRecord = typeof filesTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { files: filesTable };
