import type {
  ClientRequest,
  EvidenceItem,
  HistoryEntry,
  Question,
  TeamMember,
  TrustAnswer,
  Vendor,
  VendorRequest,
  VendorRequestEvidence,
  VendorResponse,
} from "@/generated/prisma/client";

export type {
  ClientRequest,
  EvidenceItem,
  HistoryEntry,
  Question,
  TrustAnswer,
  Vendor,
  VendorRequest,
  VendorRequestEvidence,
  VendorResponse,
};

/** A team member as it's safe to send to the browser — no credentials. */
export type Member = Omit<TeamMember, "passwordHash" | "inviteToken" | "createdAt">;

export type CurrentUser = Pick<TeamMember, "id" | "name" | "email" | "role">;

export type VendorRequestFull = VendorRequest & {
  responses: VendorResponse[];
  evidence: VendorRequestEvidence[];
};

export type NavCounts = {
  requests: number;
  history: number;
  answers: number;
  evidence: number;
  vendors: number;
  sentrequests: number;
  team: number;
};
