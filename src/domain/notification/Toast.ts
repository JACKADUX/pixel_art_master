export type ToastType = "error" | "warning" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  createdAt: number;
  durationMs: number;
}

export const MAX_TOAST_COUNT = 10;
export const DEFAULT_TOAST_DURATION_MS = 3000;
