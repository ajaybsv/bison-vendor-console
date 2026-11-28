"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createVendorFromWizard } from "@/actions/vendor-wizard-actions";
import { useToast } from "@/components/toast/toast-provider";
import { Checkbox, Select } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { PageHead } from "@/components/ui/page-head";
import { DATA_HANDLING_STEP_ID, DATA_HANDLING_TRIGGER_FIELD, WIZARD_STEPS, type WizardField } from "@/lib/vendor-wizard";

type Values = Record<string, string | string[]>;

export function RegistrationWizard({ tenant, teamNames }: { tenant: string; teamNames: string[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [values, setValues] = useState<Values>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [pending, startTransition] = useTransition();

  // The data-handling follow-up only makes sense once the requester has said the vendor
  // handles customer/personal information — skip it otherwise.
  const steps = useMemo(
    () => WIZARD_STEPS.filter((s) => s.id !== DATA_HANDLING_STEP_ID || values[DATA_HANDLING_TRIGGER_FIELD] === "Yes"),
    [values]
  );
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  function set(k: string, v: string | string[]) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function missingRequired(): string | null {
    for (const f of step.fields) {
      if (!f.req) continue;
      const v = values[f.k];
      if (!v || (typeof v === "string" && !v.trim())) return f.l;
    }
    return null;
  }

  function next() {
    const missing = missingRequired();
    if (missing) return showToast(`Fill in "${missing}"`, "danger");
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }

  function back() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function submit() {
    const missing = missingRequired();
    if (missing) return showToast(`Fill in "${missing}"`, "danger");
    startTransition(async () => {
      const res = await createVendorFromWizard(values);
      if (!res.ok) return showToast(res.error, "danger");
      showToast("Vendor registered");
      router.push(`/${tenant}/vendors/${res.id}`);
    });
  }

  function fieldOpts(f: WizardField): readonly string[] {
    if (f.k === "owner") return teamNames;
    return f.opts ?? [];
  }

  return (
    <div className="sv-page" style={{ maxWidth: 640 }}>
      <PageHead title="Register a vendor" intro="A few business-friendly questions — TPRM reviews and validates the classification afterwards." />
      <div className="row" style={{ gap: 6, marginBottom: "var(--sv-space-5)" }}>
        {steps.map((s, i) => (
          <div
            key={s.id}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: i <= stepIndex ? "var(--sv-brand)" : "var(--sv-border)",
            }}
          />
        ))}
      </div>
      <div className="sv-caption" style={{ marginBottom: 4 }}>
        Step {stepIndex + 1} of {steps.length}
      </div>
      <h2 className="sv-h2" style={{ marginBottom: 4 }}>
        {step.title}
      </h2>
      <p className="sv-body" style={{ marginBottom: "var(--sv-space-5)" }}>
        {step.intro}
      </p>
      <div className="stack" style={{ gap: "var(--sv-space-4)", marginBottom: "var(--sv-space-6)" }}>
        {step.fields.map((f) => {
          const id = `wf_${f.k}`;
          const val = values[f.k];
          const opts = fieldOpts(f);
          return (
            <div className="sv-field" key={f.k}>
              <label className="sv-field__label" htmlFor={id}>
                {f.l}
                {f.req && <span style={{ color: "var(--sv-danger)" }}> *</span>}
              </label>
              {f.t === "text" && (
                <input
                  className="sv-field__input"
                  id={id}
                  value={(val as string) ?? ""}
                  placeholder={f.ph}
                  onChange={(e) => set(f.k, e.target.value)}
                />
              )}
              {f.t === "textarea" && (
                <textarea
                  className="sv-field__input"
                  id={id}
                  value={(val as string) ?? ""}
                  placeholder={f.ph}
                  onChange={(e) => set(f.k, e.target.value)}
                />
              )}
              {f.t === "select" && (
                <Select id={id} value={(val as string) ?? ""} options={[...opts]} placeholder="Select" onChange={(v) => set(f.k, v)} />
              )}
              {f.t === "checklist" && (
                <div className="stack">
                  {opts.map((o) => {
                    const selected = (val as string[]) ?? [];
                    return (
                      <Checkbox key={o} checked={selected.includes(o)} onChange={(c) => set(f.k, c ? [...selected, o] : selected.filter((x) => x !== o))}>
                        {o}
                      </Checkbox>
                    );
                  })}
                </div>
              )}
              {f.help && <div className="sv-field__hint">{f.help}</div>}
            </div>
          );
        })}
      </div>
      <div className="row" style={{ gap: "var(--sv-space-2)" }}>
        {stepIndex > 0 && (
          <button className="sv-btn sv-btn--tertiary" onClick={back} disabled={pending}>
            <Icon name="chevronLeft" size={14} />
            Back
          </button>
        )}
        <div style={{ flex: 1 }} />
        {isLast ? (
          <button className="sv-btn sv-btn--primary" onClick={submit} disabled={pending}>
            {pending ? "Registering…" : "Register vendor"}
          </button>
        ) : (
          <button className="sv-btn sv-btn--primary" onClick={next}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
