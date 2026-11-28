/** Service Provider Evaluation (6A) — the IT/security due-diligence question bank we send to our
 * own vendors, and the dynamic domain selection that decides which parts of it apply to a given
 * vendor. Mirrors the blueprint's "Dynamic Questionnaire Selection – Product Logic" table: not
 * every vendor should receive every domain — registration and classification outputs (data
 * handling, hosting/cloud role, system access, subcontracting, tier) decide which domains apply,
 * and TPRM reviews/adjusts the system's suggestion before sending. */
import type { Tier } from "@/lib/tiering";
import type { Vendor } from "@/lib/types";

export const VENDOR_EVAL_DOMAINS = [
  "1. Organisation & Security Governance",
  "2. Information & Cyber Security",
  "3. Data Protection & Privacy",
  "4. Identity & Access Management",
  "5. Infrastructure & Operations Security",
  "6. Vulnerability & Security Testing",
  "7. Application & Secure Development",
  "8. Cloud & Shared Service Security",
  "9. Incident Management & Notification",
  "10. BCP & Disaster Recovery",
  "11. Subcontractor & Fourth-Party Management",
  "12. Compliance, Assurance & Audit",
  "13. Exit & Transition Management",
] as const;

export type VendorEvalDomain = (typeof VENDOR_EVAL_DOMAINS)[number];

type VendorLike = Pick<
  Vendor,
  | "handlesCustomerData"
  | "dataCategories"
  | "providesHostingOrSoftware"
  | "connectsToSystems"
  | "providesSecurityMonitoring"
  | "usesSubcontractor"
  | "subcontractors"
  | "operatesCrossBorder"
  | "replacementTimeMonths"
  | "alternativeProviders"
>;

/** One domain's inclusion decision, with the plain-English reason — kept explainable per the
 * blueprint's developer principle, rather than a silent on/off flag. */
export type DomainDecision = { domain: VendorEvalDomain; included: boolean; reason: string };

/** Every vendor gets baseline governance, security and incident-readiness questions regardless
 * of classification — matching "All IT/security-relevant vendors" in the trigger table. */
const BASELINE_DOMAINS: VendorEvalDomain[] = [
  "1. Organisation & Security Governance",
  "2. Information & Cyber Security",
  "9. Incident Management & Notification",
];

/** Decides which domains apply to a vendor, with the reason for each — the system's suggestion;
 * TPRM can still add or remove domains before sending. */
export function domainDecisions(vendor: VendorLike, tier: Tier): DomainDecision[] {
  const handlesData = vendor.handlesCustomerData === "Yes" || vendor.dataCategories.length > 0;
  const isCloudOrHosted = vendor.providesHostingOrSoftware === "Yes";
  const hasSystemAccess = vendor.connectsToSystems === "Yes";
  const hasSubcontractor = vendor.usesSubcontractor === "Yes" || Boolean(vendor.subcontractors);
  const isMaterialTier = tier === "Tier 1 – Critical" || tier === "Tier 2 – High";
  const hardToReplace = vendor.alternativeProviders === "Limited" || vendor.alternativeProviders === "Not practical";

  const reasons: Partial<Record<VendorEvalDomain, string>> = {};
  const include = (d: VendorEvalDomain, reason: string) => {
    reasons[d] = reason;
  };

  for (const d of BASELINE_DOMAINS) include(d, "Applies to all IT/security-relevant vendors");

  if (handlesData) {
    include("3. Data Protection & Privacy", "Vendor handles customer or personal information");
    include("4. Identity & Access Management", "Data handling implies access to that information");
  }
  if (hasSystemAccess) {
    include("4. Identity & Access Management", "Vendor connects to or works on our systems");
    include("5. Infrastructure & Operations Security", "Vendor has system-level access or integration");
  }
  if (isCloudOrHosted) {
    include("8. Cloud & Shared Service Security", "Vendor provides hosting, software or a cloud/SaaS service");
    include("5. Infrastructure & Operations Security", "Vendor operates infrastructure supporting the service");
    include("6. Vulnerability & Security Testing", "Vendor-managed infrastructure or application needs testing assurance");
    include("7. Application & Secure Development", "Vendor provides software/SaaS it develops or changes");
    include("10. BCP & Disaster Recovery", "Cloud/hosted service — continuity and recovery are relevant");
  }
  if (vendor.providesSecurityMonitoring === "Yes") {
    include("2. Information & Cyber Security", "Vendor itself helps monitor or respond to security events");
  }
  if (hasSubcontractor) {
    include("11. Subcontractor & Fourth-Party Management", "Vendor uses subcontractors to help deliver the service");
  }
  if (vendor.operatesCrossBorder === "Yes") {
    include("3. Data Protection & Privacy", "Vendor/service operates across borders — data jurisdiction is relevant");
  }
  if (isMaterialTier) {
    include("10. BCP & Disaster Recovery", `${tier} vendor — continuity assurance required`);
    include("12. Compliance, Assurance & Audit", `${tier} vendor — independent assurance evidence required`);
    include("13. Exit & Transition Management", `${tier} vendor — exit/transition planning required`);
  }
  if (hardToReplace) {
    include("13. Exit & Transition Management", `Alternative providers: ${vendor.alternativeProviders} — exit planning matters more`);
  }

  return VENDOR_EVAL_DOMAINS.map((domain) => ({
    domain,
    included: domain in reasons,
    reason: reasons[domain] ?? "Not indicated by this vendor's registration, classification or tier",
  }));
}

/** Just the domains to pre-check when building a request — `domainDecisions` filtered down. */
export function recommendedDomains(vendor: VendorLike, tier: Tier): VendorEvalDomain[] {
  return domainDecisions(vendor, tier)
    .filter((d) => d.included)
    .map((d) => d.domain);
}
