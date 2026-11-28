"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity";
import { BOARD_TRIGGERS, CEO_TRIGGERS } from "@/lib/approval";
import { VENDOR_TYPES } from "@/lib/constants";
import { authorize, type ActionResult } from "@/lib/session";
import { TIERS } from "@/lib/tiering";
import type { TenantDb } from "@/lib/types";

export type OrgProfile = {
  name: string;
  regNo: string;
  vendorType: string;
  primaryContact: string;
  address: string;
};

export type NotificationKey = "notifReminders" | "notifDigest" | "notifExpiry";

export type MaterialityThresholds = {
  materialityDisruptionHours: string;
  materialityCustomerPct: string;
  materialityFinancialImpact: string;
};

export type GovernanceRules = {
  tierConcentrationTrigger: string;
  tierLimitedAlternativesTrigger: string;
  approvalCeoTrigger: string;
  approvalBoardTrigger: string;
};

async function orgId(db: TenantDb): Promise<number | null> {
  const org = await db.organization.findFirst({ orderBy: { id: "asc" }, select: { id: true } });
  return org?.id ?? null;
}

export async function saveOrgProfile(profile: OrgProfile): Promise<ActionResult> {
  const auth = await authorize("settings");
  if ("ok" in auth) return auth;
  const { db } = auth;
  if (!profile.name.trim()) return { ok: false, error: 'Fill in "Organization name"' };
  if (!VENDOR_TYPES.includes(profile.vendorType)) return { ok: false, error: "Pick a vendor type" };
  const id = await orgId(db);
  const data = {
    name: profile.name.trim(),
    regNo: profile.regNo.trim() || null,
    vendorType: profile.vendorType,
    primaryContact: profile.primaryContact.trim() || null,
    address: profile.address.trim() || null,
  };
  if (id) await db.organization.update({ where: { id }, data });
  else await db.organization.create({ data });
  await logActivity(db, "settings", "updated", "Organization profile", auth.name);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setNotification(key: NotificationKey, enabled: boolean): Promise<ActionResult> {
  const auth = await authorize("settings");
  if ("ok" in auth) return auth;
  const { db } = auth;
  if (!["notifReminders", "notifDigest", "notifExpiry"].includes(key)) return { ok: false, error: "Unknown setting" };
  const id = await orgId(db);
  if (!id) return { ok: false, error: "Save the organization profile first" };
  await db.organization.update({ where: { id }, data: { [key]: enabled } });
  revalidatePath(`/${auth.tenantSlug}/settings`);
  return { ok: true };
}

/** Numeric strings or blank only — materiality compares these against each vendor's own
 * measurable inputs, so a non-numeric threshold would silently never trigger. */
function numericOrBlank(v: string): string | null {
  const t = v.trim();
  if (t === "") return null;
  if (!Number.isFinite(Number(t))) throw new Error("not numeric");
  return t;
}

export async function saveMaterialityThresholds(thresholds: MaterialityThresholds): Promise<ActionResult> {
  const auth = await authorize("settings");
  if ("ok" in auth) return auth;
  const { db } = auth;
  let data: Record<string, string | null>;
  try {
    data = {
      materialityDisruptionHours: numericOrBlank(thresholds.materialityDisruptionHours),
      materialityCustomerPct: numericOrBlank(thresholds.materialityCustomerPct),
      materialityFinancialImpact: numericOrBlank(thresholds.materialityFinancialImpact),
    };
  } catch {
    return { ok: false, error: "Thresholds must be numbers" };
  }
  const id = await orgId(db);
  if (!id) return { ok: false, error: "Save the organization profile first" };
  await db.organization.update({ where: { id }, data });
  await logActivity(db, "settings", "updated", "Materiality thresholds", auth.name);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveGovernanceRules(rules: GovernanceRules): Promise<ActionResult> {
  const auth = await authorize("settings");
  if ("ok" in auth) return auth;
  const { db } = auth;
  if (!(TIERS as readonly string[]).includes(rules.tierConcentrationTrigger)) return { ok: false, error: "Pick a valid tier" };
  if (!(TIERS as readonly string[]).includes(rules.tierLimitedAlternativesTrigger)) return { ok: false, error: "Pick a valid tier" };
  if (!(CEO_TRIGGERS as readonly string[]).includes(rules.approvalCeoTrigger)) return { ok: false, error: "Pick a valid CEO rule" };
  if (!(BOARD_TRIGGERS as readonly string[]).includes(rules.approvalBoardTrigger)) return { ok: false, error: "Pick a valid Board rule" };
  const id = await orgId(db);
  if (!id) return { ok: false, error: "Save the organization profile first" };
  await db.organization.update({ where: { id }, data: rules });
  await logActivity(db, "settings", "updated", "Tiering & approval rules", auth.name);
  revalidatePath("/", "layout");
  return { ok: true };
}
