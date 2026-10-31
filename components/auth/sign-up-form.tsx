"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { completeSignup } from "@/actions/auth-actions";
import { BisonLogo } from "@/components/brand/bison-logo";
import { CatBadge } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/toast/toast-provider";

export function SignUpForm({
  token,
  orgName,
  invite,
}: {
  token: string;
  orgName: string;
  invite: { name: string; email: string; role: string };
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(invite.name);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await completeSignup(token, name, password, confirm);
      if (!res.ok) return showToast(res.error, "danger");
      showToast(`Welcome to BISON, ${name.trim() || invite.name}!`);
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <form className="auth-card" style={{ maxWidth: 440 }} onSubmit={submit}>
      <div className="auth-logo">
        <BisonLogo height={32} />
      </div>
      <h1 className="sv-h2" style={{ textAlign: "center" }}>
        Complete your BISON account
      </h1>
      <p className="sv-body" style={{ textAlign: "center", marginBottom: "var(--sv-space-5)" }}>
        You&apos;ve been invited to join {orgName}
      </p>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-4)" }}>
        <label className="sv-field__label" htmlFor="suName">
          Name
        </label>
        <input className="sv-field__input" id="suName" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-4)" }}>
        <label className="sv-field__label">Email</label>
        <input className="sv-field__input" value={invite.email} disabled />
      </div>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-4)" }}>
        <label className="sv-field__label">Role</label>
        <div>
          <CatBadge>{invite.role}</CatBadge>
        </div>
      </div>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-4)" }}>
        <label className="sv-field__label" htmlFor="suPassword">
          Password
        </label>
        <input
          className="sv-field__input"
          type="password"
          id="suPassword"
          placeholder="Create a password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-5)" }}>
        <label className="sv-field__label" htmlFor="suConfirm">
          Confirm password
        </label>
        <input
          className="sv-field__input"
          type="password"
          id="suConfirm"
          placeholder="Re-enter password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <button className="sv-btn sv-btn--primary sv-btn--block" type="submit" disabled={pending}>
        Create account
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
