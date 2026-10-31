import Link from "next/link";
import { notFound } from "next/navigation";
import { Chips, CriticalityChip, ReviewBadge, StatusChip } from "@/components/ui/badges";
import { Icon } from "@/components/ui/icon";
import { LinkRow } from "@/components/ui/link-row";
import { PageHead } from "@/components/ui/page-head";
import { VendorProfileActions } from "@/components/vendors/vendor-profile-actions";
import { getVendor, listTeam, listVendorRequests } from "@/lib/data";
import { fmtDate, todayISO } from "@/lib/format";
import { questionCountsByControl } from "@/lib/questions";
import { requestsFor, reviewState, vendorStatus } from "@/lib/status";

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
  const [cycles, team, questionCounts] = await Promise.all([listVendorRequests(), listTeam(), questionCountsByControl()]);
  const today = todayISO();
  const reqs = requestsFor(cycles, v.id);
  const latest = reqs[0] ?? null;

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
          <VendorProfileActions
            vendor={v}
            latest={latest}
            teamNames={team.map((t) => t.name)}
            questionCounts={questionCounts}
            today={today}
          />
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
    </div>
  );
}
