import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadEnv({ path: '.env.local' });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  // Migrate/introspection use a direct (unpooled) connection; the app's
  // runtime PrismaClient (src/lib/prisma.ts) uses DATABASE_URL directly
  // instead (pooled, via the Neon driver adapter, only when deployed on
  // Vercel -- see that file). Local Postgres (Story L1) has no
  // pooled/unpooled distinction, so .env.local sets both to the same
  // value.
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? '',
  },
});
