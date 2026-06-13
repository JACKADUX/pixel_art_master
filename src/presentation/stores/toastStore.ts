import { create } from "zustand";
import { createToast } from "@/application/use-cases/ShowToast";
import type { Toast, ToastType } from "@/domain/notification/Toast";
import {
  enqueueToast,
  getEvictedToasts,
  removeToast,
} from "@/domain/notification/ToastQueue";

interface ToastStore {
  toasts: Toast[];
  show: (message: string, type?: ToastType, durationMs?: number) => string;
  dismiss: (id: string) => void;
}

const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearDismissTimer(id: string): void {
  const timer = dismissTimers.get(id);
  if (timer !== undefined) {
    clearTimeout(timer);
    dismissTimers.delete(id);
  }
}

function scheduleDismiss(id: string, durationMs: number, dismiss: (id: string) => void): void {
  clearDismissTimer(id);
  dismissTimers.set(
    id,
    setTimeout(() => {
      dismiss(id);
    }, durationMs),
  );
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  show(message, type = "info", durationMs) {
    const toast = createToast(message, type, durationMs);
    const prev = get().toasts;
    const next = enqueueToast(prev, toast);

    for (const evictedId of getEvictedToasts(prev, next)) {
      clearDismissTimer(evictedId);
    }

    set({ toasts: next });
    scheduleDismiss(toast.id, toast.durationMs, get().dismiss);
    return toast.id;
  },

  dismiss(id) {
    clearDismissTimer(id);
    set((state) => ({ toasts: removeToast(state.toasts, id) }));
  },
}));

export const toast = {
  error(message: string, durationMs?: number) {
    return useToastStore.getState().show(message, "error", durationMs);
  },
  warning(message: string, durationMs?: number) {
    return useToastStore.getState().show(message, "warning", durationMs);
  },
  info(message: string, durationMs?: number) {
    return useToastStore.getState().show(message, "info", durationMs);
  },
};
