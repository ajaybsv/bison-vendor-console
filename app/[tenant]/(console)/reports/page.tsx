import { CriticalityChip, MaterialityChip, StatusChip, TierChip } from "@/components/ui/badges";
import { LinkRow } from "@/components/ui/link-row";
import { listActivity } from "@/lib/activity";
import { findConcentrations } from "@/lib/concentration";
import { getOrganization, listEvidence, listIssues, listVendorRequests, listVendors } from "@/lib/data";
import { daysUntil, fmtDate, todayISO } from "@/lib/format";
import { calculateMateriality } from "@/lib/materiality";
import { requireUser } from "@/lib/session";
import { isInFlight, vendorStatus } from "@/lib/status";
import { calculateTier, tierConfigFromOrg } from "@/lib/tiering";

export const metadata = { title: "Reports — BISON" };

export default async function ReportsPage({ params }: PageProps<"/[tenant]/reports">) {
  const { tenant } = await params;
  const { db } = await requireUser(tenant);
  const [vendors, cycles, issues, org, activity, evidence] = await Promise.all([
    listVendors(db),
    listVendorRequests(db),
    listIssues(db),
    getOrganization(db),
    listActivity(db, 50),
    listEvidence(db),
  ]);
  const today = todayISO();
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
  const materialInventory = vendorRisk.filter((r) => r.tier === "Tier 1 – Critical" || r.materiality === "Potential Material");

  const overdueReviews = vendors.filter((v) => {
    const d = daysUntil(v.nextReview, today);
    return !isInFlight(vendorStatus(cycles, v.id)) && d != null && d < 0;
  });
  const overdueIssues = issues.filter((i) => {
    const d = daysUntil(i.dueDate, today);
    return i.status !== "Closed" && d != null && d < 0;
  });
  const assuranceExpiring = evidence.filter((e) => e.vendor && (e.freshness === "expiring" || e.freshness === "expired"));

  return (
    <div className="sv-page">
      <h1 className="sv-h1" style={{ marginBottom: "var(--sv-space-2)" }}>
        Reports
      </h1>
      <p className="sv-body" style={{ marginBottom: "var(--sv-space-5)" }}>
        Material vendor inventory, overdue actions and the activity log behind every change — for management and audit review.
      </p>

      <h2 className="sv-h3" style={{ marginBottom: "var(--sv-space-3)" }}>
        Material / critical vendor inventory ({materialInventory.length})
      </h2>
      <div className="sv-table__scroll" style={{ marginBottom: "var(--sv-space-5)" }}>
        <table className="sv-table">
          <caption>Vendors that are Tier 1 or Potential Material</caption>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Criticality</th>
              <th>Tier</th>
              <th>Materiality</th>
              <th>Approval status</th>
            </tr>
          </thead>
          <tbody>
            {materialInventory.length === 0 ? (
              <tr>
                <td colSpan={5} className="sv-body-sm">
                  No vendor is currently Tier 1 or Potential Material.
                </td>
              </tr>
            ) : (
              materialInventory.map((r) => (
                <LinkRow key={r.vendor.id} href={`/${tenant}/vendors/${r.vendor.id}`}>
                  <td style={{ fontWeight: 600 }}>{r.vendor.name}</td>
                  <td>
                    <CriticalityChip value={r.vendor.criticality} />
                  </td>
                  <td>
                    <TierChip value={r.tier} />
                  </td>
                  <td>
                    <MaterialityChip value={r.materiality} />
                  </td>
                  <td>
                    <StatusChip value={r.vendor.approvalStatus} />
                  </td>
                </LinkRow>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="sv-h3" style={{ marginBottom: "var(--sv-space-3)" }}>
        Overdue actions ({overdueReviews.length + overdueIssues.length + assuranceExpiring.length})
      </h2>
      <div className="row wrap" style={{ alignItems: "flex-start", marginBottom: "var(--sv-space-5)" }}>
        <div className="col sv-table__scroll" style={{ flex: 1, minWidth: 320 }}>
          <table className="sv-table">
            <caption>Vendor reassessments overdue</caption>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Was due</th>
              </tr>
            </thead>
            <tbody>
              {overdueReviews.length === 0 ? (
                <tr>
                  <td colSpan={2} className="sv-body-sm">
                    Nothing overdue.
                  </td>
                </tr>
              ) : (
                overdueReviews.map((v) => (
                  <LinkRow key={v.id} href={`/${tenant}/vendors/${v.id}`}>
                    <td style={{ fontWeight: 600 }}>{v.name}</td>
                    <td className="sv-body-sm">{fmtDate(v.nextReview)}</td>
                  </LinkRow>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="col sv-table__scroll" style={{ flex: 1, minWidth: 320 }}>
          <table className="sv-table">
            <caption>Issue remediation overdue</caption>
            <thead>
              <tr>
                <th>Finding</th>
                <th>Was due</th>
              </tr>
            </thead>
            <tbody>
              {overdueIssues.length === 0 ? (
                <tr>
                  <td colSpan={2} className="sv-body-sm">
                    Nothing overdue.
                  </td>
                </tr>
              ) : (
                overdueIssues.map((i) => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600 }}>
                      {i.title} <span className="sv-caption">— {i.vendor}</span>
                    </td>
                    <td className="sv-body-sm">{fmtDate(i.dueDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="col sv-table__scroll" style={{ flex: 1, minWidth: 320 }}>
          <table className="sv-table">
            <caption>Vendor assurance expiring or expired</caption>
            <thead>
              <tr>
                <th>Document</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {assuranceExpiring.length === 0 ? (
                <tr>
                  <td colSpan={2} className="sv-body-sm">
                    Nothing expiring.
                  </td>
                </tr>
              ) : (
                assuranceExpiring.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>
                      {e.name} <span className="sv-caption">— {e.vendor}</span>
                    </td>
                    <td className="sv-body-sm">{fmtDate(e.expiry)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="sv-h3" style={{ marginBottom: "var(--sv-space-3)" }}>
        Activity log
      </h2>
      <div className="sv-table__scroll">
        <table className="sv-table">
          <caption>Most recent changes across the platform</caption>
          <thead>
            <tr>
              <th>When</th>
              <th>Area</th>
              <th>Action</th>
              <th>Record</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {activity.length === 0 ? (
              <tr>
                <td colSpan={5} className="sv-body-sm">
                  No activity recorded yet.
                </td>
              </tr>
            ) : (
              activity.map((a) => (
                <tr key={a.id}>
                  <td className="sv-caption mono">{a.ts.toISOString().replace("T", " ").slice(0, 16)}</td>
                  <td className="sv-body-sm" style={{ textTransform: "capitalize" }}>
                    {a.entity}
                  </td>
                  <td className="sv-body-sm">{a.action}</td>
                  <td style={{ fontWeight: 600 }}>{a.label}</td>
                  <td className="sv-body-sm">{a.user}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
