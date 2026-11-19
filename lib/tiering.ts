/* Vendor tiering (5A). Tier is always derived from criticality, data sensitivity,
   replaceability and concentration — never hand-picked — so it stays explainable and
   consistent. A manual override is stored separately, with its own reason, and never
   overwrites the calculated result underneath. */
import type { Vendor } from "@/lib/types";

export const TIERS = ["Tier 1 – Critical", "Tier 2 – High", "Tier 3 – Moderate", "Tier 4 – Low"] as const;
export type Tier = (typeof TIERS)[number];

const CRITICALITY_RANK: Record<string, number> = { Critical: 1, High: 2, Medium: 3, Low: 4 };
const SENSITIVITY_RANK: Record<string, number> = {
  "Regulated financial data": 1,
  "Payment card data (PCI)": 1,
  "Customer PII": 2,
  "Internal business data only": 3,
  "No sensitive data": 4,
};

export type TierResult = {
  /** The calculated tier — unaffected by any override. */
  calculated: Tier;
  reasons: string[];
  /** What the profile should actually show: the override if set, else the calculated tier. */
  tier: Tier;
  overridden: boolean;
};

/** How far a concentration flag or limited replaceability can escalate the tier — organisation
 * configured (Settings), so a company can decide these don't have to mean "Critical" for them. */
export type TierConfig = { concentrationTrigger: Tier; limitedAlternativesTrigger: Tier };
export const DEFAULT_TIER_CONFIG: TierConfig = { concentrationTrigger: "Tier 1 – Critical", limitedAlternativesTrigger: "Tier 2 – High" };

/** Reads the org's own escalation settings, falling back to the defaults for anything unset
 * or no longer a valid tier name. */
export function tierConfigFromOrg(org: { tierConcentrationTrigger?: string | null; tierLimitedAlternativesTrigger?: string | null }): TierConfig {
  const concentrationTrigger = TIERS.includes(org.tierConcentrationTrigger as Tier)
    ? (org.tierConcentrationTrigger as Tier)
    : DEFAULT_TIER_CONFIG.concentrationTrigger;
  const limitedAlternativesTrigger = TIERS.includes(org.tierLimitedAlternativesTrigger as Tier)
    ? (org.tierLimitedAlternativesTrigger as Tier)
    : DEFAULT_TIER_CONFIG.limitedAlternativesTrigger;
  return { concentrationTrigger, limitedAlternativesTrigger };
}

/** Derives a vendor's tier from criticality, data accessed, replaceability and concentration.
 * `hasConcentration` should come from `concentrationsFor` — a shared legal entity, parent
 * group, subcontractor or cloud provider with another vendor. */
export function calculateTier(
  vendor: Pick<Vendor, "criticality" | "dataSensitivity" | "alternativeProviders" | "tierOverride">,
  hasConcentration: boolean,
  config: TierConfig = DEFAULT_TIER_CONFIG
): TierResult {
  const reasons: string[] = [];
  const criticalityRank = CRITICALITY_RANK[vendor.criticality] ?? 4;
  const sensitivityRank = SENSITIVITY_RANK[vendor.dataSensitivity] ?? 4;

  let rank = Math.min(criticalityRank, sensitivityRank);
  if (criticalityRank <= sensitivityRank) reasons.push(`Criticality: ${vendor.criticality}`);
  if (sensitivityRank <= criticalityRank) reasons.push(`Data accessed: ${vendor.dataSensitivity}`);

  if (hasConcentration) {
    reasons.push("Shares a legal entity, group, subcontractor or cloud provider with another vendor");
    rank = Math.min(rank, TIERS.indexOf(config.concentrationTrigger) + 1);
  }

  const alt = vendor.alternativeProviders;
  if (alt === "Limited" || alt === "Not practical") {
    reasons.push(`Alternative providers: ${alt}`);
    rank = Math.min(rank, TIERS.indexOf(config.limitedAlternativesTrigger) + 1);
  }

  const calculated = TIERS[rank - 1];
  const overridden = Boolean(vendor.tierOverride);
  return { calculated, reasons, tier: overridden ? (vendor.tierOverride as Tier) : calculated, overridden };
}
