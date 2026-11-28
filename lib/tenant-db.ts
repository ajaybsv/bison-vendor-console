import "server-only";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// The tenant directory itself lives in bison-admin-console's own database — this app only
// ever reads the one row it needs (slug -> connection details), never the rest of that schema.
const adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });

type TenantRow = { databaseUrl: string | null; status: string | null; provisioningStatus: string };

const tenantCache = new Map<string, { row: TenantRow | null; at: number }>();
const TENANT_CACHE_MS = 30_000;

async function lookupTenantRow(slug: string): Promise<TenantRow | null> {
  const cached = tenantCache.get(slug);
  if (cached && Date.now() - cached.at < TENANT_CACHE_MS) return cached.row;
  const { rows } = await adminPool.query(
    `select "databaseUrl", status, "provisioningStatus" from tenants where slug = $1 limit 1`,
    [slug]
  );
  const row = (rows[0] as TenantRow | undefined) ?? null;
  tenantCache.set(slug, { row, at: Date.now() });
  return row;
}

const globalForTenantDb = globalThis as unknown as { __bisonTenantClients?: Map<string, PrismaClient> };
const clientCache = globalForTenantDb.__bisonTenantClients ?? (globalForTenantDb.__bisonTenantClients = new Map());

function prismaForUrl(databaseUrl: string): PrismaClient {
  let client = clientCache.get(databaseUrl);
  if (!client) {
    client = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
    clientCache.set(databaseUrl, client);
  }
  return client;
}

/** A tenant slug straight to its ready Prisma client — or null if it doesn't exist, is
 * suspended, or hasn't finished being provisioned yet. */
export async function dbForTenant(slug: string): Promise<PrismaClient | null> {
  const row = await lookupTenantRow(slug);
  if (!row || !row.databaseUrl || row.status === "Suspended" || row.provisioningStatus !== "Active") return null;
  return prismaForUrl(row.databaseUrl);
}
