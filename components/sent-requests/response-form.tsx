"use client";

import { useState, useTransition } from "react";
import { recordVendorResponse } from "@/actions/vendor-actions";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/toast/toast-provider";
import type { Question } from "@/lib/types";

export function ResponseForm({ requestId, question, locked }: { requestId: number; question: Question; locked: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  function record() {
    startTransition(async () => {
      const res = await recordVendorResponse(requestId, question.id, value);
      if (!res.ok) return showToast(res.error, "danger");
      showToast("Response recorded");
      router.refresh();
    });
  }

  if (locked) return null;

  return (
    <div className="stack" style={{ gap: "var(--sv-space-2)", marginTop: "var(--sv-space-2)" }}>
      {question.type === "choice" ? (
        <div style={{ display: "flex", gap: "var(--sv-space-2)", flexWrap: "wrap" }}>
          {question.options.map((o) => (
            <button
              key={o}
              className={`sv-btn ${value === o ? "sv-btn--primary" : "sv-btn--secondary"} sv-btn--sm`}
              disabled={pending}
              onClick={() => setValue(o)}
            >
              {value === o && <Icon name="check" size={13} />}
              {o}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          className="sv-field__input"
          placeholder="What the vendor told you"
          disabled={pending}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}
      <button className="sv-btn sv-btn--secondary sv-btn--sm" disabled={pending || !value.trim()} onClick={record}>
        Record response
      </button>
    </div>
  );
}
