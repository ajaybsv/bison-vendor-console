"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  saveGovernanceRules,
  saveMaterialityThresholds,
  saveOrgProfile,
  setNotification,
  type GovernanceRules,
  type MaterialityThresholds,
  type NotificationKey,
  type OrgProfile,
} from "@/actions/settings-actions";
import { Checkbox, Select } from "@/components/ui/form";
import { PageHead } from "@/components/ui/page-head";
import { useToast } from "@/components/toast/toast-provider";
import { BOARD_TRIGGERS, CEO_TRIGGERS } from "@/lib/approval";
import { NBFC_LAYERS, ORGANISATION_TYPES, REVIEW_FREQUENCIES, VENDOR_TYPES, YES_NO_NOTSURE } from "@/lib/constants";
import { TIERS } from "@/lib/tiering";

const NOTIFICATIONS: [NotificationKey, string][] = [
  ["notifReminders", "Due-date reminders"],
  ["notifDigest", "Weekly digest"],
  ["notifExpiry", "Evidence expiry alerts"],
];

export function SettingsForm({
  profile,
  notifications,
  materiality,
  governance,
}: {
  profile: OrgProfile;
  notifications: Record<NotificationKey, boolean>;
  materiality: MaterialityThresholds;
  governance: GovernanceRules;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState(profile);
  const [notif, setNotif] = useState(notifications);
  const [thresholds, setThresholds] = useState(materiality);
  const [rules, setRules] = useState(governance);
  const [pending, startTransition] = useTransition();
  const [thresholdsPending, startThresholdsTransition] = useTransition();
  const [rulesPending, startRulesTransition] = useTransition();
  const set = (k: keyof OrgProfile) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setThreshold = (k: keyof MaterialityThresholds) => (v: string) => setThresholds((t) => ({ ...t, [k]: v }));
  const setRule = (k: keyof GovernanceRules) => (v: string) => setRules((r) => ({ ...r, [k]: v }));

  function save() {
    startTransition(async () => {
      const res = await saveOrgProfile(form);
      if (!res.ok) return showToast(res.error, "danger");
      showToast("Settings saved");
      router.refresh();
    });
  }

  function saveThresholds() {
    startThresholdsTransition(async () => {
      const res = await saveMaterialityThresholds(thresholds);
      if (!res.ok) return showToast(res.error, "danger");
      showToast("Materiality thresholds saved");
      router.refresh();
    });
  }

  function saveRules() {
    startRulesTransition(async () => {
      const res = await saveGovernanceRules(rules);
      if (!res.ok) return showToast(res.error, "danger");
      showToast("Tiering & approval rules saved");
      router.refresh();
    });
  }

  function toggle(key: NotificationKey, on: boolean) {
    setNotif((n) => ({ ...n, [key]: on }));
    startTransition(async () => {
      const res = await setNotification(key, on);
      if (!res.ok) {
        setNotif((n) => ({ ...n, [key]: !on }));
        showToast(res.error, "danger");
      }
    });
  }

  return (
    <div className="sv-page">
      <PageHead title="Settings" intro="Organization profile and notification preferences." />
      <div className="row wrap">
        <div className="col sv-card" style={{ flex: 2, minWidth: 360 }}>
          <div className="sv-card__eyebrow">Organization profile</div>
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setName">
              Organization name
            </label>
            <input className="sv-field__input" type="text" id="setName" value={form.name} onChange={(e) => set("name")(e.target.value)} />
          </div>
          <div className="grid g2">
            <div className="sv-field">
              <label className="sv-field__label" htmlFor="setReg">
                Registration number
              </label>
              <input className="sv-field__input" type="text" id="setReg" value={form.regNo} onChange={(e) => set("regNo")(e.target.value)} />
            </div>
            <div className="sv-field">
              <label className="sv-field__label" htmlFor="setType">
                Vendor type
              </label>
              <Select id="setType" value={form.vendorType} options={VENDOR_TYPES} onChange={set("vendorType")} />
            </div>
          </div>
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setContact">
              Primary contact
            </label>
            <input
              className="sv-field__input"
              type="text"
              id="setContact"
              value={form.primaryContact}
              onChange={(e) => set("primaryContact")(e.target.value)}
            />
          </div>
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setAddr">
              Registered address
            </label>
            <textarea className="sv-field__input" id="setAddr" value={form.address} onChange={(e) => set("address")(e.target.value)} />
          </div>
          <div className="sv-card__footer" style={{ borderTop: 0, paddingTop: 0, justifyContent: "flex-end" }}>
            <button className="sv-btn sv-btn--primary" onClick={save} disabled={pending}>
              Save changes
            </button>
          </div>
        </div>
        <div className="col stack" style={{ minWidth: 270 }}>
          <div className="sv-card">
            <div className="sv-card__eyebrow">Notifications</div>
            <div className="stack">
              {NOTIFICATIONS.map(([k, label]) => (
                <Checkbox key={k} checked={notif[k]} onChange={(on) => toggle(k, on)}>
                  {label}
                </Checkbox>
              ))}
            </div>
          </div>
          <div className="sv-card">
            <div className="sv-card__eyebrow">Security</div>
            <div className="sv-body-sm">Two-factor authentication and session management are coming soon.</div>
            <button className="sv-btn sv-btn--secondary sv-btn--sm" disabled>
              Manage security
            </button>
          </div>
        </div>
      </div>
      <div className="sv-card" style={{ marginTop: "var(--sv-space-5)" }}>
        <div className="sv-card__eyebrow">Regulatory profile</div>
        <div className="sv-body-sm" style={{ marginTop: -4 }}>
          Activates RBI outsourcing-specific context where relevant — leave blank if it doesn&apos;t apply to your organisation.
        </div>
        <div className="grid g2">
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setOrgType">
              Organisation type
            </label>
            <Select id="setOrgType" value={form.organisationType} options={ORGANISATION_TYPES} placeholder="Not set" onChange={set("organisationType")} />
          </div>
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setRbiRe">
              RBI Regulated Entity (RE)?
            </label>
            <Select id="setRbiRe" value={form.isRbiRegulatedEntity} options={YES_NO_NOTSURE} placeholder="Not set" onChange={set("isRbiRegulatedEntity")} />
          </div>
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setNbfcLayer">
              NBFC category / layer
            </label>
            <Select id="setNbfcLayer" value={form.nbfcLayer} options={NBFC_LAYERS} placeholder="Not set" onChange={set("nbfcLayer")} />
          </div>
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setReviewFreq">
              Default review frequency
            </label>
            <Select id="setReviewFreq" value={form.defaultReviewFrequency} options={REVIEW_FREQUENCIES} onChange={set("defaultReviewFrequency")} />
            <div className="sv-field__hint">The starting reassessment cadence for a newly registered vendor; each vendor&apos;s cadence can still be changed individually.</div>
          </div>
        </div>
        <div className="sv-card__footer" style={{ borderTop: 0, paddingTop: 0, justifyContent: "flex-end" }}>
          <button className="sv-btn sv-btn--primary" onClick={save} disabled={pending}>
            Save changes
          </button>
        </div>
      </div>
      <div className="sv-card" style={{ marginTop: "var(--sv-space-5)" }}>
        <div className="sv-card__eyebrow">Materiality thresholds</div>
        <div className="sv-body-sm" style={{ marginTop: -4 }}>
          Each vendor&apos;s measurable impact facts are compared against these — not a universal, hard-coded range. Leave a threshold blank to
          leave that factor out of the materiality check.
        </div>
        <div className="grid g2">
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setMatDisruption">
              Disruption tolerance threshold (hours)
            </label>
            <input
              className="sv-field__input"
              type="text"
              id="setMatDisruption"
              placeholder="e.g. 8"
              value={thresholds.materialityDisruptionHours}
              onChange={(e) => setThreshold("materialityDisruptionHours")(e.target.value)}
            />
            <div className="sv-field__hint">A vendor whose disruption tolerance is at or below this triggers a materiality factor.</div>
          </div>
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setMatCustomer">
              Customer impact threshold (%)
            </label>
            <input
              className="sv-field__input"
              type="text"
              id="setMatCustomer"
              placeholder="e.g. 20"
              value={thresholds.materialityCustomerPct}
              onChange={(e) => setThreshold("materialityCustomerPct")(e.target.value)}
            />
            <div className="sv-field__hint">A vendor whose affected-customer share meets or exceeds this triggers a materiality factor.</div>
          </div>
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setMatFinancial">
              Financial impact threshold (₹)
            </label>
            <input
              className="sv-field__input"
              type="text"
              id="setMatFinancial"
              placeholder="e.g. 10000000"
              value={thresholds.materialityFinancialImpact}
              onChange={(e) => setThreshold("materialityFinancialImpact")(e.target.value)}
            />
            <div className="sv-field__hint">A vendor whose estimated impact meets or exceeds this triggers a materiality factor.</div>
          </div>
        </div>
        <div className="sv-card__footer" style={{ borderTop: 0, paddingTop: 0, justifyContent: "flex-end" }}>
          <button className="sv-btn sv-btn--primary" onClick={saveThresholds} disabled={thresholdsPending}>
            Save thresholds
          </button>
        </div>
      </div>
      <div className="sv-card" style={{ marginTop: "var(--sv-space-5)" }}>
        <div className="sv-card__eyebrow">Tiering & approval rules</div>
        <div className="sv-body-sm" style={{ marginTop: -4 }}>
          How far a concentration flag or limited replaceability pushes a vendor&apos;s tier, and when CEO or Board sign-off is required —
          configurable here instead of fixed in code.
        </div>
        <div className="grid g2">
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setTierConcentration">
              Concentration escalates tier to
            </label>
            <Select
              id="setTierConcentration"
              value={rules.tierConcentrationTrigger}
              options={[...TIERS]}
              onChange={setRule("tierConcentrationTrigger")}
            />
            <div className="sv-field__hint">Applied when a vendor shares a legal entity, group, subcontractor or cloud provider with another.</div>
          </div>
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setTierAlternatives">
              Limited alternatives escalates tier to
            </label>
            <Select
              id="setTierAlternatives"
              value={rules.tierLimitedAlternativesTrigger}
              options={[...TIERS]}
              onChange={setRule("tierLimitedAlternativesTrigger")}
            />
            <div className="sv-field__hint">Applied when a vendor&apos;s alternative providers are Limited or Not practical.</div>
          </div>
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setApprovalCeo">
              CEO / Senior Management sign-off required when
            </label>
            <Select id="setApprovalCeo" value={rules.approvalCeoTrigger} options={[...CEO_TRIGGERS]} onChange={setRule("approvalCeoTrigger")} />
          </div>
          <div className="sv-field">
            <label className="sv-field__label" htmlFor="setApprovalBoard">
              Board / Committee sign-off required when
            </label>
            <Select id="setApprovalBoard" value={rules.approvalBoardTrigger} options={[...BOARD_TRIGGERS]} onChange={setRule("approvalBoardTrigger")} />
          </div>
        </div>
        <div className="sv-card__footer" style={{ borderTop: 0, paddingTop: 0, justifyContent: "flex-end" }}>
          <button className="sv-btn sv-btn--primary" onClick={saveRules} disabled={rulesPending}>
            Save rules
          </button>
        </div>
      </div>
    </div>
  );
}
