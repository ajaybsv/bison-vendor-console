import "server-only";
import { CONTROLS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

/** Questions per control in the bank — shown when choosing a request's scope. */
export async function questionCountsByControl(): Promise<Record<string, number>> {
  const groups = await prisma.question.groupBy({ by: ["control"], _count: { _all: true } });
  const counts: Record<string, number> = Object.fromEntries(CONTROLS.map((c) => [c, 0]));
  for (const g of groups) counts[g.control] = g._count._all;
  return counts;
}
