import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getOrganization, latestPendingInvite } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";
import { dbForTenant } from "@/lib/tenant-db";

export const metadata = { title: "Sign in — BISON" };

export default async function SignInPage({ params }: PageProps<"/[tenant]/sign-in">) {
  const { tenant } = await params;
  const existing = await getCurrentUser();
  if (existing && existing.tenantSlug === tenant) redirect(`/${tenant}/dashboard`);

  const db = await dbForTenant(tenant);
  if (!db) {
    return (
      <div className="auth-card" style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 className="sv-h2">Workspace not found</h1>
        <p className="sv-body">Check the link your organisation gave you — it should look like /your-company/.</p>
      </div>
    );
  }

  const [org, invite] = await Promise.all([getOrganization(db), latestPendingInvite(db)]);
  return (
    <SignInForm
      tenant={tenant}
      orgName={org?.name ?? "PayBridge Systems"}
      invite={invite?.inviteToken ? { name: invite.name, token: invite.inviteToken } : null}
    />
  );
}
