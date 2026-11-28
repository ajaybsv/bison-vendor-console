/** Field + step config for the business-friendly Vendor Registration wizard (sheet 2 of the
 * TPRM blueprint). Deliberately separate from lib/schema.ts's flat entity form — this one has
 * conditional steps and plain-language copy aimed at a business requester, not TPRM staff. */

export type WizardField = {
  k: string;
  l: string;
  t: "text" | "textarea" | "select" | "checklist";
  req?: boolean;
  opts?: readonly string[];
  ph?: string;
  help?: string;
};

export type WizardStep = {
  id: string;
  title: string;
  intro: string;
  fields: WizardField[];
};

const YES_NO_UNSURE = ["Yes", "No", "Not sure"] as const;

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: "about",
    title: "About the vendor",
    intro: "Tell us who the vendor is.",
    fields: [
      { k: "name", l: "Vendor legal name", t: "text", req: true, ph: "XYZ Technologies Private Limited" },
      { k: "brandName", l: "Vendor brand / common name", t: "text", ph: "Leave blank if same as the legal name" },
      { k: "contactName", l: "Vendor contact name", t: "text", req: true, ph: "Jordan Lee" },
      { k: "contact", l: "Vendor contact email", t: "text", req: true, ph: "contact@vendor.com" },
      { k: "contactPhone", l: "Vendor contact phone", t: "text" },
      { k: "country", l: "Vendor country / registered location", t: "select", opts: ["India", "United States", "Singapore", "United Kingdom", "Ireland", "Germany", "Other"] },
    ],
  },
  {
    id: "what",
    title: "What does the vendor do for us?",
    intro: "Use simple business language — no technical knowledge required.",
    fields: [
      {
        k: "servicesDescription",
        l: "Describe the service in simple words",
        t: "textarea",
        req: true,
        ph: "Provides servers and hosting for our loan application website",
        help: "The most important field — explain what the vendor does, not a technical category.",
      },
      { k: "businessFunction", l: "Which business team / function will use this service?", t: "text", ph: "Technology, Operations, Loan Processing" },
      { k: "mainPurpose", l: "What is the main purpose of this vendor?", t: "text", ph: "Run an application; process customer documents; provide security monitoring" },
      { k: "supportsCustomerJourney", l: "Will this vendor support an important business service or customer journey?", t: "select", opts: YES_NO_UNSURE },
      { k: "customerFacing", l: "Does the vendor provide the service directly to customers on our behalf?", t: "select", opts: YES_NO_UNSURE },
    ],
  },
  {
    id: "service",
    title: "Simple service & information questions",
    intro: "Answer what you know — “Not sure” is always fine.",
    fields: [
      {
        k: "handlesCustomerData",
        l: "Will the vendor receive, access, view, process, store or transmit any customer or personal information?",
        t: "select",
        opts: YES_NO_UNSURE,
      },
      { k: "connectsToSystems", l: "Will the vendor connect to or work on any of our applications, websites or IT systems?", t: "select", opts: YES_NO_UNSURE },
      { k: "providesHostingOrSoftware", l: "Does the vendor provide hosting, software, servers or another technology service?", t: "select", opts: YES_NO_UNSURE },
      { k: "providesSecurityMonitoring", l: "Does the vendor help monitor, detect or respond to cybersecurity events?", t: "select", opts: YES_NO_UNSURE },
      { k: "usesSubcontractor", l: "Will another company help this vendor deliver the service?", t: "select", opts: YES_NO_UNSURE },
      { k: "operatesCrossBorder", l: "Will the vendor or its service operate from outside our primary country?", t: "select", opts: YES_NO_UNSURE },
    ],
  },
  {
    id: "data",
    title: "Data handling — a few more details",
    intro: "You said the vendor may handle customer or personal information, so we need a little more detail.",
    // Only shown when handlesCustomerData === "Yes" — see RegistrationWizard.
    fields: [
      {
        k: "dataCategories",
        l: "What categories of information will be handled?",
        t: "checklist",
        opts: ["Customer name / contact details", "Loan or financial documents", "Bank or payment details", "ID / KYC documents", "Employee data", "Other personal data"],
      },
      {
        k: "dataHandlingActions",
        l: "What will the vendor do with the information?",
        t: "checklist",
        opts: ["Receive", "Access", "View", "Process", "Store", "Transmit", "Delete"],
      },
      { k: "processesOnBehalf", l: "Will the vendor process customer information on behalf of the organisation?", t: "select", opts: YES_NO_UNSURE },
    ],
  },
  {
    id: "impact",
    title: "Business impact information",
    intro: "Use numbers wherever possible — this feeds the materiality and tiering checks automatically.",
    fields: [
      { k: "disruptionToleranceHours", l: "If this vendor becomes unavailable, how long can the business continue normally (hours)?", t: "text", ph: "e.g. 4" },
      { k: "customersAffectedPct", l: "Approximately how many customers could be affected if this vendor fails (%)?", t: "text", ph: "e.g. 35" },
      { k: "customerImpactDescription", l: "What could happen to customers if the vendor fails?", t: "textarea", ph: "Loan application unavailable; payment delayed" },
      { k: "financialImpactEstimate", l: "Estimated financial impact if the service is unavailable (₹)", t: "text", ph: "e.g. 5000000" },
      { k: "replacementCostEstimate", l: "How much would it cost to replace or move away from this vendor (₹)?", t: "text" },
      { k: "replacementTimeMonths", l: "How long would it take to replace this vendor (months)?", t: "text", ph: "e.g. 3" },
      { k: "alternativeProviders", l: "How many realistic alternative providers are available?", t: "select", opts: ["Available", "Limited", "Not practical", "Unknown"] },
      { k: "annualSpend", l: "Annual expected spend with this vendor (₹)", t: "text", ph: "e.g. 2500000" },
      { k: "regulatoryCoreNeed", l: "Is this vendor needed for a regulatory, customer-facing or core business service?", t: "select", opts: YES_NO_UNSURE },
    ],
  },
  {
    id: "contract",
    title: "Contract & review details",
    intro: "Basic lifecycle information.",
    fields: [
      { k: "contractStart", l: "Expected contract start date", t: "text", ph: "YYYY-MM-DD" },
      { k: "contractEndDate", l: "Expected contract end / renewal date", t: "text", ph: "YYYY-MM-DD" },
      { k: "contractValue", l: "Estimated total contract value (₹)", t: "text" },
      { k: "knownRegulatoryRequirement", l: "Any known regulatory, customer or contractual requirement?", t: "textarea" },
      { k: "owner", l: "Relationship owner at our organisation", t: "select", req: true, help: "Who internally is accountable for this vendor." },
    ],
  },
];

export const DATA_HANDLING_STEP_ID = "data";
export const DATA_HANDLING_TRIGGER_FIELD = "handlesCustomerData";
