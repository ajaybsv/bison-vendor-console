/* Derived statuses. A vendor's "current status" is never stored — it's always computed
   from its most recent request, so there is nothing to keep in sync by hand. */
import { daysUntil } from "@/lib/format";
import type { ClientRequest, VendorRequest } from "@/lib/types";

type CycleLike = Pick<VendorRequest, "vendorId" | "status" | "sentOn">;

export function requestsFor<T extends CycleLike>(all: T[], vendorId: number): T[] {
  return all
    .filter((r) => r.vendorId === vendorId)
    .slice()
    .sort((a, b) => (b.sentOn || "").localeCompare(a.sentOn || ""));
}

export function latestRequestFor<T extends CycleLike>(all: T[], vendorId: number): T | null {
  return requestsFor(all, vendorId)[0] ?? null;
}

export function vendorStatus(all: CycleLike[], vendorId: number): string {
  return latestRequestFor(all, vendorId)?.status ?? "Not sent";
}

export function isInFlight(status: string): boolean {
  return status === "Awaiting response" || status === "In progress";
}

export function hasCompletedCycle(all: CycleLike[], vendorId: number): boolean {
  return all.some((r) => r.vendorId === vendorId && r.status === "Completed");
}

export type ReviewState =
  | { kind: "none" }
  | { kind: "overdue"; label: string }
  | { kind: "due"; label: string; days: number }
  | { kind: "scheduled"; date: string };

export function reviewState(
  vendor: { id: number; nextReview: string | null },
  all: CycleLike[],
  today: string
): ReviewState {
  const d = daysUntil(vendor.nextReview, today);
  if (d == null) return { kind: "none" };
  const label = hasCompletedCycle(all, vendor.id) ? "Reassessment" : "First assessment";
  if (d < 0) return { kind: "overdue", label };
  if (d <= 45) return { kind: "due", label, days: d };
  return { kind: "scheduled", date: vendor.nextReview! };
}

type ProgressLike = Pick<ClientRequest, "qDone" | "qTotal" | "evDone" | "evTotal">;

export function reqProgress(r: ProgressLike): number {
  const q = r.qTotal ? r.qDone / r.qTotal : 0;
  const e = r.evTotal ? r.evDone / r.evTotal : 0;
  return Math.round(((q + e) / 2) * 100);
}

export function reqStatus(r: ProgressLike & { status: string }): string {
  if (r.status === "Submitted") return "Submitted";
  if (r.qDone === 0 && r.evDone === 0) return "Not started";
  if (r.qDone === r.qTotal && r.evDone === r.evTotal) return "Ready to submit";
  return "In progress";
}
