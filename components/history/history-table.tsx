"use client";

import { useState } from "react";
import { Chips, ComplianceBadge, InfoAlert } from "@/components/ui/badges";
import { Drawer } from "@/components/ui/drawer";
import { ClickRow } from "@/components/ui/form";
import { PageHead } from "@/components/ui/page-head";
import { fmtDate } from "@/lib/format";
import type { HistoryEntry } from "@/lib/types";

export function HistoryTable({ rows }: { rows: HistoryEntry[] }) {
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const show = (h: HistoryEntry) => {
    setEntry(h);
    setOpen(true);
  };

  return (
    <div className="sv-page">
      <PageHead
        title="Request history"
        intro="Completed assessments. Read-only — reopen a client's next request from Requests when it comes in."
      />
      <div className="sv-table__scroll">
        <table className="sv-table">
          <caption>Completed assessments</caption>
          <thead>
            <tr>
              <th>Client</th>
              <th>Frameworks</th>
              <th>Completed</th>
              <th>Final compliance</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <ClickRow key={h.id} onActivate={() => show(h)}>
                <td style={{ fontWeight: 600 }}>{h.client}</td>
                <td>
                  <Chips items={h.frameworks} />
                </td>
                <td className="sv-body-sm">{fmtDate(h.completedOn)}</td>
                <td>
                  <ComplianceBadge value={h.compliance} />
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="sv-btn sv-btn--tertiary sv-btn--sm">View</button>
                </td>
              </ClickRow>
            ))}
          </tbody>
        </table>
      </div>
      <Drawer open={open} title={entry ? `${entry.client} — completed assessment` : ""} onClose={() => setOpen(false)}>
        {entry && (
          <div className="stack">
            <div className="between">
              <span className="sv-body-sm">Completed on</span>
              <span style={{ fontWeight: 600 }}>{fmtDate(entry.completedOn)}</span>
            </div>
            <div className="between">
              <span className="sv-body-sm">Frameworks</span>
              <span>
                <Chips items={entry.frameworks} />
              </span>
            </div>
            <div className="between">
              <span className="sv-body-sm">Final compliance score</span>
              <ComplianceBadge value={entry.compliance} />
            </div>
            <div style={{ marginTop: "var(--sv-space-2)" }}>
              <InfoAlert>
                Archived — the reviewer&apos;s per-question and per-evidence decisions are kept on their side. Your Trust Pack still has the
                answers and evidence you supplied.
              </InfoAlert>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
