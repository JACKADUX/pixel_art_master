import { isTauri } from "@tauri-apps/api/core";
import type { Image } from "@tauri-apps/api/image";
import { readImage as readTauriClipboardImage } from "@tauri-apps/plugin-clipboard-manager";

async function imageDataFromBlob(blob: Blob): Promise<ImageData | null> {
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return null;
  }
}

function imageDataFromRgba(
  rgbaBytes: Uint8Array,
  width: number,
  height: number,
): ImageData | null {
  if (width <= 0 || height <= 0) return null;
  const expectedLength = width * height * 4;
  if (rgbaBytes.length < expectedLength) return null;

  try {
    const rgba =
      rgbaBytes.length === expectedLength
        ? new Uint8ClampedArray(rgbaBytes)
        : new Uint8ClampedArray(rgbaBytes.buffer, rgbaBytes.byteOffset, expectedLength);
    return new ImageData(rgba, width, height);
  } catch {
    return null;
  }
}

async function imageDataFromTauriImage(image: Image): Promise<ImageData | null> {
  const [{ width, height }, rgbaBytes] = await Promise.all([
    image.size(),
    image.rgba(),
  ]);
  return imageDataFromRgba(new Uint8Array(rgbaBytes), width, height);
}

async function readNavigatorClipboardImage(): Promise<ImageData | null> {
  if (!navigator.clipboard?.read) return null;

  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const imageType = item.types.find((type) => type.startsWith("image/"));
      if (!imageType) continue;
      const blob = await item.getType(imageType);
      const imageData = await imageDataFromBlob(blob);
      if (imageData) return imageData;
    }
  } catch {
    return null;
  }

  return null;
}

export async function readClipboardImageData(): Promise<ImageData | null> {
  if (isTauri()) {
    try {
      const image = await readTauriClipboardImage();
      const fromNative = await imageDataFromTauriImage(image);
      if (fromNative) return fromNative;
    } catch {
      // Fall through to navigator clipboard API.
    }
  }

  return readNavigatorClipboardImage();
}
