import { CONTROLS, EVI_TYPES, FRAMEWORKS, ROLES, type Area } from "@/lib/constants";

export type EntityKey = "answers" | "evidence" | "team" | "vendors";

export type Field = {
  k: string;
  l: string;
  t: "text" | "textarea" | "select" | "date" | "checklist" | "file";
  req?: boolean;
  opts?: readonly string[];
  /** Options supplied at runtime (e.g. current team members). */
  optsFrom?: "team";
  ph?: string;
  help?: string;
  /** Default new records to today's date. */
  today?: boolean;
  /** Only shown when editing; new records get `def`. */
  editOnly?: boolean;
  def?: string;
};

export type EntitySchema = {
  key: EntityKey;
  area: Area;
  path: string;
  nav: string;
  singular: string;
  intro: string;
  caption: string;
  columns: [string, string][];
  fields: Field[];
};

export const SCHEMA: Record<EntityKey, EntitySchema> = {
  answers: {
    key: "answers",
    area: "trustpack",
    path: "/answers",
    nav: "Answers",
    singular: "answer",
    intro: "Answers you've confirmed once, grouped by control. BISON reuses these automatically wherever a request asks a matching question.",
    caption: "Confirmed answers",
    columns: [
      ["control", "Control"],
      ["q", "Question"],
      ["a", "Your answer"],
      ["used", "Used in"],
    ],
    fields: [
      { k: "control", l: "Linked control", t: "select", req: true, opts: CONTROLS },
      { k: "q", l: "Question", t: "textarea", req: true, ph: "Do you undergo an independent financial audit annually?" },
      { k: "a", l: "Your answer", t: "textarea", req: true },
      { k: "updated", l: "Last updated", t: "date", today: true },
    ],
  },
  evidence: {
    key: "evidence",
    area: "trustpack",
    path: "/evidence",
    nav: "Evidence",
    singular: "evidence item",
    intro: "Documents you keep on file. Matched automatically against whatever a request asks for, so you upload once and reuse everywhere.",
    caption: "Evidence on file",
    columns: [
      ["name", "Document"],
      ["type", "Type"],
      ["expiry", "Expires"],
      ["freshness", "Status"],
    ],
    fields: [
      { k: "name", l: "Document name", t: "text", req: true, ph: "SOC 2 Type II Report.pdf" },
      { k: "type", l: "Evidence type", t: "select", req: true, opts: EVI_TYPES },
      { k: "uploaded", l: "Uploaded", t: "date", today: true },
      { k: "expiry", l: "Expiry date", t: "date" },
      { k: "file", l: "File", t: "file" },
      { k: "freshness", l: "Status", t: "select", opts: ["fresh", "expiring", "expired"], editOnly: true, def: "fresh" },
    ],
  },
  team: {
    key: "team",
    area: "team",
    path: "/team",
    nav: "Team & access",
    singular: "team member",
    intro: "People at PayBridge Systems who can log in and work on requests here.",
    caption: "People with access",
    columns: [
      ["name", "Name"],
      ["email", "Email"],
      ["role", "Role"],
      ["status", "Status"],
    ],
    fields: [
      { k: "name", l: "Name", t: "text", req: true },
      { k: "email", l: "Email", t: "text", req: true, ph: "name@paybridge.in" },
      { k: "role", l: "Role", t: "select", req: true, opts: ROLES, help: "Owner: everything. Contributor: answers & evidence. Viewer: read-only." },
      { k: "status", l: "Status", t: "select", opts: ["Active", "Invited", "Disabled"], editOnly: true, def: "Invited" },
    ],
  },
  vendors: {
    key: "vendors",
    area: "vendors",
    path: "/vendors",
    nav: "Vendors",
    singular: "vendor",
    intro: "Vendors and subcontractors PayBridge relies on. This is the profile — sending a request and tracking responses happens on Sent Requests.",
    caption: "Vendors PayBridge assesses",
    columns: [
      ["name", "Vendor"],
      ["type", "Type"],
      ["contact", "Contact"],
    ],
    fields: [
      { k: "name", l: "Vendor name", t: "text", req: true, ph: "Nimbus Cloud Infrastructure" },
      {
        k: "type",
        l: "Vendor type",
        t: "select",
        req: true,
        opts: ["Cloud hosting", "Data centre", "Identity verification (KYC)", "Customer support / BPO", "Payment processing", "Software vendor", "Professional services", "Other"],
      },
      { k: "servicesDescription", l: "What do they do for PayBridge?", t: "text", ph: "Primary cloud infrastructure and hosting for production systems" },
      { k: "contactName", l: "Contact name", t: "text", req: true, ph: "Jordan Lee" },
      { k: "contact", l: "Contact email", t: "text", req: true, ph: "contact@vendor.com" },
      { k: "contactPhone", l: "Contact phone", t: "text", ph: "+91 98200 11223" },
      { k: "owner", l: "Relationship owner at PayBridge", t: "select", req: true, optsFrom: "team", help: "Who internally is accountable for this vendor." },
      {
        k: "criticality",
        l: "Criticality",
        t: "select",
        req: true,
        opts: ["Critical", "High", "Medium", "Low"],
        help: "How essential this vendor is to PayBridge operating — drives assessment depth and frequency.",
      },
      {
        k: "dataSensitivity",
        l: "Data accessed",
        t: "select",
        req: true,
        opts: ["No sensitive data", "Internal business data only", "Customer PII", "Payment card data (PCI)", "Regulated financial data"],
      },
      { k: "frameworks", l: "Applicable frameworks", t: "checklist", opts: FRAMEWORKS, help: "Which of your own regulatory obligations this vendor touches." },
      { k: "country", l: "Country / jurisdiction", t: "select", opts: ["India", "United States", "Singapore", "United Kingdom", "Ireland", "Germany", "Other"] },
      { k: "contractStart", l: "Contract start", t: "date" },
      {
        k: "cadence",
        l: "Reassessment cadence",
        t: "select",
        req: true,
        opts: ["Quarterly (3 months)", "Every 6 months", "Annually (12 months)"],
        help: "How often this vendor must be reassessed — drives the next-review date.",
      },
      { k: "nextReview", l: "Next scheduled review", t: "date" },
    ],
  },
};

export type FormValues = Record<string, string | string[]>;
