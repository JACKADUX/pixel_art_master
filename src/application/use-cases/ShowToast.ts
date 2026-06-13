import {
  DEFAULT_TOAST_DURATION_MS,
  type Toast,
  type ToastType,
} from "@/domain/notification/Toast";

export function createToast(
  message: string,
  type: ToastType = "info",
  durationMs = DEFAULT_TOAST_DURATION_MS,
): Toast {
  return {
    id: crypto.randomUUID(),
    message,
    type,
    createdAt: Date.now(),
    durationMs,
  };
}
