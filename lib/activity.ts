import "server-only";
import { prisma } from "@/lib/prisma";

/** Written alongside every save/delete so there's a complete history of who changed
 * what and when — the audit trail half of (12). Never awaited by the caller's return
 * value; a logging failure should not block the action itself. */
export async function logActivity(entity: string, action: string, label: string, user: string): Promise<void> {
  try {
    await prisma.activityLog.create({ data: { entity, action, label, user } });
  } catch {
    // Logging is best-effort — the underlying change already happened.
  }
}

export function listActivity(limit = 50) {
  return prisma.activityLog.findMany({ orderBy: { ts: "desc" }, take: limit });
}
