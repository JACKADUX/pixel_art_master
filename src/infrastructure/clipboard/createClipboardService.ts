import { isTauri } from "@tauri-apps/api/core";
import type { IClipboardService } from "@/application/ports/IClipboardService";
import { tauriClipboardService } from "./TauriClipboardService";
import { webClipboardService } from "./WebClipboardService";

export function createClipboardService(): IClipboardService {
  return isTauri() ? tauriClipboardService : webClipboardService;
}

export const clipboardService = createClipboardService();
