"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resetPassword } from "@/actions/password-actions";
import { BisonLogo } from "@/components/brand/bison-logo";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/toast/toast-provider";

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await resetPassword(token, password, confirm);
      if (!res.ok) return showToast(res.error, "danger");
      showToast("Password updated");
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form className="auth-card" style={{ maxWidth: 420 }} onSubmit={submit}>
      <div className="auth-logo">
        <BisonLogo height={32} />
      </div>
      <h1 className="sv-h2" style={{ textAlign: "center" }}>
        Set a new password
      </h1>
      <p className="sv-body" style={{ textAlign: "center", marginBottom: "var(--sv-space-5)" }}>
        For {email}
      </p>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-4)" }}>
        <label className="sv-field__label" htmlFor="rpPassword">
          New password
        </label>
        <input
          className="sv-field__input"
          type="password"
          id="rpPassword"
          placeholder="At least 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-5)" }}>
        <label className="sv-field__label" htmlFor="rpConfirm">
          Confirm password
        </label>
        <input
          className="sv-field__input"
          type="password"
          id="rpConfirm"
          placeholder="Re-enter password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <button className="sv-btn sv-btn--primary sv-btn--block" type="submit" disabled={pending}>
        Update password
      </button>
      <div className="auth-foot">
        <Link className="sv-btn sv-btn--tertiary sv-btn--sm" href="/sign-in">
          <Icon name="chevronLeft" size={14} />
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
