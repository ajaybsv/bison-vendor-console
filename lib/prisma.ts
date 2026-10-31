import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { __bisonVendorPrisma?: PrismaClient };

// Locally DATABASE_URL comes from .env; on Vercel the Prisma Postgres integration (env prefix
// "bison_vendor") provides bison_vendor_* vars.
const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ?? process.env.bison_vendor_DATABASE_URL_POOLED ?? process.env.bison_vendor_DATABASE_URL,
});

export const prisma =
  globalForPrisma.__bisonVendorPrisma ??
  (globalForPrisma.__bisonVendorPrisma = new PrismaClient({ adapter }));
