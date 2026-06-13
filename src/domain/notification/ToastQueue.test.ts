import { describe, expect, it } from "vitest";
import {
  enqueueToast,
  getEvictedToasts,
  removeToast,
} from "@/domain/notification/ToastQueue";
import type { Toast } from "@/domain/notification/Toast";

function makeToast(id: string): Toast {
  return {
    id,
    message: `message-${id}`,
    type: "info",
    createdAt: Date.now(),
    durationMs: 3000,
  };
}

describe("ToastQueue", () => {
  it("appends toast to the end of the queue", () => {
    const queue = [makeToast("a"), makeToast("b")];
    const next = enqueueToast(queue, makeToast("c"));

    expect(next.map((toast) => toast.id)).toEqual(["a", "b", "c"]);
  });

  it("evicts the oldest toast when exceeding max count", () => {
    let queue: Toast[] = [];
    for (let i = 0; i < 11; i += 1) {
      queue = enqueueToast(queue, makeToast(String(i)));
    }

    expect(queue).toHaveLength(10);
    expect(queue.map((toast) => toast.id)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
    ]);
  });

  it("removes toast by id", () => {
    const queue = [makeToast("a"), makeToast("b"), makeToast("c")];
    const next = removeToast(queue, "b");

    expect(next.map((toast) => toast.id)).toEqual(["a", "c"]);
  });

  it("returns evicted toast ids", () => {
    const prev = [makeToast("a"), makeToast("b"), makeToast("c")];
    const next = [makeToast("b"), makeToast("c"), makeToast("d")];

    expect(getEvictedToasts(prev, next)).toEqual(["a"]);
  });
});
