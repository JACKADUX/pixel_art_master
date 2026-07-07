import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import type { ImageExportFormat } from "@/domain/export/ImageExportPreferences";

const JPEG_EXPORT_QUALITY = 0.92;

function getMimeType(format: ImageExportFormat): string {
  switch (format) {
    case "webp":
      return "image/webp";
    case "jpg":
      return "image/jpeg";
    default:
      return "image/png";
  }
}

export function pixelGridToImageBlob(
  grid: PixelGrid,
  format: ImageExportFormat,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = grid.width;
    canvas.height = grid.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Cannot create canvas context"));
      return;
    }
    ctx.imageSmoothingEnabled = false;
    const imageData = ctx.createImageData(grid.width, grid.height);
    imageData.data.set(grid.toRgba());
    ctx.putImageData(imageData, 0, 0);
    const mimeType = getMimeType(format);
    const quality = format === "jpg" ? JPEG_EXPORT_QUALITY : undefined;
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`Failed to create ${format.toUpperCase()} blob`));
      },
      mimeType,
      quality,
    );
  });
}

export async function pixelGridToImageBytes(
  grid: PixelGrid,
  format: ImageExportFormat,
): Promise<Uint8Array> {
  const blob = await pixelGridToImageBlob(grid, format);
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}
