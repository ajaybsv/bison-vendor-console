"use server";

import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { getOrganization } from "@/lib/data";
import { authorize, type ActionResult } from "@/lib/session";
import { WIZARD_STEPS } from "@/lib/vendor-wizard";

type WizardValues = Record<string, string | string[]>;

/** A reasonable starting guess only — TPRM reviews and corrects this on the vendor's profile.
 * Mirrors the sheet's own "system suggests, specialist validates" principle. */
function suggestDataSensitivity(values: WizardValues): string {
  if (values.handlesCustomerData !== "Yes") return "Internal business data only";
  const categories = Array.isArray(values.dataCategories) ? values.dataCategories : [];
  if (categories.includes("Bank or payment details")) return "Payment card data (PCI)";
  if (categories.includes("ID / KYC documents") || categories.includes("Loan or financial documents")) return "Regulated financial data";
  if (categories.length > 0) return "Customer PII";
  return "Internal business data only";
}

function str(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return null;
  const t = v?.trim();
  return t ? t : null;
}

export async function createVendorFromWizard(values: WizardValues): Promise<ActionResult & { id?: number }> {
  const auth = await authorize("vendors");
  if ("ok" in auth) return auth;
  const { db } = auth;
  const org = await getOrganization(db);

  for (const step of WIZARD_STEPS) {
    for (const f of step.fields) {
      if (!f.req) continue;
      const v = values[f.k];
      if (!v || (typeof v === "string" && !v.trim())) return { ok: false, error: `Fill in "${f.l}"` };
    }
  }

  const data = {
    // ---- Fields the wizard collects directly ----
    name: str(values.name)!,
    brandName: str(values.brandName),
    contactName: str(values.contactName)!,
    contact: str(values.contact)!,
    contactPhone: str(values.contactPhone),
    country: str(values.country),
    servicesDescription: str(values.servicesDescription),
    businessFunction: str(values.businessFunction),
    mainPurpose: str(values.mainPurpose),
    supportsCustomerJourney: str(values.supportsCustomerJourney),
    customerFacing: str(values.customerFacing),
    handlesCustomerData: str(values.handlesCustomerData),
    connectsToSystems: str(values.connectsToSystems),
    providesHostingOrSoftware: str(values.providesHostingOrSoftware),
    providesSecurityMonitoring: str(values.providesSecurityMonitoring),
    usesSubcontractor: str(values.usesSubcontractor),
    operatesCrossBorder: str(values.operatesCrossBorder),
    dataCategories: Array.isArray(values.dataCategories) ? values.dataCategories : [],
    dataHandlingActions: Array.isArray(values.dataHandlingActions) ? values.dataHandlingActions : [],
    processesOnBehalf: str(values.processesOnBehalf),
    disruptionToleranceHours: str(values.disruptionToleranceHours),
    customersAffectedPct: str(values.customersAffectedPct),
    customerImpactDescription: str(values.customerImpactDescription),
    financialImpactEstimate: str(values.financialImpactEstimate),
    replacementCostEstimate: str(values.replacementCostEstimate),
    replacementTimeMonths: str(values.replacementTimeMonths),
    alternativeProviders: str(values.alternativeProviders),
    annualSpend: str(values.annualSpend),
    regulatoryCoreNeed: str(values.regulatoryCoreNeed),
    contractStart: str(values.contractStart),
    contractEndDate: str(values.contractEndDate),
    contractValue: str(values.contractValue),
    knownRegulatoryRequirement: str(values.knownRegulatoryRequirement),
    owner: str(values.owner)!,
    // ---- Required fields the wizard doesn't ask (system output, per the sheet's own
    // design) — a safe starting default; TPRM refines these on the vendor's profile. ----
    type: "Other",
    criticality: "Medium",
    dataSensitivity: suggestDataSensitivity(values),
    cadence: org?.defaultReviewFrequency || "Annually (12 months)",
  };

  const created = await db.vendor.create({ data });
  await logActivity(db, "vendors", "created", data.name, auth.name);
  revalidatePath("/", "layout");
  return { ok: true, id: created.id };
}
