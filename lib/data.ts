import "server-only";
import { prisma } from "@/lib/prisma";
import type { Member, NavCounts } from "@/lib/types";

const memberSelect = { id: true, name: true, email: true, role: true, status: true } as const;

export async function navCounts(): Promise<NavCounts> {
  const [requests, history, answers, evidence, vendors, sentrequests, team] = await Promise.all([
    prisma.clientRequest.count(),
    prisma.historyEntry.count(),
    prisma.trustAnswer.count(),
    prisma.evidenceItem.count(),
    prisma.vendor.count(),
    prisma.vendorRequest.count(),
    prisma.teamMember.count(),
  ]);
  return { requests, history, answers, evidence, vendors, sentrequests, team };
}

export function getOrganization() {
  return prisma.organization.findFirst({ orderBy: { id: "asc" } });
}

/* ---------- requests from clients ---------- */
export function listClientRequests() {
  return prisma.clientRequest.findMany({ orderBy: { id: "asc" } });
}

export function getClientRequest(id: number) {
  return prisma.clientRequest.findUnique({ where: { id }, include: { answers: true } });
}

export function listHistory() {
  return prisma.historyEntry.findMany({ orderBy: { completedOn: "desc" } });
}

/* ---------- Trust Pack ---------- */
export function listTrustAnswers() {
  return prisma.trustAnswer.findMany({ orderBy: { id: "asc" } });
}

export function listEvidence() {
  return prisma.evidenceItem.findMany({ orderBy: { id: "asc" } });
}

export function listQuestions() {
  return prisma.question.findMany({ orderBy: { position: "asc" } });
}

/* ---------- team ---------- */
export function listTeam(): Promise<Member[]> {
  return prisma.teamMember.findMany({ orderBy: { id: "asc" }, select: memberSelect });
}

/** The most recently created member still waiting on their invite, with the token
 * the sign-in screen links to for the email preview. */
export function latestPendingInvite() {
  return prisma.teamMember.findFirst({
    where: { status: "Invited", inviteToken: { not: null } },
    orderBy: { id: "desc" },
    select: { ...memberSelect, inviteToken: true },
  });
}

export function getInvite(token: string) {
  return prisma.teamMember.findFirst({
    where: { inviteToken: token, status: "Invited" },
    select: { ...memberSelect, inviteToken: true },
  });
}

/* ---------- our vendors ---------- */
export function listVendors() {
  return prisma.vendor.findMany({ orderBy: { id: "asc" } });
}

export function getVendor(id: number) {
  return prisma.vendor.findUnique({ where: { id } });
}

/** Lightweight cycle rows — enough to derive every vendor's status and timeline. */
export function listVendorRequests() {
  return prisma.vendorRequest.findMany({ orderBy: { sentOn: "desc" } });
}

export function getVendorRequest(id: number) {
  return prisma.vendorRequest.findUnique({
    where: { id },
    include: { responses: true, evidence: { orderBy: { id: "asc" } } },
  });
}
