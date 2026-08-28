import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

loadEnv({ path: '.env.development.local' });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  // Migrate/introspection use a direct (unpooled) connection; the app's
  // runtime PrismaClient (src/lib/prisma.ts) uses the pooled DATABASE_URL
  // via the Neon driver adapter instead.
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? '',
  },
});
