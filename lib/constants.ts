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

/** RBI/NBFC regulatory profile (org onboarding, phase 1) — activates RBI outsourcing-specific
 * context; organisations this doesn't apply to leave it unset. */
export const ORGANISATION_TYPES = ["NBFC", "Bank", "FinTech", "RE", "Other"];
export const YES_NO_NOTSURE = ["Yes", "No", "Not sure"];
export const NBFC_LAYERS = ["Base Layer", "Middle Layer", "Upper Layer", "Top Layer", "Not applicable"];
/** The starting cadence for a new vendor — same option set as a vendor's own reassessment
 * cadence, so it's a real, usable default rather than a separate abstract model. */
export const REVIEW_FREQUENCIES = ["Quarterly (3 months)", "Every 6 months", "Annually (12 months)"];

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
