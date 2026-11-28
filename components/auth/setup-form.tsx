"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { bootstrapFirstOwner } from "@/actions/auth-actions";
import { BisonLogo } from "@/components/brand/bison-logo";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/toast/toast-provider";

export function SetupForm({ tenant, orgName }: { tenant: string; orgName: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await bootstrapFirstOwner(tenant, name, email, password, confirm);
      if (!res.ok) return showToast(res.error, "danger");
      showToast(`Welcome to BISON, ${name.trim()}!`);
      router.push(`/${tenant}/dashboard`);
      router.refresh();
    });
  }

  return (
    <form className="auth-card" style={{ maxWidth: 440 }} onSubmit={submit}>
      <div className="auth-logo">
        <BisonLogo height={32} />
      </div>
      <h1 className="sv-h2" style={{ textAlign: "center" }}>
        Set up this workspace
      </h1>
      <p className="sv-body" style={{ textAlign: "center", marginBottom: "var(--sv-space-5)" }}>
        This is {orgName}&apos;s first account — it becomes the workspace Owner.
      </p>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-4)" }}>
        <label className="sv-field__label" htmlFor="setupName">
          Name
        </label>
        <input className="sv-field__input" id="setupName" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-4)" }}>
        <label className="sv-field__label" htmlFor="setupEmail">
          Email
        </label>
        <input className="sv-field__input" type="email" id="setupEmail" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-4)" }}>
        <label className="sv-field__label" htmlFor="setupPassword">
          Password
        </label>
        <input
          className="sv-field__input"
          type="password"
          id="setupPassword"
          placeholder="Create a password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="sv-field" style={{ marginBottom: "var(--sv-space-5)" }}>
        <label className="sv-field__label" htmlFor="setupConfirm">
          Confirm password
        </label>
        <input
          className="sv-field__input"
          type="password"
          id="setupConfirm"
          placeholder="Re-enter password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <button className="sv-btn sv-btn--primary sv-btn--block" type="submit" disabled={pending}>
        Create workspace owner account
      </button>
      <div className="auth-foot">
        <Link className="sv-btn sv-btn--tertiary sv-btn--sm" href={`/${tenant}/sign-in`}>
          <Icon name="chevronLeft" size={14} />
          Already have an account? Sign in
        </Link>
      </div>
    </form>
  );
}
