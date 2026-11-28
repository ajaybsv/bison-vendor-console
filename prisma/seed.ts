import { randomBytes } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/password";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

/** Password for every seeded active account — matches the prefilled sign-in form. */
const DEMO_PASSWORD = "demo-password";

const QUESTIONS = [
  { id: "q1", control: "Vendor Due Diligence", text: "Do you undergo an independent financial audit at least annually?", type: "choice", options: ["Yes", "No", "Partial"], inTrustPack: true, defaultValue: "Yes", sourceAnswerId: 1 },
  { id: "q2", control: "Vendor Due Diligence", text: "Do you hold a current credit rating from a recognised agency?", type: "choice", options: ["Yes", "No"], inTrustPack: true, defaultValue: "Yes", sourceAnswerId: 2 },
  { id: "q3", control: "Vendor Due Diligence", text: "Describe your documented exit and data-return plan on termination.", type: "text", options: [], inTrustPack: true, defaultValue: "Exit Management Policy v3, reviewed annually by the board. Data is returned within 30 days of termination and securely destroyed thereafter.", sourceAnswerId: 3 },
  { id: "q4", control: "Vendor Due Diligence", text: "Are your subcontractors (fourth parties) disclosed and independently assessed?", type: "choice", options: ["Yes", "No", "Partial"], inTrustPack: true, defaultValue: "Yes", sourceAnswerId: 4 },
  { id: "q5", control: "Security Safeguards", text: "Is a current SOC 2 Type II or ISO 27001 certificate in place?", type: "choice", options: ["Yes", "No"], inTrustPack: true, defaultValue: "Yes", sourceAnswerId: 5 },
  { id: "q6", control: "Security Safeguards", text: "Do you conduct annual penetration testing covering all in-scope systems?", type: "choice", options: ["Yes", "No", "Partial"], inTrustPack: true, defaultValue: "Yes", sourceAnswerId: 6 },
  { id: "q7", control: "Security Safeguards", text: "Is data encrypted both in transit and at rest?", type: "choice", options: ["Yes", "No"], inTrustPack: true, defaultValue: "Yes", sourceAnswerId: 7 },
  { id: "q8", control: "Concentration Monitoring", text: "Do you rely on any single sub-provider for a business-critical function?", type: "choice", options: ["Yes", "No"], inTrustPack: true, defaultValue: "No", sourceAnswerId: 8 },
  { id: "q9", control: "Security Safeguards", text: "Does your incident response plan commit to client notification within 72 hours of a confirmed breach?", type: "choice", options: ["Yes", "No", "Partial"], inTrustPack: false, defaultValue: null, sourceAnswerId: null },
  { id: "q10", control: "Concentration Monitoring", text: "What percentage of PayBridge's total annual revenue does this client relationship represent?", type: "text", options: [], inTrustPack: false, defaultValue: null, sourceAnswerId: null },
];

/** Service Provider Evaluation (6A) — the IT & security due-diligence bank we ask our own
 * vendors, straight from the blueprint's master question bank (sheet 6A). Dynamically scoped
 * per vendor by lib/vendor-evaluation.ts — not every vendor gets every domain. */
