"use server";

import { revalidatePath } from "next/cache";
import { VENDOR_TYPES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { authorize, type ActionResult } from "@/lib/session";

export type OrgProfile = {
  name: string;
  regNo: string;
  vendorType: string;
  primaryContact: string;
  address: string;
};

export type NotificationKey = "notifReminders" | "notifDigest" | "notifExpiry";

async function orgId(): Promise<number | null> {
  const org = await prisma.organization.findFirst({ orderBy: { id: "asc" }, select: { id: true } });
  return org?.id ?? null;
}

export async function saveOrgProfile(profile: OrgProfile): Promise<ActionResult> {
  const auth = await authorize("settings");
  if ("ok" in auth) return auth;
  if (!profile.name.trim()) return { ok: false, error: 'Fill in "Organization name"' };
  if (!VENDOR_TYPES.includes(profile.vendorType)) return { ok: false, error: "Pick a vendor type" };
  const id = await orgId();
  const data = {
    name: profile.name.trim(),
    regNo: profile.regNo.trim() || null,
    vendorType: profile.vendorType,
    primaryContact: profile.primaryContact.trim() || null,
    address: profile.address.trim() || null,
  };
  if (id) await prisma.organization.update({ where: { id }, data });
  else await prisma.organization.create({ data });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setNotification(key: NotificationKey, enabled: boolean): Promise<ActionResult> {
  const auth = await authorize("settings");
  if ("ok" in auth) return auth;
  if (!["notifReminders", "notifDigest", "notifExpiry"].includes(key)) return { ok: false, error: "Unknown setting" };
  const id = await orgId();
  if (!id) return { ok: false, error: "Save the organization profile first" };
  await prisma.organization.update({ where: { id }, data: { [key]: enabled } });
  revalidatePath("/settings");
  return { ok: true };
}
