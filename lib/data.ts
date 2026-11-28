import "server-only";
import type { Member, NavCounts, TenantDb } from "@/lib/types";

const memberSelect = { id: true, name: true, email: true, role: true, status: true } as const;

export async function navCounts(db: TenantDb): Promise<NavCounts> {
  const [requests, history, answers, evidence, vendors, sentrequests, issues, incidents, team] = await Promise.all([
    db.clientRequest.count(),
    db.historyEntry.count(),
    db.trustAnswer.count(),
    db.evidenceItem.count(),
    db.vendor.count(),
    db.vendorRequest.count(),
    db.issue.count(),
    db.incident.count({ where: { status: { not: "Resolved" } } }),
    db.teamMember.count(),
  ]);
  return { requests, history, answers, evidence, vendors, sentrequests, issues, incidents, team };
}

export function getOrganization(db: TenantDb) {
  return db.organization.findFirst({ orderBy: { id: "asc" } });
}

/* ---------- requests from clients ---------- */
export function listClientRequests(db: TenantDb) {
  return db.clientRequest.findMany({ orderBy: { id: "asc" } });
}

export function getClientRequest(db: TenantDb, id: number) {
  return db.clientRequest.findUnique({ where: { id }, include: { answers: true } });
}

export function listHistory(db: TenantDb) {
  return db.historyEntry.findMany({ orderBy: { completedOn: "desc" } });
}

/* ---------- Trust Pack ---------- */
export function listTrustAnswers(db: TenantDb) {
  return db.trustAnswer.findMany({ orderBy: { id: "asc" } });
}

export function listEvidence(db: TenantDb) {
  return db.evidenceItem.findMany({ orderBy: { id: "asc" } });
}

export function listQuestions(db: TenantDb) {
  return db.question.findMany({ where: { audience: "client" }, orderBy: { position: "asc" } });
}

/* ---------- Service Provider Evaluation (6A) — the bank we ask our own vendors ---------- */
export function listVendorEvalQuestions(db: TenantDb) {
  return db.question.findMany({ where: { audience: "vendor" }, orderBy: { position: "asc" } });
}

/* ---------- team ---------- */
export function listTeam(db: TenantDb): Promise<Member[]> {
  return db.teamMember.findMany({ orderBy: { id: "asc" }, select: memberSelect });
}

/** The most recently created member still waiting on their invite, with the token
 * the sign-in screen links to for the email preview. */
export function latestPendingInvite(db: TenantDb) {
  return db.teamMember.findFirst({
    where: { status: "Invited", inviteToken: { not: null } },
    orderBy: { id: "desc" },
    select: { ...memberSelect, inviteToken: true },
  });
}

export function getInvite(db: TenantDb, token: string) {
  return db.teamMember.findFirst({
    where: { inviteToken: token, status: "Invited" },
    select: { ...memberSelect, inviteToken: true },
  });
}

/* ---------- our vendors ---------- */
export function listVendors(db: TenantDb) {
  return db.vendor.findMany({ orderBy: { id: "asc" } });
}

export function getVendor(db: TenantDb, id: number) {
  return db.vendor.findUnique({ where: { id } });
}

/** Lightweight cycle rows — enough to derive every vendor's status and timeline. */
export function listVendorRequests(db: TenantDb) {
  return db.vendorRequest.findMany({ orderBy: { sentOn: "desc" } });
}

export function getVendorRequest(db: TenantDb, id: number) {
  return db.vendorRequest.findUnique({
    where: { id },
    include: { responses: true, evidence: { orderBy: { id: "asc" } } },
  });
}

/* ---------- issues & exceptions ---------- */
export function listIssues(db: TenantDb) {
  return db.issue.findMany({ orderBy: { id: "desc" } });
}

/* ---------- incidents & SLA tracking ---------- */
export function listIncidents(db: TenantDb) {
  return db.incident.findMany({ orderBy: { id: "desc" } });
}
