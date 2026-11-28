import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Icon } from "@/components/ui/icon";
import { findValidReset } from "@/lib/password-reset";
import { dbForTenant } from "@/lib/tenant-db";

export const metadata = { title: "Reset password — BISON" };

export default async function ResetPasswordPage({ params }: PageProps<"/[tenant]/reset-password/[token]">) {
  const { tenant, token } = await params;
  const db = await dbForTenant(tenant);
  const reset = db ? await findValidReset(db, token) : null;
  if (!reset) {
    return (
      <div className="auth-card" style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 className="sv-h2">This link has expired</h1>
        <p className="sv-body">Reset links work once and last 1 hour. Request a new one to continue.</p>
        <Link className="sv-btn sv-btn--primary" href={`/${tenant}/forgot-password`}>
          Send a new link
        </Link>
        <div className="auth-foot">
          <Link className="sv-btn sv-btn--tertiary sv-btn--sm" href={`/${tenant}/sign-in`}>
            <Icon name="chevronLeft" size={14} />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }
  return <ResetPasswordForm tenant={tenant} token={token} email={reset.member.email} />;
}
