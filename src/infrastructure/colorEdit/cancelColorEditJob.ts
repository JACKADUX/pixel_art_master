import { isTauri, invoke } from "@tauri-apps/api/core";
import {
  clearColorEditCancel,
  requestCancelColorEdit,
} from "./colorEditCancellation";

export async function cancelActiveColorEditJob(jobId: number): Promise<void> {
  if (jobId <= 0) return;
  requestCancelColorEdit(jobId);
  if (isTauri()) {
    try {
      await invoke("cancel_color_edit", { jobId });
    } catch {
      // Ignore cancel invoke failures; local cancellation still applies.
    }
  }
}

export function finalizeColorEditJob(jobId: number): void {
  clearColorEditCancel(jobId);
}
