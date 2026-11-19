import Link from "next/link";
import { notFound } from "next/navigation";
import { Chips, ClassificationChip, CriticalityChip, MaterialityChip, ReviewBadge, StatusChip, TierChip, WarningAlert } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import { LinkRow } from "@/components/ui/link-row";
import { PageHead } from "@/components/ui/page-head";
import { VendorProfileActions } from "@/components/vendors/vendor-profile-actions";
import { approvalConfigFromOrg, requiredApprovers } from "@/lib/approval";
import { classify } from "@/lib/classification";
import { concentrationsFor, findConcentrations } from "@/lib/concentration";
import { CONFIRMATION_AREAS } from "@/lib/constants";
import { getOrganization, getVendor, listIssues, listTeam, listVendorRequests, listVendors } from "@/lib/data";
import { fmtDate, todayISO } from "@/lib/format";
import { calculateMateriality } from "@/lib/materiality";
import { questionCountsByControl } from "@/lib/questions";
import { requestsFor, reviewState, vendorStatus } from "@/lib/status";
import { calculateTier, tierConfigFromOrg } from "@/lib/tiering";

export const metadata = { title: "Vendor — BISON" };

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="sv-caption" style={{ marginBottom: 4 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

export default async function VendorProfilePage({ params }: PageProps<"/vendors/[id]">) {
  const { id } = await params;
  const v = await getVendor(Number(id));
  if (!v) notFound();
  const [cycles, team, questionCounts, allVendors, allIssues, org] = await Promise.all([
    listVendorRequests(),
    listTeam(),
    questionCountsByControl(),
    listVendors(),
    listIssues(),
    getOrganization(),
  ]);
  const today = todayISO();
  const reqs = requestsFor(cycles, v.id);
  const latest = reqs[0] ?? null;
  const issues = allIssues.filter((i) => i.vendor === v.name);
  const concentrations = concentrationsFor(v.id, findConcentrations(allVendors));
  const tierResult = calculateTier(v, concentrations.length > 0, tierConfigFromOrg(org ?? {}));
  const classification = classify(v);
  const materiality = calculateMateriality(
    v,
    org ?? { materialityDisruptionHours: null, materialityCustomerPct: null, materialityFinancialImpact: null },
    concentrations.length > 0
  );
  const approvers = requiredApprovers(v, tierResult.tier, materiality.outcome, classification.outcome, approvalConfigFromOrg(org ?? {}));

  return (
    <div className="sv-page">
      <Link className="sv-btn sv-btn--tertiary sv-btn--sm" href="/vendors" style={{ marginBottom: "var(--sv-space-3)" }}>
        <Icon name="chevronLeft" size={14} />
        Back to Vendors
      </Link>
      <PageHead
        title={v.name}
        intro={`${v.type} · ${v.contactName} · ${v.contact}`}
        aside={<StatusChip value={vendorStatus(cycles, v.id)} />}
      />
      <div className="row wrap" style={{ marginBottom: "var(--sv-space-5)", alignItems: "flex-start" }}>
        <div className="col sv-card" style={{ flex: 1, minWidth: 340 }}>
          <div className="sv-card__eyebrow">Profile</div>
          <div className="grid g2">
            <Fact label="Criticality">
              <CriticalityChip value={v.criticality} />
            </Fact>
            <Fact label="Vendor tier">
              <TierChip value={tierResult.tier} />
              {tierResult.overridden && <span className="sv-caption"> (override — calculated: {tierResult.calculated})</span>}
            </Fact>
            <Fact label="IT Outsourcing classification">
              <ClassificationChip value={classification.outcome} />
            </Fact>
            <Fact label="Materiality">
              <MaterialityChip value={materiality.outcome} />
            </Fact>
            <Fact label="Data accessed">
              <div className="sv-body-sm">{v.dataSensitivity}</div>
            </Fact>
            <Fact label="Frameworks touched">
              <div>
                <Chips items={v.frameworks} />
              </div>
            </Fact>
            <Fact label="Relationship owner">
              <div className="sv-body-sm">{v.owner}</div>
            </Fact>
            <Fact label="Country">
              <div className="sv-body-sm">{v.country || "—"}</div>
            </Fact>
            <Fact label="Contract start">
              <div className="sv-body-sm">{fmtDate(v.contractStart)}</div>
            </Fact>
            <Fact label="Cadence">
              <div className="sv-body-sm">{v.cadence}</div>
            </Fact>
            <Fact label="Timeline">
              <ReviewBadge state={reviewState(v, cycles, today)} />
            </Fact>
          </div>
          <Fact label={tierResult.overridden ? "Override justification" : "Why this tier"}>
            <div className="sv-body-sm">{tierResult.overridden ? v.tierOverrideReason || "—" : tierResult.reasons.join("; ")}</div>
          </Fact>
          <Fact label="Why this classification">
            <div className="sv-body-sm">{classification.reason}</div>
          </Fact>
          <Fact label="Why this materiality">
            <div className="sv-body-sm">{materiality.reasons.join("; ")}</div>
          </Fact>
          <Fact label="Impact inputs">
            <div className="sv-body-sm">
              Disruption tolerance: {v.disruptionToleranceHours ? `${v.disruptionToleranceHours}h` : "—"} · Customers affected:{" "}
              {v.customersAffectedPct ? `${v.customersAffectedPct}%` : "—"} · Financial impact:{" "}
              {v.financialImpactEstimate ? `₹${Number(v.financialImpactEstimate).toLocaleString("en-IN")}` : "—"}
            </div>
          </Fact>
          <VendorProfileActions
            vendor={v}
            latest={latest}
            teamNames={team.map((t) => t.name)}
            questionCounts={questionCounts}
            today={today}
          />
        </div>
        <div className="col sv-card" style={{ flex: 1, minWidth: 340 }}>
          <div className="sv-card__eyebrow">Dependency & concentration</div>
          <div className="grid g2">
            <Fact label="Legal entity">
              <div className="sv-body-sm">{v.legalEntity || "—"}</div>
            </Fact>
            <Fact label="Parent / group company">
              <div className="sv-body-sm">{v.parentGroup || "—"}</div>
            </Fact>
            <Fact label="Key subcontractors">
              <div>
                <Chips items={v.subcontractors ? v.subcontractors.split(",").map((s) => s.trim()).filter(Boolean) : []} />
                {!v.subcontractors && <span className="sv-body-sm">—</span>}
              </div>
            </Fact>
            <Fact label="Cloud / tech providers">
              <div>
                <Chips items={v.cloudProviders ? v.cloudProviders.split(",").map((s) => s.trim()).filter(Boolean) : []} />
                {!v.cloudProviders && <span className="sv-body-sm">—</span>}
              </div>
            </Fact>
            <Fact label="Alternative providers">
              <div className="sv-body-sm">{v.alternativeProviders || "—"}</div>
            </Fact>
            <Fact label="Dependency review status">
              <StatusChip value={v.dependencyReviewStatus} />
            </Fact>
          </div>
          {v.internalDependencies && (
            <Fact label="Internal services affected if this vendor fails">
              <div className="sv-body-sm">{v.internalDependencies}</div>
            </Fact>
          )}
          {concentrations.length > 0 && (
            <WarningAlert title="Shared with other vendors">
              <div className="stack" style={{ gap: "var(--sv-space-1)" }}>
                {concentrations.map((g) => (
                  <div key={`${g.kind}:${g.value}`}>
                    {g.label} <b>&ldquo;{g.value}&rdquo;</b>: {g.peers.map((p) => p.name).join(", ")}
                  </div>
                ))}
              </div>
            </WarningAlert>
          )}
          <div className="sv-card__eyebrow" style={{ marginTop: "var(--sv-space-3)" }}>
            Exit management
          </div>
          <div className="grid g2">
            <Fact label="Exit plan status">
              <StatusChip value={v.exitPlanStatus} />
            </Fact>
            {v.exitPlanStatus !== "Not Required" && (
              <>
                <Fact label="Transition date">
                  <div className="sv-body-sm">{fmtDate(v.exitTransitionDate)}</div>
                </Fact>
                <Fact label="Data return / deletion">
                  {v.dataReturnStatus ? <StatusChip value={v.dataReturnStatus} /> : <span className="sv-body-sm">—</span>}
                </Fact>
              </>
            )}
          </div>
          {v.exitClosureEvidence && (
            <Fact label="Exit closure evidence">
              <div className="sv-body-sm">{v.exitClosureEvidence}</div>
            </Fact>
          )}
        </div>
        <div className="col sv-card" style={{ flex: 1, minWidth: 340 }}>
          <div className="sv-card__eyebrow">Approval workflow</div>
          <Fact label="Approval status">
            <StatusChip value={v.approvalStatus} />
          </Fact>
          <Fact label="Internal confirmations received">
            <div>
              <Chips items={v.crossFunctionalConfirmations} />
              {v.crossFunctionalConfirmations.length === 0 && <span className="sv-body-sm">None yet</span>}
            </div>
            {CONFIRMATION_AREAS.some((a) => !v.crossFunctionalConfirmations.includes(a)) && (
              <div className="sv-caption" style={{ marginTop: 4 }}>
                Still pending: {CONFIRMATION_AREAS.filter((a) => !v.crossFunctionalConfirmations.includes(a)).join(", ")}
              </div>
            )}
          </Fact>
          <Fact label={`Required reviewers (${approvers.length})`}>
            <div className="stack" style={{ gap: "var(--sv-space-2)", marginTop: 4 }}>
              {approvers.map((a) => (
                <div key={a.role}>
                  <div style={{ fontWeight: 600 }} className="sv-body-sm">
                    {a.role}
                  </div>
                  <div className="sv-caption">{a.reason}</div>
                </div>
              ))}
            </div>
          </Fact>
        </div>
      </div>
      <h2 className="sv-h3" style={{ marginBottom: "var(--sv-space-3)" }}>
        Requests
      </h2>
      <div className="sv-table__scroll">
        <table className="sv-table">
          <caption>Every cycle sent to {v.name}</caption>
          <thead>
            <tr>
              <th>Sent</th>
              <th>Controls</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Due / completed</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {reqs.length === 0 ? (
              <tr>
                <td colSpan={6} className="sv-body-sm">
                  No requests sent yet.
                </td>
              </tr>
            ) : (
              reqs.map((r) => (
                <LinkRow key={r.id} href={`/sent-requests/${r.id}`}>
                  <td style={{ fontWeight: 600 }}>{fmtDate(r.sentOn)}</td>
                  <td>
                    <Chips items={r.controlsSent} />
                  </td>
                  <td>
                    <StatusChip value={r.status} />
                  </td>
                  <td className="sv-caption mono">
                    Q {r.qDone}/{r.qTotal} · Ev {r.evDone}/{r.evTotal}
                  </td>
                  <td className="sv-body-sm">{fmtDate(r.completedOn ?? r.due)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="sv-btn sv-btn--tertiary sv-btn--sm">View</button>
                  </td>
                </LinkRow>
              ))
            )}
          </tbody>
        </table>
      </div>
      <h2 className="sv-h3" style={{ margin: "var(--sv-space-5) 0 var(--sv-space-3)" }}>
        Issues & exceptions
      </h2>
      <div className="sv-table__scroll">
        <table className="sv-table">
          <caption>Findings raised against {v.name}</caption>
          <thead>
            <tr>
              <th>Finding</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {issues.length === 0 ? (
              <tr>
                <td colSpan={5} className="sv-body-sm">
                  No findings raised yet.
                </td>
              </tr>
            ) : (
              issues.map((i) => (
                <LinkRow key={i.id} href="/issues">
                  <td style={{ fontWeight: 600 }}>{i.title}</td>
                  <td>
                    <CriticalityChip value={i.severity} />
                  </td>
                  <td>
                    <StatusChip value={i.status} />
                  </td>
                  <td className="sv-body-sm">{i.owner}</td>
                  <td className="sv-body-sm">{fmtDate(i.dueDate)}</td>
                </LinkRow>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
