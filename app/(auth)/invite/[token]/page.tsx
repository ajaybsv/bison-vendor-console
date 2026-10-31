import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { getInvite, getOrganization, listTeam } from "@/lib/data";

export const metadata = { title: "Your invite — BISON" };

export default async function InvitePreviewPage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const [inv, org, team] = await Promise.all([getInvite(token), getOrganization(), listTeam()]);
  if (!inv) notFound();
  const orgName = org?.name ?? "PayBridge Systems";
  const owner = team.find((t) => t.role === "Owner" && t.status === "Active");
  return (
    <div className="auth-card email-preview" style={{ maxWidth: 560 }}>
      <p className="sv-caption" style={{ margin: "0 0 var(--sv-space-4)" }}>
        This is a preview of what the invite email looks like — BISON doesn&apos;t send real email yet.
      </p>
      <div style={{ border: "1px solid var(--sv-border)", borderRadius: "var(--sv-radius-md)", padding: "var(--sv-space-5)" }}>
        <div className="em-row">
          <b>From</b>
          <span>BISON &lt;no-reply@bison.app&gt;</span>
        </div>
        <div className="em-row">
          <b>To</b>
          <span>{inv.email}</span>
        </div>
        <div className="em-row">
          <b>Subject</b>
          <span style={{ fontWeight: 600, color: "var(--sv-ink)" }}>You&apos;re invited to join {orgName} on BISON</span>
        </div>
        <div style={{ height: 1, background: "var(--sv-border)", margin: "var(--sv-space-4) 0" }} />
        <p className="sv-body" style={{ color: "var(--sv-ink)" }}>
          Hi {inv.name},
        </p>
        <p className="sv-body" style={{ color: "var(--sv-ink)" }}>
          {owner?.name ?? "Your team owner"} has invited you to join {orgName} on BISON as a <b>{inv.role}</b>. Click below to set up
          your account.
        </p>
        <div style={{ margin: "var(--sv-space-5) 0" }}>
          <Link className="sv-btn sv-btn--primary" href={`/sign-up/${token}`}>
            Register your account →
          </Link>
        </div>
        <p className="sv-caption">If you weren&apos;t expecting this invite, you can ignore this email.</p>
      </div>
      <div className="auth-foot">
        <Link className="sv-btn sv-btn--tertiary sv-btn--sm" href="/sign-in">
          <Icon name="chevronLeft" size={14} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
