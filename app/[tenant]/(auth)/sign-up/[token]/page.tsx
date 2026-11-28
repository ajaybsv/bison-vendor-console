import { notFound } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getInvite, getOrganization } from "@/lib/data";
import { dbForTenant } from "@/lib/tenant-db";

export const metadata = { title: "Complete your account — BISON" };

export default async function SignUpPage({ params }: PageProps<"/[tenant]/sign-up/[token]">) {
  const { tenant, token } = await params;
  const db = await dbForTenant(tenant);
  if (!db) notFound();
  const [inv, org] = await Promise.all([getInvite(db, token), getOrganization(db)]);
  if (!inv) notFound();
  return (
    <SignUpForm
      tenant={tenant}
      token={token}
      orgName={org?.name ?? "PayBridge Systems"}
      invite={{ name: inv.name, email: inv.email, role: inv.role }}
    />
  );
}
