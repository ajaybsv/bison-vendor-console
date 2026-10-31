"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chips, StatusChip } from "@/components/ui/badges";
import { ClickRow, SearchInput } from "@/components/ui/form";
import { PageHead } from "@/components/ui/page-head";
import { fmtDate } from "@/lib/format";
import type { VendorRequest } from "@/lib/types";

export function SentRequestsTable({ rows: all }: { rows: VendorRequest[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();
  const rows = all.filter((r) => !q || `${r.vendorName} ${r.status}`.toLowerCase().includes(q));

  return (
    <div className="sv-page">
      <PageHead
        title="Sent Requests"
        intro="Every questionnaire and evidence request sent to a vendor — current and past. Open one to see exactly what was asked and what came back."
      />
      <div className="toolbar">
        <SearchInput value={query} placeholder="Search by vendor" onChange={setQuery} />
      </div>
      <div className="sv-table__scroll">
        {rows.length === 0 ? (
          <div className="sv-empty">
            <div className="sv-empty__title">No requests match</div>
            <div>{q ? "Try a different search." : "Send a request to a vendor from the Vendors page to see it here."}</div>
          </div>
        ) : (
          <table className="sv-table">
            <caption>Every request sent to a vendor</caption>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Controls</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Due / completed</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <ClickRow key={r.id} onActivate={() => router.push(`/sent-requests/${r.id}`)}>
                  <td style={{ fontWeight: 600 }}>{r.vendorName}</td>
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
                </ClickRow>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
