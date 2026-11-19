/* IT Outsourcing classification (3 / 4A). Vendor type alone never decides this — the
   service description is checked against the blueprint's included and excluded IT
   Outsourcing categories, and anything that matches neither falls to a review flag
   rather than a guessed outcome. */
import type { Vendor } from "@/lib/types";

export type ClassificationOutcome =
  | "Potential IT Outsourcing"
  | "IT-related — Excluded"
  | "Not IT-related"
  | "IT-related — TPRM Review Required";

export type ClassificationResult = { outcome: ClassificationOutcome; reason: string };

const EXCLUSION_KEYWORDS: [RegExp, string][] = [
  [/\b(vapt|penetration test|pen test|security audit|information systems audit|security review)\b/i, "External audit / VAPT service — listed exclusion"],
  [/\b(sms gateway|bulk sms)\b/i, "SMS gateway / bulk SMS provider — listed exclusion"],
  [/\boem maintenance|patches? for its own product\b/i, "OEM maintenance / patches for its own product — listed exclusion"],
  [/\boff.the.shelf|licen[cs]ed software|subscription software/i, "Licensed / off-the-shelf software with minimal customisation — listed exclusion"],
  [/\bcorporate internet banking\b/i, "Corporate internet banking obtained as a customer — listed exclusion"],
  [/\b(swift|reuters|bloomberg)\b/i, "Regulator / market-infrastructure platform — listed exclusion"],
  [/\b(business correspondent|payroll processing|statement printing)\b/i, "Business Correspondent / payroll / statement printing — listed exclusion"],
  [/\bhardware procurement|procur(e|ing)\b.*\bhardware\b/i, "Procurement of IT hardware — listed exclusion"],
];

const INCLUSION_KEYWORDS: [RegExp, string][] = [
  [/\b(cloud|hosting|infrastructure)\b/i, "Cloud computing / IT infrastructure service"],
  [/\bdata ?cent(re|er)\b/i, "Data centre services and operations"],
  [/\b(network security|managed security|\bsoc\b|security monitoring)\b/i, "Network and security solutions / managed security service"],
  [/\b(application development|software development|app development|maintenance and testing)\b/i, "Application development, maintenance and testing"],
  [/\bpayment (gateway|ecosystem|infrastructure)\b/i, "IT infrastructure supporting the payment ecosystem"],
];

/** Fallback by vendor type only when the description itself gives no signal either way. */
const TYPE_DEFAULT: Partial<Record<string, ClassificationOutcome>> = {
  "Cloud hosting": "Potential IT Outsourcing",
  "Data centre": "Potential IT Outsourcing",
  "Payment processing": "Potential IT Outsourcing",
  "Identity verification (KYC)": "Not IT-related",
  "Customer support / BPO": "Not IT-related",
};

export function classify(vendor: Pick<Vendor, "type" | "servicesDescription">): ClassificationResult {
  const text = `${vendor.type} ${vendor.servicesDescription ?? ""}`;

  for (const [re, reason] of EXCLUSION_KEYWORDS) {
    if (re.test(text)) return { outcome: "IT-related — Excluded", reason };
  }
  for (const [re, reason] of INCLUSION_KEYWORDS) {
    if (re.test(text)) return { outcome: "Potential IT Outsourcing", reason };
  }
  const byType = TYPE_DEFAULT[vendor.type];
  if (byType) return { outcome: byType, reason: `Vendor type: ${vendor.type}` };

  return {
    outcome: "IT-related — TPRM Review Required",
    reason: "The service description doesn't clearly match an included or excluded IT Outsourcing category",
  };
}
