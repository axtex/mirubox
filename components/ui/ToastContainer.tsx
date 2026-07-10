"use client";

import { useToastState } from "@/context/ToastContext";
import { Toast } from "@/components/ui/Toast";

export function ToastContainer() {
  const { toasts, dismissToast } = useToastState();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
