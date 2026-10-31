"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import type { NavCounts } from "@/lib/types";

type NavItem = { href: string; label: string; icon: IconName; count?: keyof NavCounts };

/* Trust Pack is a group of two destinations, not one merged page. */
const NAV: { grp: string; items: NavItem[] }[] = [
  {
    grp: "Workspace",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "grid" },
      { href: "/requests", label: "Requests", icon: "inbox", count: "requests" },
      { href: "/history", label: "History", icon: "clock", count: "history" },
    ],
  },
  {
    grp: "Trust Pack",
    items: [
      { href: "/answers", label: "Answers", icon: "shield", count: "answers" },
      { href: "/evidence", label: "Evidence", icon: "file", count: "evidence" },
    ],
  },
  {
    grp: "Our Vendors",
    items: [
      { href: "/vendors", label: "Vendors", icon: "building", count: "vendors" },
      { href: "/sent-requests", label: "Sent Requests", icon: "send", count: "sentrequests" },
    ],
  },
  {
    grp: "Organization",
    items: [
      { href: "/team", label: "Team & access", icon: "users", count: "team" },
      { href: "/settings", label: "Settings", icon: "sliders" },
    ],
  },
];

export function Sidebar({ counts }: { counts: NavCounts }) {
  const pathname = usePathname();
  return (
    <div className="sv-side">
      {NAV.map((g) => (
        <div className="sv-side__group" key={g.grp}>
          <div className="sv-side__label">{g.grp}</div>
          {g.items.map((it) => {
            const current = pathname === it.href || pathname.startsWith(it.href + "/");
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`sv-side__item${current ? " is-current" : ""}`}
                aria-current={current ? "page" : undefined}
              >
                <Icon name={it.icon} size={18} />
                <span className="sv-side__text">{it.label}</span>
                {it.count && <span className="sv-badge sv-badge--neutral">{counts[it.count]}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
