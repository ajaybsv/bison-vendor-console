import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Icon } from "@/components/ui/icon";
import { findValidReset } from "@/lib/password-reset";

export const metadata = { title: "Reset password — BISON" };

export default async function ResetPasswordPage({ params }: PageProps<"/reset-password/[token]">) {
  const { token } = await params;
  const reset = await findValidReset(token);
  if (!reset) {
    return (
      <div className="auth-card" style={{ maxWidth: 420, textAlign: "center" }}>
        <h1 className="sv-h2">This link has expired</h1>
        <p className="sv-body">Reset links work once and last 1 hour. Request a new one to continue.</p>
        <Link className="sv-btn sv-btn--primary" href="/forgot-password">
          Send a new link
        </Link>
        <div className="auth-foot">
          <Link className="sv-btn sv-btn--tertiary sv-btn--sm" href="/sign-in">
            <Icon name="chevronLeft" size={14} />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }
  return <ResetPasswordForm token={token} email={reset.member.email} />;
}
