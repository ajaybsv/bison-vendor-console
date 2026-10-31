"use client";

import { useTransition } from "react";
import { sendReminder } from "@/actions/vendor-actions";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/toast/toast-provider";

export function ReminderButton({ requestId, vendorName }: { requestId: number; vendorName: string }) {
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="sv-btn sv-btn--secondary sv-btn--sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await sendReminder(requestId);
          showToast(res.ok ? `Reminder sent to ${vendorName}` : res.error, res.ok ? "success" : "danger");
        })
      }
    >
      <Icon name="send" size={14} />
      Send reminder
    </button>
  );
}
