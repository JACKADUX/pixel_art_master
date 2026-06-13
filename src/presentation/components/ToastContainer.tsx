import { createPortal } from "react-dom";
import { ToastItem } from "@/presentation/components/ToastItem";
import { useToastStore } from "@/presentation/stores/toastStore";

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div
      aria-label="通知"
      className="pointer-events-none fixed bottom-10 right-4 z-[70] flex flex-col items-end gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>,
    document.body,
  );
}
