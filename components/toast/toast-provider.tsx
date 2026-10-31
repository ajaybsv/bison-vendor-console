"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

type ToastTone = "success" | "danger";

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("Saved");
  const [tone, setTone] = useState<ToastTone>("success");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, t: ToastTone = "success") => {
    setMessage(msg);
    setTone(t);
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2400);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="sv-toasts" role="status" aria-live="polite">
        <div className={`sv-toast sv-toast--${tone}${visible ? " on" : ""}`}>
          <span>
            <Icon name={tone === "danger" ? "alertOctagon" : "checkCircle"} size={18} />
          </span>
          <div className="sv-toast__main">{message}</div>
        </div>
      </div>
    </ToastContext.Provider>
  );
}