const YN = ["Yes", "No"];
const VENDOR_EVAL_QUESTIONS = [
  // 1. Organisation & Security Governance
  { id: "GOV-01", control: "1. Organisation & Security Governance", text: "Does the service provider maintain documented information security policies appropriate to the services being provided?", type: "choice", options: YN, why: "Establishes whether security governance is formally defined.", evidenceHint: "Information security policy" },
  { id: "GOV-02", control: "1. Organisation & Security Governance", text: "Is responsibility for information security assigned to an appropriate individual or team?", type: "choice", options: YN, why: "Confirms ownership and accountability for security.", evidenceHint: "Organisation chart / responsibility statement" },
  { id: "GOV-03", control: "1. Organisation & Security Governance", text: "Does the provider perform periodic information security or technology risk assessments?", type: "choice", options: YN, why: "Helps determine whether the provider identifies and manages its own risks.", evidenceHint: "Risk assessment summary" },
  { id: "GOV-04", control: "1. Organisation & Security Governance", text: "Does the provider have a process for managing changes that could materially affect the service or security?", type: "choice", options: YN, why: "Uncontrolled changes can introduce outages or security weaknesses.", evidenceHint: "Change management process" },
  // 2. Information & Cyber Security
  { id: "SEC-01", control: "2. Information & Cyber Security", text: "Does the provider maintain baseline security controls appropriate to the service and associated risks?", type: "choice", options: YN, why: "Provides an overall view of the provider's security control environment.", evidenceHint: "Security policy / assurance report" },
  { id: "SEC-02", control: "2. Information & Cyber Security", text: "Are security events and significant incidents detected, investigated and managed through a defined process?", type: "choice", options: YN, why: "Supports incident readiness and timely response.", evidenceHint: "Incident response procedure" },
  { id: "SEC-03", control: "2. Information & Cyber Security", text: "Does the provider monitor relevant systems and security events?", type: "choice", options: YN, why: "Supports detection of suspicious activity and operational issues.", evidenceHint: "Monitoring/logging overview" },
  { id: "SEC-04", control: "2. Information & Cyber Security", text: "Does the provider have a process to notify the organisation of security incidents that may affect the outsourced service or data?", type: "choice", options: YN, why: "Supports contractual incident escalation and oversight.", evidenceHint: "Incident notification commitment" },
  // 3. Data Protection & Privacy
  { id: "DATA-01", control: "3. Data Protection & Privacy", text: "Will the provider receive, access, view, process, store, transmit or otherwise handle organisational, customer or personal information?", type: "choice", options: YN, why: "Confirms the actual data handling role of the provider.", evidenceHint: "Data flow / service description" },
  { id: "DATA-02", control: "3. Data Protection & Privacy", text: "What categories of information will be handled as part of the service?", type: "text", options: [], why: "Helps determine the sensitivity and applicable assessment depth.", evidenceHint: "Data inventory / data flow" },
  { id: "DATA-03", control: "3. Data Protection & Privacy", text: "Is data protected during transmission using appropriate security measures?", type: "choice", options: YN, why: "Addresses confidentiality and integrity while data moves between systems.", evidenceHint: "Architecture / encryption details" },
  { id: "DATA-04", control: "3. Data Protection & Privacy", text: "Is stored information protected using appropriate security measures?", type: "choice", options: YN, why: "Addresses protection of information held by the provider.", evidenceHint: "Security architecture / encryption details" },
  { id: "DATA-05", control: "3. Data Protection & Privacy", text: "Can the provider identify and appropriately segregate the organisation's information from that of other customers?", type: "choice", options: YN, why: "Important for shared, SaaS and multi-tenant environments.", evidenceHint: "Data segregation architecture" },
  { id: "DATA-06", control: "3. Data Protection & Privacy", text: "Is there a defined process for returning, transferring or securely deleting information at the end of the service?", type: "choice", options: YN, why: "Supports exit planning and safe data handling.", evidenceHint: "Data return/deletion procedure" },
  // 4. Identity & Access Management
  { id: "IAM-01", control: "4. Identity & Access Management", text: "Are access rights granted based on defined roles and business/service requirements?", type: "choice", options: YN, why: "Helps assess whether access is controlled according to need.", evidenceHint: "Access control policy" },
  { id: "IAM-02", control: "4. Identity & Access Management", text: "Are privileged or administrative access rights subject to additional controls?", type: "choice", options: YN, why: "Privileged access can significantly increase impact if compromised.", evidenceHint: "Privileged access process" },
  { id: "IAM-03", control: "4. Identity & Access Management", text: "Is access reviewed or removed when it is no longer required?", type: "choice", options: YN, why: "Reduces risk from unnecessary or outdated access.", evidenceHint: "Access review/offboarding process" },
  { id: "IAM-04", control: "4. Identity & Access Management", text: "Are authentication controls appropriate to the sensitivity of the service and access?", type: "choice", options: YN, why: "Supports protection against unauthorised access.", evidenceHint: "Authentication approach" },
  // 5. Infrastructure & Operations Security
  { id: "OPS-01", control: "5. Infrastructure & Operations Security", text: "Does the provider maintain appropriate processes to operate and maintain the infrastructure supporting the service?", type: "choice", options: YN, why: "Assesses operational stability and service reliability.", evidenceHint: "Operations overview" },
  { id: "OPS-02", control: "5. Infrastructure & Operations Security", text: "Are important systems and infrastructure components maintained and supported?", type: "choice", options: YN, why: "Unsupported components can create security and resilience risks.", evidenceHint: "Asset/support lifecycle evidence" },
  { id: "OPS-03", control: "5. Infrastructure & Operations Security", text: "Does the provider have appropriate backup arrangements for information and systems supporting the service?", type: "choice", options: YN, why: "Supports recovery from loss or disruption.", evidenceHint: "Backup policy / summary" },
  { id: "OPS-04", control: "5. Infrastructure & Operations Security", text: "Are relevant service capacity and availability requirements monitored?", type: "choice", options: YN, why: "Helps identify potential service degradation and availability issues.", evidenceHint: "Monitoring/SLA evidence" },
  // 6. Vulnerability & Security Testing
  { id: "VUL-01", control: "6. Vulnerability & Security Testing", text: "Does the provider identify and manage vulnerabilities affecting systems used to deliver the service?", type: "choice", options: YN, why: "Unmanaged vulnerabilities may expose the organisation or its data.", evidenceHint: "Vulnerability management process" },
  { id: "VUL-02", control: "6. Vulnerability & Security Testing", text: "Are security patches and fixes managed through a defined process?", type: "choice", options: YN, why: "Supports timely remediation of known weaknesses.", evidenceHint: "Patch management process" },
  { id: "VUL-03", control: "6. Vulnerability & Security Testing", text: "Does the provider perform security testing appropriate to the nature of the service?", type: "choice", options: YN, why: "Provides assurance that significant weaknesses are identified.", evidenceHint: "VA/PT or testing summary" },
  // 7. Application & Secure Development
  { id: "APP-01", control: "7. Application & Secure Development", text: "Does the provider follow a defined process for developing and changing applications that support the service?", type: "choice", options: YN, why: "Assesses whether application changes are managed systematically.", evidenceHint: "SDLC/change process" },
  { id: "APP-02", control: "7. Application & Secure Development", text: "Are security considerations incorporated into application development and testing?", type: "choice", options: YN, why: "Helps reduce security weaknesses introduced during development.", evidenceHint: "Secure development practices" },
  { id: "APP-03", control: "7. Application & Secure Development", text: "Are application security issues identified and tracked through remediation?", type: "choice", options: YN, why: "Ensures discovered weaknesses are not ignored.", evidenceHint: "Security issue process" },
  // 8. Cloud & Shared Service Security
  { id: "CLD-01", control: "8. Cloud & Shared Service Security", text: "What cloud or hosting environment supports the service?", type: "text", options: [], why: "Helps understand hosting and infrastructure dependencies.", evidenceHint: "Architecture overview" },
  { id: "CLD-02", control: "8. Cloud & Shared Service Security", text: "Where are the primary service and relevant data hosted?", type: "text", options: [], why: "Supports data location, jurisdiction and resilience assessment.", evidenceHint: "Data centre/cloud region details" },
  { id: "CLD-03", control: "8. Cloud & Shared Service Security", text: "How is separation between different customers or tenants maintained?", type: "text", options: [], why: "Multi-tenant weaknesses may expose one customer's information to another.", evidenceHint: "Tenant segregation design" },
  { id: "CLD-04", control: "8. Cloud & Shared Service Security", text: "Are significant cloud or infrastructure subcontractors disclosed where relevant?", type: "choice", options: YN, why: "Supports supply-chain and concentration risk assessment.", evidenceHint: "Subprocessor/subcontractor list" },
  // 9. Incident Management & Notification
  { id: "INC-01", control: "9. Incident Management & Notification", text: "Does the provider maintain a documented incident management or response process?", type: "choice", options: YN, why: "Assesses preparedness to manage security and service incidents.", evidenceHint: "Incident response procedure" },
  { id: "INC-02", control: "9. Incident Management & Notification", text: "Can the provider support investigation and provide relevant information following an incident affecting the service?", type: "choice", options: YN, why: "Supports effective oversight and response by the organisation.", evidenceHint: "Contractual/process commitment" },
  { id: "INC-03", control: "9. Incident Management & Notification", text: "Are incident notification timelines and escalation contacts defined?", type: "choice", options: YN, why: "Supports timely communication during significant events.", evidenceHint: "Notification matrix / SLA" },
  // 10. BCP & Disaster Recovery
  { id: "BCP-01", control: "10. BCP & Disaster Recovery", text: "Does the provider maintain business continuity arrangements relevant to the service?", type: "choice", options: YN, why: "Assesses preparedness for business disruption.", evidenceHint: "BCP summary" },
  { id: "BCP-02", control: "10. BCP & Disaster Recovery", text: "Does the provider maintain disaster recovery arrangements for technology supporting the service?", type: "choice", options: YN, why: "Assesses ability to recover technology after major disruption.", evidenceHint: "DR plan / summary" },
  { id: "BCP-03", control: "10. BCP & Disaster Recovery", text: "Are BCP/DR arrangements tested periodically?", type: "choice", options: YN, why: "Plans provide greater assurance when tested.", evidenceHint: "Test summary/results" },
  { id: "BCP-04", control: "10. BCP & Disaster Recovery", text: "What recovery commitments or targets apply to the outsourced service, where applicable?", type: "text", options: [], why: "Supports alignment with organisational resilience requirements.", evidenceHint: "SLA / RTO/RPO information" },
  // 11. Subcontractor & Fourth-Party Management
  { id: "TPRM-01", control: "11. Subcontractor & Fourth-Party Management", text: "Does the provider use subcontractors or other key entities to deliver the service?", type: "choice", options: YN, why: "Identifies supply-chain exposure.", evidenceHint: "Subcontractor list" },
  { id: "TPRM-02", control: "11. Subcontractor & Fourth-Party Management", text: "Does the provider perform appropriate oversight of relevant subcontractors?", type: "choice", options: YN, why: "Weak subcontractor management can transfer risk downstream.", evidenceHint: "Third-party management process" },
  { id: "TPRM-03", control: "11. Subcontractor & Fourth-Party Management", text: "Can the provider notify the organisation of material changes involving key subcontractors?", type: "choice", options: YN, why: "Supports ongoing dependency and risk monitoring.", evidenceHint: "Notification commitment" },
  // 12. Compliance, Assurance & Audit
  { id: "ASSR-01", control: "12. Compliance, Assurance & Audit", text: "Does the provider hold relevant independent certifications, assurance reports or assessments?", type: "choice", options: YN, why: "Third-party assurance can support the due diligence process.", evidenceHint: "ISO/SOC/other assurance evidence" },
  { id: "ASSR-02", control: "12. Compliance, Assurance & Audit", text: "Can the provider provide relevant assurance evidence for review?", type: "choice", options: YN, why: "Supports evidence-based due diligence.", evidenceHint: "Current reports/certificates" },
  { id: "ASSR-03", control: "12. Compliance, Assurance & Audit", text: "Are appropriate audit or oversight arrangements available for the outsourced service?", type: "choice", options: YN, why: "Supports ongoing monitoring and audit rights.", evidenceHint: "Contract/audit clause" },
  // 13. Exit & Transition Management
  { id: "EXIT-01", control: "13. Exit & Transition Management", text: "Is there a practical approach to support transition of the service if the arrangement ends?", type: "choice", options: YN, why: "Supports continuity during vendor replacement or termination.", evidenceHint: "Exit/transition approach" },
  { id: "EXIT-02", control: "13. Exit & Transition Management", text: "Can the organisation retrieve relevant data in an agreed format during or at the end of the arrangement?", type: "choice", options: YN, why: "Reduces data portability and lock-in risk.", evidenceHint: "Data export commitment" },
  { id: "EXIT-03", control: "13. Exit & Transition Management", text: "Can the provider support secure deletion or destruction of organisational data and records when required?", type: "choice", options: YN, why: "Supports safe closure and contractual obligations.", evidenceHint: "Deletion/destruction process" },
  { id: "EXIT-04", control: "13. Exit & Transition Management", text: "Will the provider cooperate with the organisation and, where applicable, a replacement provider during transition?", type: "choice", options: YN, why: "Supports smooth transition and reduces operational disruption.", evidenceHint: "Contractual commitment" },
];

