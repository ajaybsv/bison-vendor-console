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

async function main() {
  // Fixed ids are referenced across tables (sourceAnswerId, vendorId), so restart sequences too.
  await prisma.$executeRawUnsafe(
    `TRUNCATE organization, team_members, sessions, client_requests, workspace_answers, history, trust_answers,
     evidence_items, questions, vendors, vendor_requests, vendor_responses, vendor_request_evidence
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

  await prisma.question.createMany({ data: QUESTIONS.map((q, position) => ({ ...q, position })) });

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
    ],
  });

  const nimbus = await prisma.vendor.create({
    data: {
      name: "Nimbus Cloud Infrastructure", type: "Cloud hosting",
      servicesDescription: "Primary cloud infrastructure and hosting for production payment systems",
      contactName: "Arjun Mehra", contact: "security@nimbuscloud.io", contactPhone: "+1 415 555 0148",
      owner: "Sneha Iyer", criticality: "Critical", dataSensitivity: "Payment card data (PCI)", frameworks: ["RBI", "ISO 27001"], country: "United States",
      contractStart: "2024-03-01", cadence: "Annually (12 months)", nextReview: "2027-03-01",
    },
  });
  const verify = await prisma.vendor.create({
    data: {
      name: "VerifyChain KYC Services", type: "Identity verification (KYC)",
      servicesDescription: "KYC identity verification and document authentication for customer onboarding",
      contactName: "Priya Raman", contact: "compliance@verifychain.com", contactPhone: "+91 98450 22110",
      owner: "Rahul Mehta", criticality: "Critical", dataSensitivity: "Customer PII", frameworks: ["RBI", "DPDP"], country: "India",
      contractStart: "2023-11-01", cadence: "Every 6 months", nextReview: "2026-10-20",
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
    },
  });

  const answered = (value: string) => ({ value, confirmed: true });
  const pending = { value: null, confirmed: false };
  const vendorRequests = [
    {
      vendor: nimbus, status: "In progress", cadence: "Annually (12 months)",
      controlsSent: ["Vendor Due Diligence", "Security Safeguards"], qDone: 5, qTotal: 8, sentOn: "2026-08-15", due: "2026-09-30", completedOn: null,
      responses: {
        q1: answered("Yes — audited annually by KPMG US; SOC 1 Type II report available."),
        q2: answered("Yes — S&P BBB+ (reaffirmed Jan 2026)."),
        q3: answered("Formal offboarding runbook: full data export within 15 days of termination, followed by cryptographic erasure and a signed destruction certificate."),
        q4: answered("Yes — all subprocessors listed in our public Subprocessor Directory, updated quarterly."),
        q5: answered("Yes — SOC 2 Type II (available under NDA) and ISO 27001:2022 certified."),
        q6: pending, q7: pending, q9: pending,
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
      controlsSent: ["Vendor Due Diligence", "Security Safeguards"], qDone: 8, qTotal: 8, sentOn: "2025-10-15", due: "2025-12-15", completedOn: "2025-12-15",
      responses: {
        q1: answered("Yes — audited annually by Grant Thornton India; FY24-25 report on file."),
        q2: answered("Yes — ICRA A (reaffirmed Sep 2025)."),
        q3: answered("Documented data retention and deletion policy: KYC records purged 90 days post-offboarding per RBI guidelines."),
        q4: answered("Yes — sub-processors (OCR vendor, SMS gateway) disclosed."),
        q5: answered("Yes — ISO 27001:2013 certified (transition to the 2022 revision in progress)."),
        q6: answered("Yes — annual VAPT by an empanelled auditor."),
        q7: answered("Yes — AES-256 at rest, TLS 1.2 in transit."),
        q9: answered("Yes — committed to notify within 48 hours of a confirmed breach."),
      },
      evidenceRequested: ["ISO Certificate", "SOC Report"], evDone: 2, evTotal: 2,
      evidence: [
        { type: "ISO Certificate", status: "received", fileName: "VerifyChain_ISO27001_2025.pdf", receivedOn: "2025-12-01" },
        { type: "SOC Report", status: "received", fileName: "VerifyChain_SOC2_2025.pdf", receivedOn: "2025-12-05" },
      ],
    },
    {
      vendor: verify, status: "Completed", cadence: "Every 6 months",
      controlsSent: ["Vendor Due Diligence", "Security Safeguards", "Concentration Monitoring"], qDone: 10, qTotal: 10, sentOn: "2026-06-01", due: "2026-07-01", completedOn: "2026-06-28",
      responses: {
        q1: answered("Yes — audited annually by Grant Thornton India; latest report FY25-26."),
        q2: answered("Yes — ICRA A+ (reaffirmed Mar 2026)."),
        q3: answered("Documented data retention and deletion policy: KYC records purged 90 days post-offboarding per RBI guidelines, with a certificate of destruction issued."),
        q4: answered("Yes — sub-processors (OCR vendor, SMS gateway) disclosed and reassessed annually."),
        q5: answered("Yes — ISO 27001:2022 certified; SOC 2 Type II in progress, expected Q4 2026."),
        q6: answered("Yes — biannual VAPT by a CERT-In empanelled auditor."),
        q7: answered("Yes — AES-256 at rest, TLS 1.3 in transit; biometric templates additionally tokenized."),
        q9: answered("Yes — contractually committed to notify within 24 hours, ahead of the 72-hour requirement."),
        q8: answered("No — OCR and liveness-detection vendors are dual-sourced."),
        q10: answered("Approximately 8% of VerifyChain's total annual revenue."),
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

  console.log(`Seeded. Sign in as rahul@paybridge.in / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
