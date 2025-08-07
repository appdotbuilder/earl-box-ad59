
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  uploadFileInputSchema,
  getFileByTokenInputSchema,
  generateShareUrlInputSchema
} from './schema';

// Import handlers
import { uploadFile } from './handlers/upload_file';
import { getFileByToken } from './handlers/get_file_by_token';
import { getUploadStats } from './handlers/get_upload_stats';
import { generateShareUrl } from './handlers/generate_share_url';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Upload file endpoint - handles file metadata storage
  uploadFile: publicProcedure
    .input(uploadFileInputSchema)
    .mutation(({ input }) => uploadFile(input)),

  // Get file by share token - for direct preview access
  getFileByToken: publicProcedure
    .input(getFileByTokenInputSchema)
    .query(({ input }) => getFileByToken(input)),

  // Get upload statistics - for compact UI display
  getUploadStats: publicProcedure
    .query(() => getUploadStats()),

  // Generate shareable URL - for clipboard copying with confirmation
  generateShareUrl: publicProcedure
    .input(generateShareUrlInputSchema)
    .query(({ input }) => generateShareUrl(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Earl Box TRPC server listening at port: ${port}`);
}

start();
