"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteRecord } from "@/actions/entity-actions";
import { EntityFormDrawer } from "@/components/entity/entity-form-drawer";
import { CriticalityChip, ReviewBadge, StatusChip } from "@/components/ui/badges";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SearchInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { PageHead } from "@/components/ui/page-head";
import { SendRequestDrawer, type SendTarget } from "@/components/vendors/send-request-drawer";
import { useToast } from "@/components/toast/toast-provider";
import { fmtDate } from "@/lib/format";
import { SCHEMA } from "@/lib/schema";
import { isInFlight, latestRequestFor, reviewState, vendorStatus } from "@/lib/status";
import type { Vendor, VendorRequest } from "@/lib/types";

export function sendTargetFor(v: Vendor, cycles: VendorRequest[]): SendTarget {
  const latest = latestRequestFor(cycles, v.id);
  return { vendor: { id: v.id, name: v.name, contact: v.contact }, latest };
}

export function VendorsTable({
  vendors,
  cycles,
  teamNames,
  questionCounts,
  today,
  initialSendId,
}: {
  vendors: Vendor[];
  cycles: VendorRequest[];
  teamNames: string[];
  questionCounts: Record<string, number>;
  today: string;
  initialSendId: number | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; row: Vendor | null }>({ open: false, row: null });
  const [deleting, setDeleting] = useState<Vendor | null>(null);
  const [sendTarget, setSendTarget] = useState<SendTarget | null>(() => {
    const v = vendors.find((x) => x.id === initialSendId);
    return v ? sendTargetFor(v, cycles) : null;
  });
  const [pending, startTransition] = useTransition();

  const q = query.toLowerCase();
  const rows = vendors.filter((v) => !q || Object.values(v).join(" ").toLowerCase().includes(q));

  function closeSend() {
    setSendTarget(null);
    if (initialSendId != null) router.replace("/vendors", { scroll: false });
  }

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteRecord("vendors", deleting.id);
      if (!res.ok) return showToast(res.error, "danger");
      setDeleting(null);
      showToast("Deleted");
      router.refresh();
    });
  }

  return (
    <div className="sv-page">
      <PageHead title="Vendors" intro={SCHEMA.vendors.intro} />
      <div className="toolbar">
        <SearchInput value={query} placeholder="Search vendors" onChange={setQuery} />
        <div style={{ flex: 1 }} />
        <button className="sv-btn sv-btn--primary" onClick={() => setDrawer({ open: true, row: null })}>
          <Icon name="plus" size={16} />
          Add Vendor
        </button>
      </div>
      <div className="sv-table__scroll">
        {rows.length === 0 ? (
          <div className="sv-empty">
            <div className="sv-empty__title">No vendors match</div>
            <div>{q ? "Try a different search." : "Add your first vendor to get started."}</div>
          </div>
        ) : (
          <table className="sv-table">
            <caption>{SCHEMA.vendors.caption}</caption>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Type</th>
                <th>Criticality</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Timeline</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => {
                const status = vendorStatus(cycles, v.id);
                const latest = latestRequestFor(cycles, v.id);
                const inFlight = isInFlight(status);
                return (
                  <tr key={v.id}>
                    <td>
                      <Link
                        href={`/vendors/${v.id}`}
                        className="sv-btn sv-btn--tertiary sv-btn--sm"
                        style={{ padding: 0, height: "auto", fontWeight: 600, color: "var(--sv-ink)" }}
                      >
                        {v.name}
                      </Link>
                    </td>
                    <td className="sv-body-sm">{v.type}</td>
                    <td>
                      <CriticalityChip value={v.criticality} />
                    </td>
                    <td className="sv-body-sm">{v.owner}</td>
                    <td>
                      <StatusChip value={status} />
                    </td>
                    <td>
                      {inFlight && latest ? (
                        <span className="sv-body-sm">Due {fmtDate(latest.due)}</span>
                      ) : (
                        <ReviewBadge state={reviewState(v, cycles, today)} />
                      )}
                    </td>
                    <td>
                      <div className="rowact" style={{ justifyContent: "flex-end", alignItems: "center" }}>
                        {inFlight && latest ? (
                          <Link className="sv-btn sv-btn--tertiary sv-btn--sm" href={`/sent-requests/${latest.id}`}>
                            <Icon name="send" size={14} />
                            View request
                          </Link>
                        ) : (
                          <button className="sv-btn sv-btn--secondary sv-btn--sm" onClick={() => setSendTarget(sendTargetFor(v, cycles))}>
                            <Icon name="send" size={14} />
                            {latest ? "Reassess" : "Build & send"}
                          </button>
                        )}
                        <button className="sv-btn sv-btn--tertiary sv-btn--sm" onClick={() => setDrawer({ open: true, row: v })}>
                          <Icon name="pencil" size={14} />
                          Edit
                        </button>
                        <button className="sv-btn sv-btn--tertiary sv-btn--sm" style={{ color: "var(--sv-danger)" }} onClick={() => setDeleting(v)}>
                          <Icon name="trash" size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <EntityFormDrawer
        schema={SCHEMA.vendors}
        open={drawer.open}
        row={drawer.row}
        today={today}
        teamNames={teamNames}
        onClose={() => setDrawer((d) => ({ ...d, open: false }))}
      />
      <SendRequestDrawer target={sendTarget} questionCounts={questionCounts} today={today} onClose={closeSend} />
      <ConfirmModal open={deleting != null} title="Delete vendor?" pending={pending} onConfirm={confirmDelete} onClose={() => setDeleting(null)}>
        <b>{deleting?.name}</b> will be removed. This can&apos;t be undone.
      </ConfirmModal>
    </div>
  );
}
