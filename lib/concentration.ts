/* Concentration & dependency (8B). Flags vendors that are really the same legal entity
   or group, or that share a subcontractor / cloud provider — purely derived from each
   vendor's own profile fields. A shared dependency is a reason to review, not an
   automatic materiality or criticality change. */
import type { Vendor } from "@/lib/types";

export type ConcentrationKind = "legalEntity" | "parentGroup" | "subcontractor" | "cloudProvider";

export type VendorRef = { id: number; name: string };

export type ConcentrationGroup = {
  kind: ConcentrationKind;
  label: string;
  value: string;
  vendors: VendorRef[];
  /** Total annual spend across the vendors in this group, where at least one has
   * recorded a figure — the "aggregate provider exposure" materiality factor. */
  aggregateSpend?: number;
};

const KIND_LABEL: Record<ConcentrationKind, string> = {
  legalEntity: "Same legal entity",
  parentGroup: "Same parent / group company",
  subcontractor: "Shared subcontractor",
  cloudProvider: "Shared cloud / technology provider",
};

/** "AWS, Twilio" -> ["AWS", "Twilio"], tolerant of extra commas/whitespace. */
function splitList(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function groupVendorsBy(vendors: Vendor[], kind: ConcentrationKind, valuesFor: (v: Vendor) => string[]): ConcentrationGroup[] {
  const byKey = new Map<string, { display: string; vendors: VendorRef[]; spend: number; hasSpend: boolean }>();
  for (const v of vendors) {
    for (const raw of valuesFor(v)) {
      const key = raw.toLowerCase();
      const entry = byKey.get(key) ?? { display: raw, vendors: [], spend: 0, hasSpend: false };
      if (!entry.vendors.some((x) => x.id === v.id)) {
        entry.vendors.push({ id: v.id, name: v.name });
        const spend = v.annualSpend ? Number(v.annualSpend) : null;
        if (spend != null && Number.isFinite(spend)) {
          entry.spend += spend;
          entry.hasSpend = true;
        }
      }
      byKey.set(key, entry);
    }
  }
  return [...byKey.values()]
    .filter((e) => e.vendors.length > 1)
    .map((e) => ({ kind, label: KIND_LABEL[kind], value: e.display, vendors: e.vendors, aggregateSpend: e.hasSpend ? e.spend : undefined }));
}

/** Every cross-vendor concentration finding — two or more vendors sharing a provider dependency. */
export function findConcentrations(vendors: Vendor[]): ConcentrationGroup[] {
  return [
    ...groupVendorsBy(vendors, "legalEntity", (v) => (v.legalEntity?.trim() ? [v.legalEntity.trim()] : [])),
    ...groupVendorsBy(vendors, "parentGroup", (v) => (v.parentGroup?.trim() ? [v.parentGroup.trim()] : [])),
    ...groupVendorsBy(vendors, "subcontractor", (v) => splitList(v.subcontractors)),
    ...groupVendorsBy(vendors, "cloudProvider", (v) => splitList(v.cloudProviders)),
  ];
}

/** Findings that involve one vendor, with that vendor itself excluded from `peers`. */
export function concentrationsFor(vendorId: number, all: ConcentrationGroup[]): (ConcentrationGroup & { peers: VendorRef[] })[] {
  return all.filter((g) => g.vendors.some((v) => v.id === vendorId)).map((g) => ({ ...g, peers: g.vendors.filter((v) => v.id !== vendorId) }));
}
