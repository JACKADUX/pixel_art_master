import { readFile } from "@tauri-apps/plugin-fs";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import {
  buildPatternBrushLibraryRoot,
  joinPath,
} from "@/domain/patternBrush/PatternBrushPaths";

function resolvePatternBrushImageAbsolutePath(
  workspacePath: string,
  imageFile: string,
): string {
  return joinPath(buildPatternBrushLibraryRoot(workspacePath), imageFile);
}

export async function loadPatternBrushImageBlobUrl(
  workspacePath: string,
  imageFile: string,
): Promise<string | null> {
  const absolutePath = resolvePatternBrushImageAbsolutePath(workspacePath, imageFile);

  try {
    const bytes = await readFile(absolutePath);
    if (bytes.length === 0) return null;
    return URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
  } catch {
    return null;
  }
}

export function revokePatternBrushImageBlobUrl(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export async function loadPatternBrushImageAsPixelGrid(
  workspacePath: string,
  imageFile: string,
): Promise<PixelGrid | null> {
  const absolutePath = resolvePatternBrushImageAbsolutePath(workspacePath, imageFile);

  try {
    const bytes = await readFile(absolutePath);
    if (bytes.length === 0) return null;
    const blob = new Blob([bytes], { type: "image/png" });
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return PixelGrid.fromRgba(canvas.width, canvas.height, imageData.data);
  } catch {
    return null;
  }
}
