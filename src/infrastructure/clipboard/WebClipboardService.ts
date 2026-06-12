import type { IClipboardService } from "@/application/ports/IClipboardService";

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
    if (!navigator.clipboard?.read) return null;
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (!type.startsWith("image/")) continue;
          const blob = await item.getType(type);
          const bitmap = await createImageBitmap(blob);
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;
          ctx.drawImage(bitmap, 0, 0);
          return ctx.getImageData(0, 0, canvas.width, canvas.height);
        }
      }
    } catch {
      return null;
    }
    return null;
  },
};
