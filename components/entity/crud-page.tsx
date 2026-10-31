"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteRecord } from "@/actions/entity-actions";
import { EntityFormDrawer } from "@/components/entity/entity-form-drawer";
import { CatBadge, FreshChip, StatusChip } from "@/components/ui/badges";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { SearchInput } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { PageHead } from "@/components/ui/page-head";
import { useToast } from "@/components/toast/toast-provider";
import { fmtDate } from "@/lib/format";
import { SCHEMA, type EntityKey } from "@/lib/schema";

type AnyRow = { id: number } & Record<string, unknown>;

function Cell({ k, row }: { k: string; row: AnyRow }) {
  const v = row[k];
  if (k === "status") return <StatusChip value={String(v)} />;
  if (k === "freshness") return <FreshChip value={String(v)} />;
  if (k === "role") return <CatBadge>{(v as string) || "—"}</CatBadge>;
  if (k === "control") return <span className="sv-code">{(v as string) || "—"}</span>;
  if (k === "q" || k === "a") return <span className="trunc">{(v as string) || "—"}</span>;
  if (k === "used") return <span className="sv-figure">{(v as number) ?? 0} req.</span>;
  if (k === "uploaded" || k === "expiry" || k === "updated") return <span className="sv-code">{fmtDate(v as string)}</span>;
  return <span>{(v as string) ?? "—"}</span>;
}

export function displayName(row: AnyRow): string {
  return (row.name as string) || (row.q as string) || "this item";
}

/** Trust Pack answers/evidence and Team: search, table, add/edit drawer, delete confirm. */
export function CrudPage({ entity, rows, today }: { entity: EntityKey; rows: AnyRow[]; today: string }) {
  const s = SCHEMA[entity];
  const router = useRouter();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [drawer, setDrawer] = useState<{ open: boolean; row: AnyRow | null }>({ open: false, row: null });
  const [deleting, setDeleting] = useState<AnyRow | null>(null);
  const [pending, startTransition] = useTransition();

  const q = query.toLowerCase();
  const filtered = rows.filter((r) => !q || Object.values(r).join(" ").toLowerCase().includes(q));

  function confirmDelete() {
    if (!deleting) return;
    startTransition(async () => {
      const res = await deleteRecord(entity, deleting.id);
      if (!res.ok) return showToast(res.error, "danger");
      setDeleting(null);
      showToast("Deleted");
      router.refresh();
    });
  }

  return (
    <div className="sv-page">
      <PageHead title={s.nav} intro={s.intro} />
      <div className="toolbar">
        <SearchInput value={query} placeholder={`Search ${s.nav.toLowerCase()}`} onChange={setQuery} />
        <div style={{ flex: 1 }} />
        <button className="sv-btn sv-btn--primary" onClick={() => setDrawer({ open: true, row: null })}>
          <Icon name="plus" size={16} />
          {entity === "team" ? "Invite member" : `Add ${s.singular}`}
        </button>
      </div>
      <div className="sv-table__scroll">
        {filtered.length === 0 ? (
          <div className="sv-empty">
            <div className="sv-empty__title">No {s.nav.toLowerCase()} yet</div>
            <div>{q ? "Nothing matches your search." : `Add your first ${s.singular} to get started.`}</div>
          </div>
        ) : (
          <table className="sv-table">
            <caption>{s.caption}</caption>
            <thead>
              <tr>
                {s.columns.map(([k, label]) => (
                  <th key={k} className={k === "used" ? "is-num" : undefined}>
                    {label}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  {s.columns.map(([k]) => (
                    <td key={k} className={k === "used" ? "is-num" : undefined}>
                      <Cell k={k} row={r} />
                    </td>
                  ))}
                  <td>
                    <div className="rowact">
                      <button className="sv-btn sv-btn--tertiary sv-btn--sm" onClick={() => setDrawer({ open: true, row: r })}>
                        <Icon name="pencil" size={14} />
                        Edit
                      </button>
                      <button className="sv-btn sv-btn--tertiary sv-btn--sm" style={{ color: "var(--sv-danger)" }} onClick={() => setDeleting(r)}>
                        <Icon name="trash" size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <EntityFormDrawer schema={s} open={drawer.open} row={drawer.row} today={today} onClose={() => setDrawer((d) => ({ ...d, open: false }))} />
      <ConfirmModal open={deleting != null} title={`Delete ${s.singular}?`} pending={pending} onConfirm={confirmDelete} onClose={() => setDeleting(null)}>
        <b>{deleting ? displayName(deleting) : ""}</b> will be removed. This can&apos;t be undone.
      </ConfirmModal>
    </div>
  );
}
