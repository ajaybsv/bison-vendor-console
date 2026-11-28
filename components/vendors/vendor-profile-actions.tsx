"use client";

import Link from "next/link";
import { useState } from "react";
import { EntityFormDrawer } from "@/components/entity/entity-form-drawer";
import { Icon } from "@/components/ui/icon";
import { SendRequestDrawer, type SendTarget } from "@/components/vendors/send-request-drawer";
import { SCHEMA } from "@/lib/schema";
import type { Tier } from "@/lib/tiering";
import type { Vendor } from "@/lib/types";
import { recommendedDomains } from "@/lib/vendor-evaluation";

export function VendorProfileActions({
  tenant,
  vendor,
  latest,
  teamNames,
  questionCounts,
  today,
  tier,
}: {
  tenant: string;
  vendor: Vendor;
  latest: { id: number; status: string; sentOn: string; controlsSent: string[]; evidenceRequested: string[] } | null;
  teamNames: string[];
  questionCounts: Record<string, number>;
  today: string;
  tier: Tier;
}) {
  const [editing, setEditing] = useState(false);
  const [sendTarget, setSendTarget] = useState<SendTarget | null>(null);
  const canSend = !latest || latest.status === "Completed";

  return (
    <div className="sv-card__footer">
      <button className="sv-btn sv-btn--secondary sv-btn--sm" onClick={() => setEditing(true)}>
        <Icon name="pencil" size={14} />
        Edit profile
      </button>
      {canSend ? (
        <button
          className="sv-btn sv-btn--primary sv-btn--sm"
          onClick={() =>
            setSendTarget({ vendor: { id: vendor.id, name: vendor.name, contact: vendor.contact }, latest, recommended: recommendedDomains(vendor, tier) })
          }
        >
          <Icon name="send" size={14} />
          {latest ? "Start reassessment" : "Build & send"}
        </button>
      ) : (
        <Link className="sv-btn sv-btn--primary sv-btn--sm" href={`/${tenant}/sent-requests/${latest.id}`}>
          <Icon name="send" size={14} />
          View current request
        </Link>
      )}
      <EntityFormDrawer
        schema={SCHEMA.vendors}
        open={editing}
        row={vendor}
        today={today}
        teamNames={teamNames}
        onClose={() => setEditing(false)}
      />
      <SendRequestDrawer target={sendTarget} questionCounts={questionCounts} today={today} onClose={() => setSendTarget(null)} />
    </div>
  );
}
