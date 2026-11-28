import Link from "next/link";
import { AiAlert, FreshChip, MaterialityChip, ProgressBar, ReviewBadge, StatusChip, TierChip } from "@/components/ui/badges";
import { LinkRow } from "@/components/ui/link-row";
import { findConcentrations } from "@/lib/concentration";
import { TRUST_PACK_QUESTION_TARGET } from "@/lib/constants";
import {
  getOrganization,
  listClientRequests,
  listEvidence,
  listHistory,
  listIncidents,
  listIssues,
  listTrustAnswers,
  listVendorRequests,
  listVendors,
} from "@/lib/data";
import { daysUntil, fmtDate, todayISO } from "@/lib/format";
import { calculateMateriality } from "@/lib/materiality";
import { requireUser } from "@/lib/session";
import { isInFlight, latestRequestFor, reqProgress, reqStatus, reviewState, vendorStatus } from "@/lib/status";
import { calculateTier, tierConfigFromOrg } from "@/lib/tiering";

export const metadata = { title: "Dashboard — BISON" };

export default async function DashboardPage({ params }: PageProps<"/[tenant]/dashboard">) {
  const { tenant } = await params;
  const user = await requireUser(tenant);
  const { db } = user;
  const [org, active, history, answers, evidence, vendors, cycles, issues, incidents] = await Promise.all([
    getOrganization(db),
    listClientRequests(db),
    listHistory(db),
    listTrustAnswers(db),
    listEvidence(db),
    listVendors(db),
    listVendorRequests(db),
    listIssues(db),
    listIncidents(db),
  ]);
  const today = todayISO();
  const expiringSoon = evidence.filter((e) => e.freshness === "expiring");
  const vendorsAwaiting = vendors.filter((v) => isInFlight(vendorStatus(cycles, v.id))).length;
  const dueSoon = vendors.filter((v) => {
    const d = daysUntil(v.nextReview, today);
    return !isInFlight(vendorStatus(cycles, v.id)) && d != null && d <= 45;
  });
  const answersPct = Math.min(100, Math.round((answers.length / TRUST_PACK_QUESTION_TARGET) * 100));
  const evPct = evidence.length ? Math.round((evidence.filter((e) => e.freshness === "fresh").length / evidence.length) * 100) : 0;
  const overall = Math.round((answersPct + evPct) / 2);
  const orgName = org?.name ?? "PayBridge Systems";

  const concentrations = findConcentrations(vendors);
  const orgThresholds = org ?? { materialityDisruptionHours: null, materialityCustomerPct: null, materialityFinancialImpact: null };
  const tierConfig = tierConfigFromOrg(org ?? {});
  const vendorRisk = vendors.map((v) => {
    const hasConcentration = concentrations.some((g) => g.vendors.some((x) => x.id === v.id));
    return {
      vendor: v,
      tier: calculateTier(v, hasConcentration, tierConfig).tier,
      materiality: calculateMateriality(v, orgThresholds, hasConcentration).outcome,
    };
  });
  const tier1Count = vendorRisk.filter((r) => r.tier === "Tier 1 – Critical").length;
  const materialCount = vendorRisk.filter((r) => r.materiality === "Potential Material").length;
  const openIssues = issues.filter((i) => i.status !== "Closed");
  const openIncidents = incidents.filter((i) => i.status !== "Resolved");
  const slaBreaches = openIncidents.filter((i) => i.slaBreached === "Yes");
  const pendingApprovals = vendors.filter((v) => v.approvalStatus === "Not started" || v.approvalStatus === "In review").length;

  return (
    <div className="sv-page">
      <div className="head">
        <div>
          <h1 className="sv-h1">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="sv-body">
            Here&apos;s where {orgName} stands — as a vendor to your clients, and as a company with vendors of your own to watch.
          </p>
        </div>
      </div>

      <div className="grid g4" style={{ marginBottom: "var(--sv-space-5)" }}>
        <div className="sv-card">
          <div className="sv-card__eyebrow">Active requests</div>
          <div className="sv-stat">{active.length}</div>
        </div>
        <div className="sv-card">
          <div className="sv-card__eyebrow">Trust Pack complete</div>
          <div className="sv-stat" style={{ color: "var(--sv-brand-text)" }}>
            {overall}%
          </div>
        </div>
        <div className="sv-card">
          <div className="sv-card__eyebrow">Evidence expiring soon</div>
          <div className="sv-stat" style={{ color: expiringSoon.length ? "var(--sv-warning)" : "var(--sv-success)" }}>
            {expiringSoon.length}
          </div>
        </div>
        <div className="sv-card">
          <div className="sv-card__eyebrow">Assessments completed</div>
          <div className="sv-stat">{history.length}</div>
        </div>
      </div>

      <h2 className="sv-h3" style={{ marginBottom: "var(--sv-space-4)" }}>
        Requests from your clients
      </h2>
      <div className="row wrap" style={{ alignItems: "flex-start" }}>
        <div className="col sv-table__scroll" style={{ flex: 2, minWidth: 360 }}>
          <table className="sv-table">
            <caption>Active requests</caption>
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Progress</th>
                <th>Due</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {active.map((r) => (
                <LinkRow key={r.id} href={`/${tenant}/requests/${r.id}`}>
                  <td style={{ fontWeight: 600 }}>{r.client}</td>
                  <td className="sv-body-sm">{r.kind}</td>
                  <td style={{ minWidth: 110 }}>
                    <ProgressBar pct={reqProgress(r)} />
                    <div className="sv-caption mono" style={{ marginTop: 4 }}>
                      {reqProgress(r)}%
                    </div>
                  </td>
                  <td className="sv-body-sm">{fmtDate(r.due)}</td>
                  <td>
                    <StatusChip value={reqStatus(r)} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="sv-btn sv-btn--tertiary sv-btn--sm">Open</button>
                  </td>
                </LinkRow>
              ))}
            </tbody>
          </table>
        </div>
        <div className="col stack" style={{ minWidth: 270 }}>
          <AiAlert title="Trust Pack">
            <div className="between" style={{ marginTop: 2 }}>
              <span style={{ fontWeight: 600 }}>Overall completeness</span>
              <span style={{ color: "var(--sv-brand-text)", fontWeight: 600 }}>{overall}%</span>
            </div>
            <ProgressBar pct={overall} style={{ marginTop: 6 }} />
            <div style={{ marginTop: 10 }}>
              Answers {answersPct}% · Evidence {evPct}%. A complete Trust Pack pre-fills more of every new request.
            </div>
          </AiAlert>
          <div className="row" style={{ gap: "var(--sv-space-2)" }}>
            <Link className="sv-btn sv-btn--secondary sv-btn--sm" style={{ flex: 1 }} href={`/${tenant}/answers`}>
              Review answers
            </Link>
            <Link className="sv-btn sv-btn--secondary sv-btn--sm" style={{ flex: 1 }} href={`/${tenant}/evidence`}>
              Review evidence
            </Link>
          </div>
          <div className="sv-card">
            <div className="sv-card__eyebrow">Evidence expiring soon</div>
            {expiringSoon.length ? (
              <div className="stack">
                {expiringSoon.map((e) => (
                  <div className="between sv-body-sm" key={e.id}>
                    <span>{e.name}</span>
                    <FreshChip value={e.freshness} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="sv-body-sm">Nothing expiring in the near term.</div>
            )}
          </div>
        </div>
      </div>

      <h2 className="sv-h3" style={{ margin: "var(--sv-space-6) 0 var(--sv-space-4)" }}>
        Vendor risk overview
      </h2>
      <div className="grid g4" style={{ marginBottom: "var(--sv-space-5)" }}>
        <Link className="sv-card" href={`/${tenant}/vendors`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="sv-card__eyebrow">Tier 1 vendors</div>
          <div className="sv-stat" style={{ color: tier1Count ? "var(--sv-danger)" : undefined }}>
            {tier1Count}
          </div>
        </Link>
        <Link className="sv-card" href={`/${tenant}/vendors`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="sv-card__eyebrow">Potential Material</div>
          <div className="sv-stat" style={{ color: materialCount ? "var(--sv-danger)" : undefined }}>
            {materialCount}
          </div>
        </Link>
        <Link className="sv-card" href={`/${tenant}/vendors`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="sv-card__eyebrow">Concentration flags</div>
          <div className="sv-stat" style={{ color: concentrations.length ? "var(--sv-warning)" : undefined }}>
            {concentrations.length}
          </div>
        </Link>
        <Link className="sv-card" href={`/${tenant}/issues`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="sv-card__eyebrow">Open issues</div>
          <div className="sv-stat" style={{ color: openIssues.length ? "var(--sv-warning)" : undefined }}>
            {openIssues.length}
          </div>
        </Link>
        <Link className="sv-card" href={`/${tenant}/incidents`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="sv-card__eyebrow">SLA breaches (open)</div>
          <div className="sv-stat" style={{ color: slaBreaches.length ? "var(--sv-danger)" : undefined }}>
            {slaBreaches.length}
          </div>
        </Link>
      </div>
      {(tier1Count > 0 || materialCount > 0) && (
        <div className="sv-table__scroll" style={{ marginBottom: "var(--sv-space-5)" }}>
          <table className="sv-table">
            <caption>Vendors needing the closest attention</caption>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Tier</th>
                <th>Materiality</th>
                <th>Approval status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {vendorRisk
                .filter((r) => r.tier === "Tier 1 – Critical" || r.materiality === "Potential Material")
                .map((r) => (
                  <LinkRow key={r.vendor.id} href={`/${tenant}/vendors/${r.vendor.id}`}>
                    <td style={{ fontWeight: 600 }}>{r.vendor.name}</td>
                    <td>
                      <TierChip value={r.tier} />
                    </td>
                    <td>
                      <MaterialityChip value={r.materiality} />
                    </td>
                    <td>
                      <StatusChip value={r.vendor.approvalStatus} />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="sv-btn sv-btn--tertiary sv-btn--sm">View</button>
                    </td>
                  </LinkRow>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {pendingApprovals > 0 && (
        <p className="sv-body-sm" style={{ marginTop: "calc(-1 * var(--sv-space-3))", marginBottom: "var(--sv-space-5)" }}>
          <Link href={`/${tenant}/vendors`}>{pendingApprovals} vendor{pendingApprovals === 1 ? "" : "s"} still awaiting an approval decision.</Link>
        </p>
      )}

      <div className="between" style={{ margin: "0 0 var(--sv-space-4)" }}>
        <h2 className="sv-h3" style={{ margin: 0 }}>
          Sent requests
        </h2>
        <div style={{ display: "flex", gap: "var(--sv-space-2)" }}>
          <span className="sv-badge sv-badge--neutral">
            {vendors.length} vendor{vendors.length === 1 ? "" : "s"}
          </span>
          <span className={`sv-badge ${vendorsAwaiting ? "sv-badge--brand" : "sv-badge--neutral"}`}>{vendorsAwaiting} awaiting response</span>
        </div>
      </div>
      <div className="row wrap" style={{ alignItems: "flex-start" }}>
        <div className="col sv-table__scroll" style={{ flex: 2, minWidth: 360 }}>
          <table className="sv-table">
            <caption>Requests sent to your vendors</caption>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Timeline</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => {
                const status = vendorStatus(cycles, v.id);
                const latest = latestRequestFor(cycles, v.id);
                const inFlight = isInFlight(status) && latest != null;
                return (
                  <LinkRow key={v.id} href={inFlight ? `/${tenant}/sent-requests/${latest.id}` : `/${tenant}/vendors?send=${v.id}`}>
                    <td style={{ fontWeight: 600 }}>{v.name}</td>
                    <td>
                      <StatusChip value={status} />
                    </td>
                    <td className="sv-caption mono">
                      {latest ? `Q ${latest.qDone}/${latest.qTotal} · Ev ${latest.evDone}/${latest.evTotal}` : "—"}
                    </td>
                    <td>
                      {inFlight ? <span className="sv-body-sm">Due {fmtDate(latest.due)}</span> : <ReviewBadge state={reviewState(v, cycles, today)} />}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button className="sv-btn sv-btn--tertiary sv-btn--sm">{inFlight ? "View" : latest ? "Reassess" : "Send"}</button>
                    </td>
                  </LinkRow>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="col stack" style={{ minWidth: 270 }}>
          <div className="sv-card">
            <div className="sv-card__eyebrow">Due for reassessment</div>
            {dueSoon.length ? (
              <div className="stack">
                {dueSoon.map((v) => (
                  <div className="between sv-body-sm" key={v.id}>
                    <span>{v.name}</span>
                    <ReviewBadge state={reviewState(v, cycles, today)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="sv-body-sm">Nothing due in the near term.</div>
            )}
            <div className="sv-card__footer">
              <Link className="sv-btn sv-btn--tertiary sv-btn--sm" href={`/${tenant}/vendors`}>
                Go to Vendors
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
