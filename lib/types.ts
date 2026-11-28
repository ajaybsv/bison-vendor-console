import type {
  ClientRequest,
  EvidenceItem,
  HistoryEntry,
  Issue,
  Organization,
  Question,
  TeamMember,
  TrustAnswer,
  Vendor,
  VendorRequest,
  VendorRequestEvidence,
  VendorResponse,
} from "@/generated/prisma/client";

export type {
  ClientRequest,
  EvidenceItem,
  HistoryEntry,
  Issue,
  Organization,
  Question,
  TrustAnswer,
  Vendor,
  VendorRequest,
  VendorRequestEvidence,
  VendorResponse,
};

/** A team member as it's safe to send to the browser — no credentials. */
export type Member = Omit<TeamMember, "passwordHash" | "inviteToken" | "createdAt">;

export type CurrentUser = Pick<TeamMember, "id" | "name" | "email" | "role">;

/** The signed-in member plus the Prisma client bound to their own tenant's database —
 * every data access after sign-in goes through this, never a shared/global client. */
export type SessionContext = CurrentUser & { db: TenantDb; tenantSlug: string };

// Kept as a type-only alias (not importing PrismaClient's value here) so this file doesn't
// need "server-only" — lib/session.ts and lib/tenant-db.ts own the real client.
export type TenantDb = import("@/generated/prisma/client").PrismaClient;

export type VendorRequestFull = VendorRequest & {
  responses: VendorResponse[];
  evidence: VendorRequestEvidence[];
};

export type NavCounts = {
  requests: number;
  history: number;
  answers: number;
  evidence: number;
  vendors: number;
  sentrequests: number;
  issues: number;
  team: number;
};
