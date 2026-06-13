import { useEffect, useState } from "react";
import type { Toast, ToastType } from "@/domain/notification/Toast";

const TYPE_STYLES: Record<ToastType, string> = {
  error: "border-red-800 bg-red-950 text-red-300",
  warning: "border-yellow-800 bg-yellow-950 text-yellow-300",
  info: "border-green-800 bg-green-950 text-green-300",
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const enterFrame = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(enterFrame);
  }, []);

  const handleDismiss = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => {
      onDismiss(toast.id);
    }, 200);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={handleDismiss}
      className={`pointer-events-auto w-max max-w-sm cursor-pointer truncate rounded border px-3 py-2 text-xs shadow-lg transition-all duration-200 ${TYPE_STYLES[toast.type]} ${
        visible && !leaving
          ? "translate-x-0 translate-y-0 opacity-100"
          : leaving
            ? "translate-x-2 opacity-0"
            : "translate-y-2 opacity-0"
      }`}
    >
      {toast.message}
    </div>
  );
}
