import { Image } from "@tauri-apps/api/image";
import {
  readImage as readClipboardImage,
  writeImage,
} from "@tauri-apps/plugin-clipboard-manager";
import type { IClipboardService } from "@/application/ports/IClipboardService";

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
    try {
      const image = await readClipboardImage();
      const [rgba, { width, height }] = await Promise.all([
        image.rgba(),
        image.size(),
      ]);
      if (width <= 0 || height <= 0) return null;
      return new ImageData(new Uint8ClampedArray(rgba), width, height);
    } catch {
      return null;
    }
  },
};
