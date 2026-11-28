import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { SetupForm } from "@/components/auth/setup-form";
import { getOrganization } from "@/lib/data";
import { dbForTenant } from "@/lib/tenant-db";

export const metadata = { title: "Set up your workspace — BISON" };

export default async function SetupPage({ params }: PageProps<"/[tenant]/setup">) {
  const { tenant } = await params;
  const db = await dbForTenant(tenant);
  if (!db) notFound();
  const existing = await db.teamMember.count();
  if (existing > 0) redirect(`/${tenant}/sign-in`);
  const org = await getOrganization(db);
  return <SetupForm tenant={tenant} orgName={org?.name ?? "your organisation"} />;
}
