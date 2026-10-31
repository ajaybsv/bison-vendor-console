"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn } from "@/actions/auth-actions";
import { BisonLogo } from "@/components/brand/bison-logo";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/toast/toast-provider";

export function SignInForm({
  orgName,
  invite,
}: {
  orgName: string;
  invite: { name: string; token: string } | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("rahul@paybridge.in");
  const [password, setPassword] = useState("demo-password");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await signIn(email, password);
      if (!res.ok) return showToast(res.error, "danger");
      showToast("Signed in");
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
        Sign in to BISON
      </h1>
      <p className="sv-body" style={{ textAlign: "center", marginBottom: "var(--sv-space-5)" }}>
        {orgName}
        {orgName.endsWith("s") ? "'" : "'s"} vendor portal
      </p>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-4)" }}>
        <label className="sv-field__label" htmlFor="siEmail">
          Email
        </label>
        <input className="sv-field__input" type="email" id="siEmail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
      </div>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-2)" }}>
        <label className="sv-field__label" htmlFor="siPassword">
          Password
        </label>
        <input
          className="sv-field__input"
          type="password"
          id="siPassword"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      <div style={{ textAlign: "right", marginBottom: "var(--sv-space-5)" }}>
        <Link className="sv-btn sv-btn--tertiary sv-btn--sm" style={{ padding: 0, height: "auto" }} href="/forgot-password">
          Forgot password?
        </Link>
      </div>
      <button className="sv-btn sv-btn--primary sv-btn--block" type="submit" disabled={pending}>
        Sign in
      </button>
      <div className="auth-foot">
        <p className="sv-caption" style={{ margin: "0 0 var(--sv-space-2)" }}>
          BISON is invite-only — a team owner adds you, you don&apos;t sign up on your own.
        </p>
        {invite ? (
          <Link className="sv-btn sv-btn--secondary sv-btn--sm" href={`/invite/${invite.token}`}>
            <Icon name="send" size={14} />
            Preview {invite.name}&apos;s invite email
          </Link>
        ) : (
          <p className="sv-caption">No pending invites right now.</p>
        )}
      </div>
    </form>
  );
}
