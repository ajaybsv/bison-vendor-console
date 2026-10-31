"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveOrgProfile, setNotification, type NotificationKey, type OrgProfile } from "@/actions/settings-actions";
import { Checkbox, Select } from "@/components/ui/form";
import { PageHead } from "@/components/ui/page-head";
import { useToast } from "@/components/toast/toast-provider";
import { VENDOR_TYPES } from "@/lib/constants";

const NOTIFICATIONS: [NotificationKey, string][] = [
  ["notifReminders", "Due-date reminders"],
  ["notifDigest", "Weekly digest"],
  ["notifExpiry", "Evidence expiry alerts"],
];

export function SettingsForm({ profile, notifications }: { profile: OrgProfile; notifications: Record<NotificationKey, boolean> }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [form, setForm] = useState(profile);
  const [notif, setNotif] = useState(notifications);
  const [pending, startTransition] = useTransition();
  const set = (k: keyof OrgProfile) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function save() {
    startTransition(async () => {
      const res = await saveOrgProfile(form);
      if (!res.ok) return showToast(res.error, "danger");
      showToast("Settings saved");
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
    </div>
  );
}