async function main() {
  // Fixed ids are referenced across tables (sourceAnswerId, vendorId), so restart sequences too.
  await prisma.$executeRawUnsafe(
    `TRUNCATE organization, team_members, sessions, client_requests, workspace_answers, history, trust_answers,
     evidence_items, questions, vendors, vendor_requests, vendor_responses, vendor_request_evidence, issues, incidents, activity_log
     RESTART IDENTITY CASCADE`
  );

  await prisma.organization.create({
    data: {
      name: "PayBridge Systems",
      regNo: "U65999MH2016PTC281234",
      vendorType: "Payment Gateway",
      tech: "Cloud",
      primaryContact: "Rahul Mehta · rahul@paybridge.in",
      address: "Bandra Kurla Complex, Mumbai, India",
      organisationType: "FinTech",
      isRbiRegulatedEntity: "Yes",
      nbfcLayer: "Not applicable",
      defaultReviewFrequency: "Annually (12 months)",
      materialityDisruptionHours: "8",
      materialityCustomerPct: "20",
      materialityFinancialImpact: "10000000",
    },
  });

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  await prisma.teamMember.createMany({
    data: [
      { name: "Rahul Mehta", email: "rahul@paybridge.in", role: "Owner", status: "Active", passwordHash },
      { name: "Sneha Iyer", email: "sneha@paybridge.in", role: "Contributor", status: "Active", passwordHash },
      { name: "Vikram Shah", email: "vikram@paybridge.in", role: "Viewer", status: "Invited", inviteToken: randomBytes(24).toString("hex") },
    ],
  });

  await prisma.question.createMany({
    data: [
      ...QUESTIONS.map((q, position) => ({ ...q, position, audience: "client" })),
      ...VENDOR_EVAL_QUESTIONS.map((q, i) => ({ ...q, position: QUESTIONS.length + i, audience: "vendor" })),
    ],
  });

  const requests = [
    { client: "HDFC Bank", kind: "Annual reassessment", frameworks: ["RBI", "ISO 27001", "DPDP"], due: "2026-09-18", contact: "Priya N. · Risk & Compliance", qDone: 30, qTotal: 34, evDone: 4, evTotal: 6, status: "In progress", reqEvidence: ["ISO Certificate", "SOC Report", "VAPT Report", "Financial Statements", "Insurance Certificate", "Credit Rating"] },
    { client: "Bajaj Finance", kind: "New onboarding", frameworks: ["RBI", "DPDP"], due: "2026-09-25", contact: "Karan S. · TPRM", qDone: 12, qTotal: 34, evDone: 1, evTotal: 5, status: "In progress", reqEvidence: ["ISO Certificate", "SOC Report", "Financial Statements", "BCP Report", "Insurance Certificate"] },
    { client: "ICICI Securities", kind: "New onboarding", frameworks: ["SEBI CSCRF", "ISO 27001", "DPDP"], due: "2026-10-05", contact: "Meera J. · InfoSec", qDone: 0, qTotal: 29, evDone: 0, evTotal: 5, status: "Not started", reqEvidence: ["ISO Certificate", "SOC Report", "VAPT Report", "Financial Statements", "Credit Rating"] },
  ];
  for (const r of requests) {
    // Pre-confirm the same share of the illustrative question slice as the request's overall progress.
    const confirmedCount = Math.round((r.qDone / r.qTotal) * QUESTIONS.length);
    await prisma.clientRequest.create({
      data: {
        ...r,
        answers: {
          create: QUESTIONS.map((q, idx) => {
            const pre = idx < confirmedCount;
            let value = q.defaultValue;
            if (pre && value == null) value = q.type === "choice" ? q.options[0] : "Provided separately for this request.";
            return { questionId: q.id, value, confirmed: pre };
          }),
        },
      },
    });
  }

  await prisma.historyEntry.createMany({
    data: [
      { client: "Axis Bank", completedOn: "2026-01-12", frameworks: ["RBI", "ISO 27001"], compliance: 94 },
      { client: "Kotak Mahindra", completedOn: "2025-11-03", frameworks: ["RBI", "DPDP"], compliance: 89 },
      { client: "HDFC Bank", completedOn: "2025-04-15", frameworks: ["RBI", "ISO 27001", "DPDP"], compliance: 91 },
    ],
  });

  await prisma.trustAnswer.createMany({
    data: [
      { control: "Vendor Due Diligence", q: "Do you undergo an independent financial audit at least annually?", a: "Yes — audited annually by Deloitte India; latest report FY25-26.", updated: "2026-07-14", used: 3 },
      { control: "Vendor Due Diligence", q: "Do you hold a current credit rating from a recognised agency?", a: "Yes — CRISIL A1+ (reaffirmed Jun 2026).", updated: "2026-06-02", used: 2 },
      { control: "Vendor Due Diligence", q: "Do you maintain a documented exit and data-return plan on termination?", a: "Yes — Exit Management Policy v3, reviewed annually by the board.", updated: "2026-01-20", used: 2 },
      { control: "Vendor Due Diligence", q: "Are your subcontractors (fourth parties) disclosed and independently assessed?", a: "Yes — all sub-processors are listed in our Sub-processor Register and reassessed annually.", updated: "2026-01-20", used: 1 },
      { control: "Security Safeguards", q: "Is a current SOC 2 Type II or ISO 27001 certificate in place?", a: "Yes — ISO 27001:2022 certified (valid through Mar 2027); SOC 2 Type II available on request.", updated: "2025-03-10", used: 3 },
      { control: "Security Safeguards", q: "Do you conduct annual penetration testing covering all in-scope systems?", a: "Yes — quarterly VAPT performed by CyberSec Labs, covering all APIs and edge services.", updated: "2026-09-02", used: 2 },
      { control: "Security Safeguards", q: "Is data encrypted both in transit and at rest?", a: "Yes — AES-256 at rest, TLS 1.2+ in transit across every environment.", updated: "2026-05-11", used: 3 },
      { control: "Concentration Monitoring", q: "Do you rely on any single sub-provider for a business-critical function?", a: "No — payment processing runs multi-cloud across AWS and Azure with automated failover.", updated: "2026-04-30", used: 1 },
    ],
  });

  await prisma.evidenceItem.createMany({
    data: [
      { name: "ISO 27001 Certificate.pdf", type: "ISO Certificate", uploaded: "2025-03-10", expiry: "2027-03-10", freshness: "fresh", usedBy: ["Vendor Due Diligence", "Security Safeguards"] },
      { name: "SOC 2 Type II Report.pdf", type: "SOC Report", uploaded: "2026-06-15", expiry: "2027-06-15", freshness: "fresh", usedBy: ["Security Safeguards"] },
      { name: "VAPT Report — Q3 2025.pdf", type: "VAPT Report", uploaded: "2025-10-18", expiry: "2026-10-18", freshness: "expiring", usedBy: ["Security Safeguards"] },
      { name: "Financial Statements FY25-26.pdf", type: "Financial Statements", uploaded: "2026-08-20", expiry: "2027-08-20", freshness: "fresh", usedBy: ["Vendor Due Diligence"] },
      { name: "Insurance Certificate.pdf", type: "Insurance Certificate", uploaded: "2025-10-30", expiry: "2026-10-30", freshness: "expiring", usedBy: ["Vendor Due Diligence"] },
      { name: "Credit Rating Report.pdf", type: "Credit Rating", uploaded: "2025-11-05", expiry: "2026-11-05", freshness: "expiring", usedBy: ["Vendor Due Diligence"] },
      { name: "BCP Report.pdf", type: "BCP Report", uploaded: "2026-01-12", expiry: "2027-01-12", freshness: "fresh", usedBy: [] },
      {
        name: "Nimbus SOC 2 Type II Report.pdf", type: "SOC Report", vendor: "Nimbus Cloud Infrastructure",
        uploaded: "2025-09-01", expiry: "2026-12-01", freshness: "expiring", usedBy: [],
      },
    ],
  });

  const nimbus = await prisma.vendor.create({
    data: {
      name: "Nimbus Cloud Infrastructure", type: "Cloud hosting",
      servicesDescription: "Primary cloud infrastructure and hosting for production payment systems",
      contactName: "Arjun Mehra", contact: "security@nimbuscloud.io", contactPhone: "+1 415 555 0148",
      owner: "Sneha Iyer", criticality: "Critical", dataSensitivity: "Payment card data (PCI)", frameworks: ["RBI", "ISO 27001"], country: "United States",
      contractStart: "2024-03-01", cadence: "Annually (12 months)", nextReview: "2027-03-01",
      legalEntity: "Nimbus Cloud Infrastructure Inc.", cloudProviders: "AWS, Cloudflare", subcontractors: "Equinix Data Centers",
      internalDependencies: "Loan origination platform, mobile app backend, payment gateway API",
      alternativeProviders: "Limited", dependencyReviewStatus: "Reviewed",
      handlesCustomerData: "Yes", dataCategories: ["Bank or payment details"], dataHandlingActions: ["Store", "Transmit"],
      providesHostingOrSoftware: "Yes", connectsToSystems: "Yes", providesSecurityMonitoring: "No",
      usesSubcontractor: "Yes", operatesCrossBorder: "Yes",
      disruptionToleranceHours: "4", customersAffectedPct: "60", financialImpactEstimate: "15000000",
      approvalStatus: "In review", crossFunctionalConfirmations: ["Finance / ERM", "Information Security"],
      approverSignoffs: ["Business / Relationship Owner", "CISO / Security Head"],
      annualSpend: "12000000",
    },
  });
  // Shares both a cloud provider (AWS) and a subcontractor (Equinix) with Nimbus — the concentration demo.
  const verify = await prisma.vendor.create({
    data: {
      name: "VerifyChain KYC Services", type: "Identity verification (KYC)",
      servicesDescription: "KYC identity verification and document authentication for customer onboarding",
      contactName: "Priya Raman", contact: "compliance@verifychain.com", contactPhone: "+91 98450 22110",
      owner: "Rahul Mehta", criticality: "Critical", dataSensitivity: "Customer PII", frameworks: ["RBI", "DPDP"], country: "India",
      contractStart: "2023-11-01", cadence: "Every 6 months", nextReview: "2026-10-20",
      legalEntity: "VerifyChain Technologies Pvt Ltd", parentGroup: "IDVerify Global Holdings", cloudProviders: "AWS", subcontractors: "Onfido, Equinix Data Centers",
      internalDependencies: "Customer onboarding flow",
      alternativeProviders: "Available", dependencyReviewStatus: "Reviewed",
      annualSpend: "4500000",
      handlesCustomerData: "Yes", dataCategories: ["ID / KYC documents", "Customer name / contact details"], dataHandlingActions: ["Receive", "Process", "Store"],
      providesHostingOrSoftware: "Yes", connectsToSystems: "Yes", providesSecurityMonitoring: "No",
      usesSubcontractor: "Yes", operatesCrossBorder: "No",
    },
  });
  // Swift Support BPO has no requests — the roster derives "Not sent" from that absence.
  await prisma.vendor.create({
    data: {
      name: "Swift Support BPO", type: "Customer support / BPO",
      servicesDescription: "Tier-1 customer support and helpdesk operations",
      contactName: "Meera Nair", contact: "ops@swiftsupportbpo.com", contactPhone: "+91 80 4567 8901",
      owner: "Vikram Shah", criticality: "Medium", dataSensitivity: "Customer PII", frameworks: ["DPDP"], country: "India",
      contractStart: "2025-05-01", cadence: "Annually (12 months)", nextReview: "2026-10-05",
      legalEntity: "Swift Support BPO Pvt Ltd", cloudProviders: "Microsoft Azure",
      internalDependencies: "Customer support portal",
      alternativeProviders: "Available", dependencyReviewStatus: "Pending",
      handlesCustomerData: "Yes", dataCategories: ["Customer name / contact details"], dataHandlingActions: ["Access", "View"],
      providesHostingOrSoftware: "No", connectsToSystems: "Yes", providesSecurityMonitoring: "No",
      usesSubcontractor: "No", operatesCrossBorder: "No",
    },
  });

  const answered = (value: string) => ({ value, confirmed: true });
  const pending = { value: null, confirmed: false };
  const GOV_SEC_DATA_CLD_INC = [
    "1. Organisation & Security Governance",
    "2. Information & Cyber Security",
    "3. Data Protection & Privacy",
    "8. Cloud & Shared Service Security",
    "9. Incident Management & Notification",
  ];
  const GOV_SEC_DATA_IAM = [
    "1. Organisation & Security Governance",
    "2. Information & Cyber Security",
    "3. Data Protection & Privacy",
    "4. Identity & Access Management",
  ];
  const vendorRequests = [
    {
      vendor: nimbus, status: "In progress", cadence: "Annually (12 months)",
      controlsSent: GOV_SEC_DATA_CLD_INC, qDone: 9, qTotal: 21, sentOn: "2026-08-15", due: "2026-09-30", completedOn: null,
      responses: {
        "GOV-01": answered("Yes — Information Security Policy v4, reviewed annually by the board."),
        "GOV-02": answered("Yes — CISO owns security governance; responsibility documented in the org chart."),
        "SEC-01": answered("Yes — SOC 2 Type II (available under NDA) and ISO 27001:2022 certified."),
        "SEC-02": answered("Yes — documented incident response procedure, tested biannually."),
        "DATA-01": answered("Yes — hosts and processes payment card data for the loan origination platform."),
        "DATA-03": answered("Yes — TLS 1.2+ enforced for all data in transit."),
        "DATA-04": answered("Yes — AES-256 at rest across every environment."),
        "CLD-01": answered("Multi-region AWS with Cloudflare at the edge for CDN/DDoS protection."),
        "CLD-02": answered("Primary region: us-east-1 (Virginia); DR region: us-west-2 (Oregon)."),
        "GOV-03": pending, "GOV-04": pending, "SEC-03": pending, "SEC-04": pending,
        "DATA-02": pending, "DATA-05": pending, "DATA-06": pending, "CLD-03": pending, "CLD-04": pending,
        "INC-01": pending, "INC-02": pending, "INC-03": pending,
      },
      evidenceRequested: ["ISO Certificate", "SOC Report", "VAPT Report"], evDone: 2, evTotal: 3,
      evidence: [
        { type: "ISO Certificate", status: "received", fileName: "Nimbus_ISO27001_2026.pdf", receivedOn: "2026-08-20" },
        { type: "SOC Report", status: "received", fileName: "Nimbus_SOC2_TypeII.pdf", receivedOn: "2026-08-22" },
        { type: "VAPT Report", status: "requested", fileName: null, receivedOn: null },
      ],
    },
    {
      vendor: verify, status: "Completed", cadence: "Every 6 months",
      controlsSent: GOV_SEC_DATA_IAM, qDone: 18, qTotal: 18, sentOn: "2025-10-15", due: "2025-12-15", completedOn: "2025-12-15",
      responses: {
        "GOV-01": answered("Yes — Information Security Policy, reviewed annually."),
        "GOV-02": answered("Yes — Head of InfoSec owns security governance."),
        "GOV-03": answered("Yes — annual technology risk assessment performed internally."),
        "GOV-04": answered("Yes — formal change advisory board for any change affecting production KYC systems."),
        "SEC-01": answered("Yes — ISO 27001:2013 certified (transition to the 2022 revision in progress)."),
        "SEC-02": answered("Yes — documented incident management process, with a dedicated response team."),
        "SEC-03": answered("Yes — 24x7 SIEM monitoring across all production systems."),
        "SEC-04": answered("Yes — committed to notify within 48 hours of a confirmed breach."),
        "DATA-01": answered("Yes — receives and processes KYC documents and identity data for customer onboarding."),
        "DATA-02": answered("ID/KYC documents, customer name and contact details, biometric templates."),
        "DATA-03": answered("Yes — TLS 1.2 enforced in transit."),
        "DATA-04": answered("Yes — AES-256 at rest; biometric templates additionally tokenized."),
        "DATA-05": answered("Yes — logical tenant segregation enforced at the database and storage layer."),
        "DATA-06": answered("Documented data retention and deletion policy: KYC records purged 90 days post-offboarding per RBI guidelines."),
        "IAM-01": answered("Yes — role-based access control aligned to job function."),
        "IAM-02": answered("Yes — privileged access requires MFA and is time-bound."),
        "IAM-03": answered("Yes — quarterly access recertification; access revoked on offboarding."),
        "IAM-04": answered("Yes — MFA enforced for all access to production and customer data."),
      },
      evidenceRequested: ["ISO Certificate", "SOC Report"], evDone: 2, evTotal: 2,
      evidence: [
        { type: "ISO Certificate", status: "received", fileName: "VerifyChain_ISO27001_2025.pdf", receivedOn: "2025-12-01" },
        { type: "SOC Report", status: "received", fileName: "VerifyChain_SOC2_2025.pdf", receivedOn: "2025-12-05" },
      ],
    },
    {
      vendor: verify, status: "Completed", cadence: "Every 6 months",
      controlsSent: [...GOV_SEC_DATA_IAM, "8. Cloud & Shared Service Security", "11. Subcontractor & Fourth-Party Management", "12. Compliance, Assurance & Audit"],
      qDone: 28, qTotal: 28, sentOn: "2026-06-01", due: "2026-07-01", completedOn: "2026-06-28",
      responses: {
        "GOV-01": answered("Yes — Information Security Policy, reviewed annually."),
        "GOV-02": answered("Yes — Head of InfoSec owns security governance."),
        "GOV-03": answered("Yes — annual technology risk assessment performed internally."),
        "GOV-04": answered("Yes — formal change advisory board for production changes."),
        "SEC-01": answered("Yes — ISO 27001:2022 certified; SOC 2 Type II in progress, expected Q4 2026."),
        "SEC-02": answered("Yes — documented incident management process with a dedicated response team."),
        "SEC-03": answered("Yes — 24x7 SIEM monitoring across all production systems."),
        "SEC-04": answered("Yes — contractually committed to notify within 24 hours, ahead of the 72-hour requirement."),
        "DATA-01": answered("Yes — receives and processes KYC documents and identity data for customer onboarding."),
        "DATA-02": answered("ID/KYC documents, customer name and contact details, biometric templates."),
        "DATA-03": answered("Yes — TLS 1.3 in transit."),
        "DATA-04": answered("Yes — AES-256 at rest; biometric templates additionally tokenized."),
        "DATA-05": answered("Yes — logical tenant segregation enforced at the database and storage layer."),
        "DATA-06": answered("Documented data retention and deletion policy, with a certificate of destruction issued."),
        "IAM-01": answered("Yes — role-based access control aligned to job function."),
        "IAM-02": answered("Yes — privileged access requires MFA and is time-bound."),
        "IAM-03": answered("Yes — quarterly access recertification; access revoked on offboarding."),
        "IAM-04": answered("Yes — MFA enforced for all access to production and customer data."),
        "CLD-01": answered("Single-region AWS deployment (ap-south-1) behind a managed API gateway."),
        "CLD-02": answered("Primary region: ap-south-1 (Mumbai); backups replicated to ap-south-2 (Hyderabad)."),
        "CLD-03": answered("Yes — dedicated VPC per customer tier with logical data segregation."),
        "CLD-04": answered("Yes — OCR vendor and SMS gateway disclosed as cloud/infrastructure subcontractors."),
        "TPRM-01": answered("Yes — OCR vendor and SMS gateway support document processing and notifications."),
        "TPRM-02": answered("Yes — subcontractors reassessed annually against the same due-diligence bar."),
        "TPRM-03": answered("Yes — contractually required to notify of material subcontractor changes."),
        "ASSR-01": answered("Yes — ISO 27001:2022 certified; SOC 2 Type II report expected Q4 2026."),
        "ASSR-02": answered("Yes — current certificates and audit summary provided under NDA."),
        "ASSR-03": answered("Yes — annual third-party audit rights included in the master services agreement."),
      },
      evidenceRequested: ["ISO Certificate", "VAPT Report", "Insurance Certificate"], evDone: 3, evTotal: 3,
      evidence: [
        { type: "ISO Certificate", status: "received", fileName: "VerifyChain_ISO27001.pdf", receivedOn: "2026-06-15" },
        { type: "VAPT Report", status: "received", fileName: "VerifyChain_VAPT_2026.pdf", receivedOn: "2026-06-20" },
        { type: "Insurance Certificate", status: "received", fileName: "VerifyChain_CyberInsurance.pdf", receivedOn: "2026-06-25" },
      ],
    },
  ];
  for (const { vendor, responses, evidence, ...r } of vendorRequests) {
    await prisma.vendorRequest.create({
      data: {
        ...r,
        vendorId: vendor.id,
        vendorName: vendor.name,
        responses: { create: Object.entries(responses).map(([questionId, v]) => ({ questionId, ...v })) },
        evidence: { create: evidence },
      },
    });
  }

  await prisma.incident.createMany({
    data: [
      {
        vendor: "Nimbus Cloud Infrastructure", title: "Payment gateway API — elevated latency", severity: "High",
        slaBreached: "Yes", status: "Resolved", owner: "Sneha Iyer",
        startedAt: "2026-09-02", resolvedAt: "2026-09-02",
        description: "p99 API latency exceeded 4s for 55 minutes during a peak settlement window, triggering the 99.9% uptime SLA breach clause.",
        impactDescription: "Approximately 12,000 transactions delayed by 2–6 seconds; no failed payments, service credit requested under contract.",
      },
      {
        vendor: "Nimbus Cloud Infrastructure", title: "Scheduled maintenance window overrun", severity: "Low",
        slaBreached: "No", status: "Resolved", owner: "Sneha Iyer",
        startedAt: "2026-06-18", resolvedAt: "2026-06-18",
        description: "Pre-notified maintenance ran 20 minutes past its announced window.",
        impactDescription: "No customer-facing impact; internal monitoring dashboards briefly unavailable.",
      },
      {
        vendor: "VerifyChain KYC Services", title: "KYC document upload failures", severity: "Medium",
        slaBreached: "Not applicable", status: "Monitoring", owner: "Rahul Mehta",
        startedAt: "2026-11-20", resolvedAt: null,
        description: "Intermittent 500 errors on the document upload endpoint affecting roughly 3% of onboarding sessions.",
        impactDescription: "A small share of new customer onboarding attempts needed a retry; vendor has deployed a fix and is being monitored.",
      },
    ],
  });

  console.log(`Seeded. Sign in as rahul@paybridge.in / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
