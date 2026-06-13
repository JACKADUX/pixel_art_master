import { MAX_TOAST_COUNT, type Toast } from "@/domain/notification/Toast";

export function enqueueToast(
  queue: readonly Toast[],
  toast: Toast,
): Toast[] {
  const next = [...queue, toast];
  if (next.length <= MAX_TOAST_COUNT) {
    return next;
  }
  return next.slice(next.length - MAX_TOAST_COUNT);
}

export function removeToast(queue: readonly Toast[], id: string): Toast[] {
  return queue.filter((toast) => toast.id !== id);
}

export function getEvictedToasts(
  prev: readonly Toast[],
  next: readonly Toast[],
): string[] {
  const nextIds = new Set(next.map((toast) => toast.id));
  return prev.filter((toast) => !nextIds.has(toast.id)).map((toast) => toast.id);
}
