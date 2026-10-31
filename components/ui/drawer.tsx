"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/icon";

/** Right-hand slide-over (scrim + panel). Always mounted so the slide transition plays. */
export function Drawer({
  open,
  title,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`sv-scrim${open ? " on" : ""}`} onClick={onClose} />
      <aside className={`sv-drawer${open ? " on" : ""}`} aria-hidden={!open} inert={!open}>
        <div className="sv-modal__header">
          <h3 className="sv-modal__title">{title}</h3>
          <button className="sv-modal__close" onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="sv-modal__body">{children}</div>
        {footer && <div className="sv-modal__footer">{footer}</div>}
      </aside>
    </>
  );
}
