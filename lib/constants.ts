export const CONTROLS = ["Vendor Due Diligence", "Security Safeguards", "Concentration Monitoring"];

export const EVI_TYPES = [
  "SOC Report",
  "ISO Certificate",
  "Financial Statements",
  "VAPT Report",
  "Insurance Certificate",
  "Credit Rating",
  "BCP Report",
  "Audit Report",
];

export const FRAMEWORKS = ["RBI", "ISO 27001", "DPDP", "SEBI CSCRF"];

/** Internal teams whose own assessment (owned outside TPRM/IT) needs to be confirmed
 * complete before approval — a status/traceability record, not a duplicate of their work. */
export const CONFIRMATION_AREAS = ["Finance / ERM", "Technology", "Information Security", "Legal / Compliance", "Business"];

export const VENDOR_TYPES = ["Payment Gateway", "Cloud", "SaaS", "Data centre"];

export const ROLES = ["Owner", "Contributor", "Viewer"] as const;
export type Role = (typeof ROLES)[number];

/** Who may change what. Owner: everything. Contributor: answers & evidence (and the
 * work those feed). Viewer: read-only. */
export type Area = "trustpack" | "requests" | "vendors" | "team" | "settings";
const EDITORS: Record<Area, Role[]> = {
  trustpack: ["Owner", "Contributor"],
  requests: ["Owner", "Contributor"],
  vendors: ["Owner", "Contributor"],
  team: ["Owner"],
  settings: ["Owner"],
};
export function canEdit(role: string, area: Area): boolean {
  return (EDITORS[area] as string[]).includes(role);
}

/** Size of the full question bank a Trust Pack is measured against. */
export const TRUST_PACK_QUESTION_TARGET = 34;
