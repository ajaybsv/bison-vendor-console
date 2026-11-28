"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendVendorRequest } from "@/actions/vendor-actions";
import { Badge, InfoAlert } from "@/components/ui/badges";
import { Drawer } from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/toast/toast-provider";
import { EVI_TYPES } from "@/lib/constants";
import { addDaysISO, fmtDate } from "@/lib/format";
import { VENDOR_EVAL_DOMAINS } from "@/lib/vendor-evaluation";

export type SendTarget = {
  vendor: { id: number; name: string; contact: string };
  /** The vendor's most recent cycle, used to pre-fill scope on a reassessment. */
  latest: { sentOn: string; controlsSent: string[]; evidenceRequested: string[] } | null;
  /** Domains the system suggests based on this vendor's registration, classification and tier —
   * pre-checked on a new request, but TPRM can still add or remove before sending. */
  recommended: string[];
};

export function SendRequestDrawer({
  target,
  questionCounts,
  today,
  onClose,
}: {
  target: SendTarget | null;
  questionCounts: Record<string, number>;
  today: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [controls, setControls] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<string[]>([]);
  const [due, setDue] = useState("");
  const [pending, startTransition] = useTransition();
  // Keep the last target around while the drawer slides out, and pre-fill the scope
  // whenever a new target arrives (adjusting state during render, not in an effect).
  const [shown, setShown] = useState<SendTarget | null>(null);
  if (target && target !== shown) {
    setShown(target);
    const l = target.latest;
    setControls(l?.controlsSent.length ? l.controlsSent : target.recommended);
    setEvidence(l?.evidenceRequested.length ? l.evidenceRequested : ["ISO Certificate", "SOC Report", "VAPT Report"]);
    setDue(addDaysISO(today, 30));
  }

  const isResend = !!shown?.latest;
  const total = controls.reduce((s, c) => s + (questionCounts[c] ?? 0), 0);
  const toggle = (list: string[], set: (v: string[]) => void, item: string, on: boolean) =>
    set(on ? [...list, item] : list.filter((x) => x !== item));

  function send() {
    if (!shown) return;
    startTransition(async () => {
      const res = await sendVendorRequest(shown.vendor.id, controls, evidence, due);
      if (!res.ok) return showToast(res.error, "danger");
      onClose();
      showToast(`Request sent to ${shown.vendor.name}`);
      router.refresh();
    });
  }

  return (
    <Drawer
      open={target != null}
      title={isResend ? "Start reassessment" : "Build & send request"}
      onClose={onClose}
      footer={
        <>
          <button className="sv-btn sv-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="sv-btn sv-btn--primary" onClick={send} disabled={pending}>
            <Icon name="send" size={16} />
            {isResend ? "Send reassessment" : "Send request"}
          </button>
        </>
      }
    >
      {shown && (
        <>
          <div className="sv-field">
            <label className="sv-field__label">Sending to</label>
            <div className="sv-body-sm" style={{ fontWeight: 600, color: "var(--sv-ink)" }}>
              {shown.vendor.name} · {shown.vendor.contact}
            </div>
          </div>
          <InfoAlert compact>
            {shown.latest
              ? `Pre-filled from their last cycle (sent ${fmtDate(shown.latest.sentOn)}). Adjust scope if it's changed since then.`
              : `Domains below are suggested from ${shown.vendor.name}'s registration, classification and tier — a starting point from BISON's IT & security due-diligence question bank (sheet 6A). Add or remove domains before sending.`}
          </InfoAlert>
          <div className="sv-field">
            <label className="sv-field__label">Domains to include</label>
            <div className="stack">
              {VENDOR_EVAL_DOMAINS.map((c) => (
                <Checkbox key={c} checked={controls.includes(c)} onChange={(on) => toggle(controls, setControls, c, on)}>
                  {c} <span className="sv-caption">({questionCounts[c] ?? 0} questions)</span>
                  {!shown.latest && shown.recommended.includes(c) && <Badge tone="accent">Suggested</Badge>}
                </Checkbox>
              ))}
            </div>
            <div className="sv-field__hint">
              {total} question{total === 1 ? "" : "s"} total.
            </div>
          </div>
          <div className="sv-field">
            <label className="sv-field__label">Evidence to request</label>
            <div className="stack">
              {EVI_TYPES.map((e) => (
                <Checkbox key={e} checked={evidence.includes(e)} onChange={(on) => toggle(evidence, setEvidence, e, on)}>
                  {e}
                </Checkbox>
              ))}
            </div>
            <div className="sv-field__hint">Documents {shown.vendor.name} will need to upload alongside their answers.</div>
          </div>
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="sqDue">
              Due date
            </label>
            <input className="sv-field__input" type="date" id="sqDue" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </>
      )}
    </Drawer>
  );
}
