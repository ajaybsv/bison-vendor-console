import { ALL_APPROVER_ROLES } from "@/lib/approval";
import { CONFIRMATION_AREAS, CONTROLS, EVI_TYPES, FRAMEWORKS, ROLES, type Area } from "@/lib/constants";
import { TIERS } from "@/lib/tiering";

export type EntityKey = "answers" | "evidence" | "team" | "vendors" | "issues";

export type Field = {
  k: string;
  l: string;
  t: "text" | "textarea" | "select" | "date" | "checklist" | "file";
  req?: boolean;
  opts?: readonly string[];
  /** Options supplied at runtime (current team members, or current vendors). */
  optsFrom?: "team" | "vendors";
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
      {
        k: "disruptionToleranceHours",
        l: "Disruption tolerance (hours)",
        t: "text",
        ph: "e.g. 4",
        help: "Maximum time the business can continue if this vendor fails. Compared against the organisation's materiality threshold.",
      },
      {
        k: "customersAffectedPct",
        l: "Customers affected if this vendor fails (%)",
        t: "text",
        ph: "e.g. 35",
      },
      {
        k: "financialImpactEstimate",
        l: "Estimated financial impact (₹)",
        t: "text",
        ph: "e.g. 5000000",
        help: "A reasonable estimate is enough — this feeds the materiality check, not an exact figure.",
      },
      {
        k: "legalEntity",
        l: "Legal entity delivering the service",
        t: "text",
        ph: "Nimbus Cloud Infrastructure Pvt. Ltd.",
        help: "The exact registered company responsible for the service — used to spot vendors that are really the same provider.",
      },
      { k: "parentGroup", l: "Parent / ultimate holding company", t: "text", ph: "Leave blank if independent or unknown" },
      {
        k: "subcontractors",
        l: "Key subcontractors / subprocessors",
        t: "textarea",
        ph: "AWS, Twilio",
        help: "Comma-separated. Important third parties this vendor relies on to deliver the service.",
      },
      {
        k: "cloudProviders",
        l: "Major cloud / technology providers",
        t: "textarea",
        ph: "AWS, Microsoft Azure",
        help: "Comma-separated. Used to flag shared infrastructure dependency across vendors.",
      },
      {
        k: "internalDependencies",
        l: "Internal services affected if this vendor fails",
        t: "textarea",
        ph: "Loan origination platform, customer support portal",
      },
      {
        k: "alternativeProviders",
        l: "Alternative providers available",
        t: "select",
        opts: ["Available", "Limited", "Not practical", "Unknown"],
        help: "Supports dependency risk — limited or no alternatives increase exposure.",
      },
      {
        k: "dependencyReviewStatus",
        l: "Dependency info review status",
        t: "select",
        opts: ["Pending", "Reviewed", "Concern raised"],
        editOnly: true,
        def: "Pending",
      },
      {
        k: "tierOverride",
        l: "Vendor tier override",
        t: "select",
        opts: TIERS,
        help: "Leave blank to use the calculated tier shown on the profile. Set this only to deliberately override it.",
      },
      { k: "tierOverrideReason", l: "Override justification", t: "textarea", ph: "Why the calculated tier doesn't fit this vendor" },
      {
        k: "approvalStatus",
        l: "Approval status",
        t: "select",
        opts: ["Not started", "In review", "Approved", "Changes requested", "Rejected"],
        editOnly: true,
        def: "Not started",
        help: "Required reviewers are calculated from the vendor's own risk profile — shown on the profile.",
      },
      {
        k: "approverSignoffs",
        l: "Approver sign-offs recorded",
        t: "checklist",
        opts: ALL_APPROVER_ROLES,
        help: "Only check a role once that person has actually reviewed and approved — each change is written to the activity log.",
      },
      {
        k: "crossFunctionalConfirmations",
        l: "Internal confirmations received",
        t: "checklist",
        opts: CONFIRMATION_AREAS,
        help: "Confirms each team's own assessment (where it applies) is done — this doesn't duplicate their actual due-diligence.",
      },
      {
        k: "exitPlanStatus",
        l: "Exit plan status",
        t: "select",
        opts: ["Not Required", "Planned", "In progress", "Completed"],
        editOnly: true,
        def: "Not Required",
        help: "Track this once a vendor is being transitioned away from — most vendors stay \"Not Required\".",
      },
      { k: "exitTransitionDate", l: "Exit transition target / completed date", t: "date" },
      {
        k: "dataReturnStatus",
        l: "Data return / deletion status",
        t: "select",
        opts: ["Pending", "Confirmed", "Not Applicable"],
      },
      { k: "exitClosureEvidence", l: "Exit closure evidence", t: "textarea", ph: "Data destruction certificate, transition sign-off, etc." },
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
  issues: {
    key: "issues",
    area: "vendors",
    path: "/issues",
    nav: "Issues & Exceptions",
    singular: "issue",
    intro: "Findings raised against a vendor, tracked through remediation, exceptions and risk acceptance to closure.",
    caption: "Findings and their status",
    columns: [
      ["vendor", "Vendor"],
      ["title", "Finding"],
      ["severity", "Severity"],
      ["status", "Status"],
    ],
    fields: [
      { k: "vendor", l: "Vendor", t: "select", req: true, optsFrom: "vendors" },
      { k: "title", l: "Finding", t: "text", req: true, ph: "No MFA on admin console access" },
      { k: "description", l: "Description", t: "textarea", ph: "What was found, and where" },
      { k: "severity", l: "Severity", t: "select", req: true, opts: ["Critical", "High", "Medium", "Low"] },
      { k: "owner", l: "Internal owner", t: "select", req: true, optsFrom: "team", help: "Who is accountable for getting this remediated." },
      { k: "dueDate", l: "Remediation due", t: "date" },
      {
        k: "status",
        l: "Status",
        t: "select",
        opts: ["Open", "In Progress", "Pending Vendor", "Pending Internal Review", "Closed"],
        editOnly: true,
        def: "Open",
      },
      {
        k: "exceptionJustification",
        l: "Exception justification",
        t: "textarea",
        ph: "Business reason the requirement can't be met, plus any compensating controls",
      },
      {
        k: "exceptionStatus",
        l: "Exception status",
        t: "select",
        opts: ["Draft", "Submitted", "Approved", "Rejected", "Expired", "Withdrawn"],
        help: "Leave blank if no exception has been requested for this finding.",
      },
      { k: "riskAcceptanceRationale", l: "Risk acceptance rationale", t: "textarea", ph: "Why the residual risk is being accepted rather than remediated" },
      { k: "riskAcceptanceExpiry", l: "Risk acceptance expiry", t: "date", help: "The acceptance reopens for review once this date passes." },
      {
        k: "riskAcceptanceStatus",
        l: "Risk acceptance status",
        t: "select",
        opts: ["Not Required", "Pending", "Accepted", "Rejected", "Expired"],
        editOnly: true,
        def: "Not Required",
      },
      {
        k: "closureEvidence",
        l: "Closure evidence",
        t: "textarea",
        ph: "Evidence the remediation was completed and validated",
        editOnly: true,
      },
    ],
  },
};

export type FormValues = Record<string, string | string[]>;
