import { convertFileSrc } from "@tauri-apps/api/core";
import { readFile } from "@tauri-apps/plugin-fs";
import {
  buildAssetLibraryRoot,
  joinPath,
} from "@/domain/asset/AssetLibraryPaths";

function resolveAssetImageAbsolutePath(
  workspacePath: string,
  imageFile: string,
): string {
  return joinPath(buildAssetLibraryRoot(workspacePath), imageFile);
}
export async function loadAssetImageBlobUrl(
  workspacePath: string,
  imageFile: string,
): Promise<string | null> {
  const absolutePath = resolveAssetImageAbsolutePath(workspacePath, imageFile);

  try {
    const bytes = await readFile(absolutePath);
    if (bytes.length === 0) return null;
    return URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
  } catch {
    try {
      return convertFileSrc(absolutePath);
    } catch {
      return null;
    }
  }
}

export function revokeAssetImageBlobUrl(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export async function loadAssetImageAsImageData(
  workspacePath: string,
  imageFile: string,
): Promise<ImageData | null> {
  const absolutePath = resolveAssetImageAbsolutePath(workspacePath, imageFile);

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
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch {
    return null;
  }
}
