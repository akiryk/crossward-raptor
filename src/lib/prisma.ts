import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Vercel sets this env var in every environment it runs the app in
// (production and preview alike); it's unset everywhere else. Local dev
// and the e2e suite point DATABASE_URL at Postgres running in Docker
// (Story L1), which the Neon serverless driver can't reach -- it speaks
// Neon's own HTTP/WebSocket protocol, not raw Postgres wire protocol.
// Deployed on Vercel, DATABASE_URL is still real Neon, unchanged.
const adapter = process.env.VERCEL
  ? new PrismaNeon({ connectionString: process.env.DATABASE_URL ?? '' })
  : new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
