"use client";

import { useEffect } from "react";

export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Delete",
  pending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="sv-modal">
      <div className="sv-modal__panel" role="alertdialog" aria-labelledby="mTitle">
        <div className="sv-modal__header">
          <h3 className="sv-modal__title" id="mTitle">
            {title}
          </h3>
        </div>
        <div className="sv-modal__body">
          <p className="sv-body-sm" style={{ margin: 0 }}>
            {children}
          </p>
        </div>
        <div className="sv-modal__footer">
          <button className="sv-btn sv-btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="sv-btn sv-btn--danger" onClick={onConfirm} disabled={pending}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
