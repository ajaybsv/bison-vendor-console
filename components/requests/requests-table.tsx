"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Chips, ProgressBar, StatusChip } from "@/components/ui/badges";
import { ClickRow, SearchInput } from "@/components/ui/form";
import { PageHead } from "@/components/ui/page-head";
import { fmtDate } from "@/lib/format";
import { reqProgress, reqStatus } from "@/lib/status";
import type { ClientRequest } from "@/lib/types";

export function RequestsTable({ rows: all }: { rows: ClientRequest[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const q = query.toLowerCase();
  const rows = all.filter((r) => !q || r.client.toLowerCase().includes(q));

  return (
    <div className="sv-page">
      <PageHead
        title="Requests"
        intro="Every assessment a client has asked you to complete. Open one to answer questions and attach evidence."
      />
      <div className="toolbar">
        <SearchInput value={query} placeholder="Search by client" onChange={setQuery} />
      </div>
      <div className="sv-table__scroll">
        {rows.length === 0 ? (
          <div className="sv-empty">
            <div className="sv-empty__title">No requests match</div>
            <div>Try a different search.</div>
          </div>
        ) : (
          <table className="sv-table">
            <caption>All requests</caption>
            <thead>
              <tr>
                <th>Client</th>
                <th>Type</th>
                <th>Frameworks</th>
                <th>Progress</th>
                <th>Due</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <ClickRow key={r.id} onActivate={() => router.push(`/requests/${r.id}`)}>
                  <td style={{ fontWeight: 600 }}>{r.client}</td>
                  <td className="sv-body-sm">{r.kind}</td>
                  <td>
                    <Chips items={r.frameworks} />
                  </td>
                  <td style={{ minWidth: 150 }}>
                    <ProgressBar pct={reqProgress(r)} />
                    <div className="sv-caption mono" style={{ marginTop: 4 }}>
                      Q {r.qDone}/{r.qTotal} · Ev {r.evDone}/{r.evTotal}
                    </div>
                  </td>
                  <td className="sv-body-sm">{fmtDate(r.due)}</td>
                  <td>
                    <StatusChip value={reqStatus(r)} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className="sv-btn sv-btn--tertiary sv-btn--sm">Open workspace</button>
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
