import { Image } from "@tauri-apps/api/image";
import { writeImage } from "@tauri-apps/plugin-clipboard-manager";
import type { IClipboardService } from "@/application/ports/IClipboardService";
import { readClipboardImageData } from "./ClipboardImageReader";

export const tauriClipboardService: IClipboardService = {
  async copyImage(pngBlob: Blob): Promise<void> {
    try {
      const bytes = new Uint8Array(await pngBlob.arrayBuffer());
      const image = await Image.fromBytes(bytes);
      await writeImage(image);
    } catch {
      // Native clipboard may be unavailable
    }
  },

  async readImage(): Promise<ImageData | null> {
    return readClipboardImageData();
  },
};
