import type { IClipboardService } from "@/application/ports/IClipboardService";
import { readClipboardImageData } from "./ClipboardImageReader";

export const webClipboardService: IClipboardService = {
  async copyImage(pngBlob: Blob): Promise<void> {
    if (!navigator.clipboard?.write) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);
    } catch {
      // Clipboard API may be unavailable in some Tauri contexts
    }
  },

  async readImage(): Promise<ImageData | null> {
    return readClipboardImageData();
  },
};
