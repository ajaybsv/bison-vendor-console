"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/actions/password-actions";
import { BisonLogo } from "@/components/brand/bison-logo";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/toast/toast-provider";

export function ForgotPasswordForm() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await requestPasswordReset(email);
      if (!res.ok) return showToast(res.error, "danger");
      setSentTo(email.trim());
    });
  }

  const back = (
    <div className="auth-foot">
      <Link className="sv-btn sv-btn--tertiary sv-btn--sm" href="/sign-in">
        <Icon name="chevronLeft" size={14} />
        Back to sign in
      </Link>
    </div>
  );

  if (sentTo) {
    return (
      <div className="auth-card" style={{ maxWidth: 420, textAlign: "center" }}>
        <div className="sv-tick">
          <Icon name="send" size={24} />
        </div>
        <h1 className="sv-h2" style={{ margin: "var(--sv-space-4) 0 var(--sv-space-2)" }}>
          Check your email
        </h1>
        <p className="sv-body" style={{ margin: 0 }}>
          If <b style={{ color: "var(--sv-ink)" }}>{sentTo}</b> has a BISON account, a reset link is on its way. It expires in 1 hour.
        </p>
        {back}
      </div>
    );
  }

  return (
    <form className="auth-card" style={{ maxWidth: 420 }} onSubmit={submit}>
      <div className="auth-logo">
        <BisonLogo height={32} />
      </div>
      <h1 className="sv-h2" style={{ textAlign: "center" }}>
        Forgot your password?
      </h1>
      <p className="sv-body" style={{ textAlign: "center", marginBottom: "var(--sv-space-5)" }}>
        Enter your work email and we&apos;ll send you a link to set a new one.
      </p>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-5)" }}>
        <label className="sv-field__label" htmlFor="fpEmail">
          Email
        </label>
        <input
          className="sv-field__input"
          type="email"
          id="fpEmail"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button className="sv-btn sv-btn--primary sv-btn--block" type="submit" disabled={pending}>
        Send reset link
      </button>
      {back}
    </form>
  );
}
