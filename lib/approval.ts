/* Risk-based approval routing (6). Who reviews a vendor depends on its own service and
   risk profile — materiality, tier, data sensitivity, cross-border exposure and IT
   Outsourcing classification — not a single fixed approval chain for every vendor. */
import type { ClassificationOutcome } from "@/lib/classification";
import type { MaterialityOutcome } from "@/lib/materiality";
import type { Tier } from "@/lib/tiering";
import type { Vendor } from "@/lib/types";

export type Approver = { role: string; reason: string };

/** Every role that can ever be required — used for the sign-off checklist on a vendor's
 * profile, which should list a fixed set regardless of which ones a given vendor needs. */
export const ALL_APPROVER_ROLES = [
  "Business / Relationship Owner",
  "TPRM / Risk Owner",
  "CTO / Technology Head",
  "CISO / Security Head",
  "DPO / Privacy Contact",
  "Finance / CFO",
  "Compliance / Legal",
  "CEO / Senior Management",
  "Board / Committee",
];

export const CEO_TRIGGERS = ["Material or Tier 1", "Material only", "Tier 1 only", "Never"] as const;
export type CeoTrigger = (typeof CEO_TRIGGERS)[number];
export const BOARD_TRIGGERS = ["Material and Tier 1", "Never"] as const;
export type BoardTrigger = (typeof BOARD_TRIGGERS)[number];

/** When CEO/Board sign-off escalates — organisation configured (Settings), not fixed in code. */
export type ApprovalConfig = { ceoTrigger: CeoTrigger; boardTrigger: BoardTrigger };
export const DEFAULT_APPROVAL_CONFIG: ApprovalConfig = { ceoTrigger: "Material or Tier 1", boardTrigger: "Material and Tier 1" };

export function approvalConfigFromOrg(org: { approvalCeoTrigger?: string | null; approvalBoardTrigger?: string | null }): ApprovalConfig {
  const ceoTrigger = (CEO_TRIGGERS as readonly string[]).includes(org.approvalCeoTrigger ?? "")
    ? (org.approvalCeoTrigger as CeoTrigger)
    : DEFAULT_APPROVAL_CONFIG.ceoTrigger;
  const boardTrigger = (BOARD_TRIGGERS as readonly string[]).includes(org.approvalBoardTrigger ?? "")
    ? (org.approvalBoardTrigger as BoardTrigger)
    : DEFAULT_APPROVAL_CONFIG.boardTrigger;
  return { ceoTrigger, boardTrigger };
}

const SENSITIVE_DATA = ["Payment card data (PCI)", "Regulated financial data", "Customer PII"];

export function requiredApprovers(
  vendor: Pick<Vendor, "country" | "dataSensitivity" | "criticality" | "financialImpactEstimate">,
  tier: Tier,
  materiality: MaterialityOutcome,
  classification: ClassificationOutcome,
  config: ApprovalConfig = DEFAULT_APPROVAL_CONFIG
): Approver[] {
  const approvers: Approver[] = [{ role: "Business / Relationship Owner", reason: "Accountable for the vendor relationship on every vendor" }];

  const highRisk = tier === "Tier 1 – Critical" || tier === "Tier 2 – High";
  if (classification === "Potential IT Outsourcing" || highRisk) {
    approvers.push({ role: "TPRM / Risk Owner", reason: "Potential outsourcing and medium/high-risk vendors" });
  }
  if (classification === "Potential IT Outsourcing") {
    approvers.push({ role: "CTO / Technology Head", reason: "Technology, cloud or application dependency" });
  }
  if (SENSITIVE_DATA.includes(vendor.dataSensitivity) || classification === "Potential IT Outsourcing") {
    approvers.push({ role: "CISO / Security Head", reason: "Data, systems or privileged-access exposure" });
  }
  if (vendor.dataSensitivity === "Customer PII" || vendor.dataSensitivity === "Regulated financial data") {
    approvers.push({ role: "DPO / Privacy Contact", reason: "Customer or personal data is involved" });
  }
  const financialImpact = vendor.financialImpactEstimate ? Number(vendor.financialImpactEstimate) : null;
  if (vendor.criticality === "Critical" || (financialImpact != null && financialImpact > 0)) {
    approvers.push({ role: "Finance / CFO", reason: "Financial exposure or vendor viability considerations" });
  }
  if (vendor.country && vendor.country !== "India") {
    approvers.push({ role: "Compliance / Legal", reason: "Cross-border arrangement" });
  }
  const isMaterial = materiality === "Potential Material";
  const isTier1 = tier === "Tier 1 – Critical";
  const ceoNeeded: Record<CeoTrigger, boolean> = {
    "Material or Tier 1": isMaterial || isTier1,
    "Material only": isMaterial,
    "Tier 1 only": isTier1,
    Never: false,
  };
  if (ceoNeeded[config.ceoTrigger]) {
    approvers.push({ role: "CEO / Senior Management", reason: "Material or critical arrangement (per the organisation's escalation rule)" });
  }
  if (config.boardTrigger === "Material and Tier 1" && isMaterial && isTier1) {
    approvers.push({ role: "Board / Committee", reason: "Material and critical — per delegated governance policy" });
  }

  return approvers;
}
