"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveRecord } from "@/actions/entity-actions";
import { Drawer } from "@/components/ui/drawer";
import { Checkbox, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/toast/toast-provider";
import type { EntitySchema, FormValues } from "@/lib/schema";

type AnyRow = { id: number } & Record<string, unknown>;

function initialValues(schema: EntitySchema, row: AnyRow | null, today: string): FormValues {
  const v: FormValues = {};
  for (const f of schema.fields) {
    const raw = row?.[f.k];
    if (f.t === "checklist") v[f.k] = Array.isArray(raw) ? (raw as string[]) : [];
    else if (raw != null) v[f.k] = String(raw);
    else v[f.k] = !row && f.today ? today : "";
  }
  return v;
}

const capitalize = (s: string) => s[0]!.toUpperCase() + s.slice(1);

/** Schema-driven add/edit drawer. `row` null = add; `open` false = closed. */
export function EntityFormDrawer({
  schema,
  open,
  row,
  today,
  teamNames = [],
  onClose,
}: {
  schema: EntitySchema;
  open: boolean;
  row: AnyRow | null;
  today: string;
  teamNames?: string[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [values, setValues] = useState<FormValues>(() => initialValues(schema, row, today));
  const [pending, startTransition] = useTransition();

  // Reset the form each time the drawer opens (adjusting state during render, not in an effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setValues(initialValues(schema, row, today));
  }

  const set = (k: string, v: string | string[]) => setValues((prev) => ({ ...prev, [k]: v }));
  const editing = row != null;
  const isTeam = schema.key === "team";

  function save() {
    startTransition(async () => {
      const res = await saveRecord(schema.key, row?.id ?? null, values);
      if (!res.ok) return showToast(res.error, "danger");
      showToast(
        editing ? `${capitalize(schema.singular)} updated` : isTeam ? "Invite sent" : `${capitalize(schema.singular)} added`
      );
      onClose();
      router.refresh();
    });
  }

  const title = (editing ? "Edit " : isTeam ? "Invite " : "Add ") + schema.singular;

  return (
    <Drawer
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="sv-btn sv-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="sv-btn sv-btn--primary" onClick={save} disabled={pending}>
            Save
          </button>
        </>
      }
    >
      {schema.fields.map((f) => {
        if (f.editOnly && !editing) return null;
        const id = `f_${f.k}`;
        const val = values[f.k];
        const opts = f.optsFrom === "team" ? teamNames : (f.opts ?? []);
        return (
          <div className="sv-field" key={f.k}>
            <label className="sv-field__label" htmlFor={id}>
              {f.l}
              {f.req && <span style={{ color: "var(--sv-danger)" }}> *</span>}
            </label>
            {(f.t === "text" || f.t === "date") && (
              <input
                className="sv-field__input"
                id={id}
                type={f.t}
                value={(val as string) ?? ""}
                placeholder={f.ph}
                onChange={(e) => set(f.k, e.target.value)}
              />
            )}
            {f.t === "textarea" && (
              <textarea className="sv-field__input" id={id} value={(val as string) ?? ""} placeholder={f.ph} onChange={(e) => set(f.k, e.target.value)} />
            )}
            {f.t === "select" && <Select id={id} value={(val as string) ?? ""} options={[...opts]} placeholder="Select" onChange={(v) => set(f.k, v)} />}
            {f.t === "checklist" && (
              <div className="stack">
                {opts.map((o) => {
                  const selected = (val as string[]) ?? [];
                  return (
                    <Checkbox
                      key={o}
                      checked={selected.includes(o)}
                      onChange={(c) => set(f.k, c ? [...selected, o] : selected.filter((x) => x !== o))}
                    >
                      {o}
                    </Checkbox>
                  );
                })}
              </div>
            )}
            {f.t === "file" && (
              <div className="sv-dropzone">
                <Icon name="upload" size={18} />
                File upload coming soon
              </div>
            )}
            {f.help && <div className="sv-field__hint">{f.help}</div>}
          </div>
        );
      })}
    </Drawer>
  );
}
