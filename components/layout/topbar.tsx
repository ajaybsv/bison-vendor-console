import Image from "next/image";
import { signOut } from "@/actions/auth-actions";
import { BisonLogo } from "@/components/brand/bison-logo";
import { initials } from "@/lib/format";
import type { CurrentUser } from "@/lib/types";

export function Topbar({ user, orgName }: { user: CurrentUser; orgName: string }) {
  return (
    <nav className="sv-nav topslot">
      <div className="sv-nav__brand">
        <span style={{ color: "var(--sv-brand)", display: "flex", alignItems: "center" }}>
          <BisonLogo height={28} />
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 1, height: 24, background: "var(--sv-border)", display: "inline-block" }} />
        <Image src="/paybridge-logo.png" alt={orgName} width={87} height={26} style={{ height: 26, width: "auto", display: "block" }} />
      </div>
      <div className="sv-nav__actions">
        <span className="sv-avatar">{initials(user.name)}</span>
        <span className="sv-body-sm">
          {user.name} · <b style={{ color: "var(--sv-ink)" }}>{user.role}</b>
        </span>
        <form action={signOut}>
          <button className="sv-btn sv-btn--tertiary sv-btn--sm" type="submit">
            Sign out
          </button>
        </form>
      </div>
    </nav>
  );
}
