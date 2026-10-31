import { Icon, type IconName } from "@/components/ui/icon";
import { fmtDate } from "@/lib/format";
import type { ReviewState } from "@/lib/status";

export type Tone = "neutral" | "brand" | "accent" | "success" | "warning" | "danger";

export function Badge({ tone, icon, children }: { tone: Tone; icon?: IconName | null; children: React.ReactNode }) {
  return (
    <span className={`sv-badge sv-badge--${tone}`}>
      {icon ? <Icon name={icon} size={13} /> : tone === "accent" ? <span className="sv-badge__dot" /> : null}
      {children}
    </span>
  );
}

export function CatBadge({ children }: { children: React.ReactNode }) {
  return <span className="sv-badge sv-badge--brand">{children}</span>;
}

export function Chips({ items }: { items: string[] | null | undefined }) {
  return (
    <>
      {(items ?? []).map((f, i) => (
        <span key={f}>
          {i > 0 && " "}
          <CatBadge>{f}</CatBadge>
        </span>
      ))}
    </>
  );
}

const STATUS: Record<string, [Tone, IconName | null]> = {
  "Not started": ["neutral", null],
  "In progress": ["brand", "clock"],
  "Ready to submit": ["accent", "checkCircle"],
  Submitted: ["success", "checkCircle"],
  Active: ["success", "checkCircle"],
  Invited: ["brand", "clock"],
  Disabled: ["neutral", null],
  "Not sent": ["neutral", "pencil"],
  "Awaiting response": ["brand", "clock"],
  Completed: ["success", "checkCircle"],
};

export function StatusChip({ value }: { value: string }) {
  const [tone, icon] = STATUS[value] ?? ["neutral", null];
  return (
    <Badge tone={tone} icon={icon}>
      {value}
    </Badge>
  );
}

const CRITICALITY: Record<string, [Tone, IconName | null]> = {
  Critical: ["danger", "alertOctagon"],
  High: ["warning", "alertTriangle"],
  Medium: ["brand", null],
  Low: ["neutral", "checkCircle"],
};

export function CriticalityChip({ value }: { value: string | null | undefined }) {
  const [tone, icon] = (value && CRITICALITY[value]) || ["neutral", null];
  return (
    <Badge tone={tone} icon={icon}>
      {value || "—"}
    </Badge>
  );
}

const FRESHNESS: Record<string, [Tone, IconName, string]> = {
  fresh: ["success", "checkCircle", "Fresh"],
  expiring: ["warning", "clock", "Expiring soon"],
  expired: ["danger", "alertOctagon", "Expired"],
};

export function FreshChip({ value }: { value: string }) {
  const m = FRESHNESS[value];
  if (!m) return <Badge tone="neutral">{value}</Badge>;
  return (
    <Badge tone={m[0]} icon={m[1]}>
      {m[2]}
    </Badge>
  );
}

export function ReviewBadge({ state }: { state: ReviewState }) {
  switch (state.kind) {
    case "none":
      return <Badge tone="neutral">Not scheduled</Badge>;
    case "overdue":
      return (
        <Badge tone="danger" icon="alertOctagon">
          {state.label} overdue
        </Badge>
      );
    case "due":
      return (
        <Badge tone="warning" icon="clock">
          {state.label} due in {state.days}d
        </Badge>
      );
    case "scheduled":
      return <Badge tone="neutral">{fmtDate(state.date)}</Badge>;
  }
}

export function ComplianceBadge({ value }: { value: number }) {
  return value >= 90 ? (
    <Badge tone="success" icon="checkCircle">
      {value}%
    </Badge>
  ) : (
    <Badge tone="warning" icon="alertTriangle">
      {value}%
    </Badge>
  );
}

/** Info alert carrying the "AI-assisted" marker, as used on the dashboard and workspace. */
export function AiAlert({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sv-alert sv-alert--info">
      <Icon name="info" size={20} />
      <div>
        <div className="sv-alert__title">
          <Badge tone="accent">AI-assisted</Badge>
          {title}
        </div>
        <div className="sv-alert__body">{children}</div>
      </div>
    </div>
  );
}

export function InfoAlert({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return (
    <div className="sv-alert sv-alert--info" style={compact ? { padding: "var(--sv-space-3)" } : undefined}>
      <Icon name="info" size={compact ? 16 : 18} />
      <div className="sv-alert__body" style={{ marginTop: 0 }}>
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({ pct, style }: { pct: number; style?: React.CSSProperties }) {
  return (
    <div className="sv-bar" style={style}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}
