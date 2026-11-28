import "server-only";
import { VENDOR_EVAL_DOMAINS } from "@/lib/vendor-evaluation";
import type { TenantDb } from "@/lib/types";

/** Questions per domain in the Service Provider Evaluation (6A) bank — shown when choosing
 * a vendor due-diligence request's scope. */
export async function questionCountsByControl(db: TenantDb): Promise<Record<string, number>> {
  const groups = await db.question.groupBy({ by: ["control"], where: { audience: "vendor" }, _count: { _all: true } });
  const counts: Record<string, number> = Object.fromEntries(VENDOR_EVAL_DOMAINS.map((c) => [c, 0]));
  for (const g of groups) counts[g.control] = g._count._all;
  return counts;
}
