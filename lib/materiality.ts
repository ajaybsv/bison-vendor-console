/* Materiality (4 / 4B). Each measurable factor is compared against the organisation's
   own configured threshold — never a universal, hard-coded cutoff. Two or more
   triggered factors mean the arrangement is potentially material; exactly one means
   it needs judgement rather than an automatic conclusion; none met (with thresholds
   actually configured) means it's a non-material candidate. */
import type { Organization, Vendor } from "@/lib/types";

export type MaterialityOutcome = "Potential Material" | "Potential Non-Material" | "Review Required";

export type MaterialityResult = { outcome: MaterialityOutcome; reasons: string[] };

type OrgThresholds = Pick<Organization, "materialityDisruptionHours" | "materialityCustomerPct" | "materialityFinancialImpact">;
type VendorInputs = Pick<Vendor, "disruptionToleranceHours" | "customersAffectedPct" | "financialImpactEstimate">;

function toNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function calculateMateriality(vendor: VendorInputs, org: OrgThresholds, hasConcentration: boolean): MaterialityResult {
  const reasons: string[] = [];
  let triggers = 0;
  let thresholdsConfigured = false;

  const orgDisruption = toNumber(org.materialityDisruptionHours);
  const vendorDisruption = toNumber(vendor.disruptionToleranceHours);
  if (orgDisruption != null) {
    thresholdsConfigured = true;
    if (vendorDisruption != null && vendorDisruption <= orgDisruption) {
      triggers++;
      reasons.push(`Disruption tolerance (${vendorDisruption}h) is at or below the organisation threshold (${orgDisruption}h)`);
    }
  }

  const orgCustomerPct = toNumber(org.materialityCustomerPct);
  const vendorCustomerPct = toNumber(vendor.customersAffectedPct);
  if (orgCustomerPct != null) {
    thresholdsConfigured = true;
    if (vendorCustomerPct != null && vendorCustomerPct >= orgCustomerPct) {
      triggers++;
      reasons.push(`Customers affected (${vendorCustomerPct}%) meets or exceeds the organisation threshold (${orgCustomerPct}%)`);
    }
  }

  const orgFinancial = toNumber(org.materialityFinancialImpact);
  const vendorFinancial = toNumber(vendor.financialImpactEstimate);
  if (orgFinancial != null) {
    thresholdsConfigured = true;
    if (vendorFinancial != null && vendorFinancial >= orgFinancial) {
      triggers++;
      reasons.push(`Estimated financial impact (${inr(vendorFinancial)}) meets or exceeds the organisation threshold (${inr(orgFinancial)})`);
    }
  }

  if (hasConcentration) {
    triggers++;
    reasons.push("Shares a legal entity, group, subcontractor or cloud provider with another vendor");
  }

  if (!thresholdsConfigured && triggers === 0) {
    return { outcome: "Review Required", reasons: ["Organisation materiality thresholds aren't configured yet — set them in Settings"] };
  }
  if (triggers >= 2) return { outcome: "Potential Material", reasons };
  if (triggers === 1) return { outcome: "Review Required", reasons };
  return { outcome: "Potential Non-Material", reasons: ["No configured materiality threshold was triggered"] };
}
