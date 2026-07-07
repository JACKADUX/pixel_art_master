import { isSupportedImageFile, pickSupportedImagePath } from "@/domain/image/SupportedImageFormat";
import { isAssetDrag } from "../asset/assetDrag";

export interface DropPointerPosition {
  clientX: number;
  clientY: number;
  ctrlKey?: boolean;
}

/** 将 Tauri 拖放事件的物理坐标转换为与 DOM 一致的 client 坐标 */
export function tauriDragPositionToClient(position: { x: number; y: number }): DropPointerPosition {
  const dpr = window.devicePixelRatio || 1;
  return {
    clientX: position.x / dpr,
    clientY: position.y / dpr,
  };
}

function listDragTypes(types: DataTransfer["types"]): string[] {
  return Array.from(types as unknown as ArrayLike<string>);
}

export function hasSupportedImagePath(paths: string[]): boolean {
  return pickSupportedImagePath(paths) !== null;
}

export function isImageFileDrag(dataTransfer: DataTransfer): boolean {
  if (isAssetDrag(dataTransfer)) return false;

  const types = listDragTypes(dataTransfer.types);
  if (types.includes("Files")) return true;

  return Array.from(dataTransfer.items).some(
    (item) => item.kind === "file" && item.type.startsWith("image/"),
  );
}

export function pickDroppedImageFile(dataTransfer: DataTransfer): File | null {
  if (isAssetDrag(dataTransfer)) return null;

  const files = Array.from(dataTransfer.files);
  return files.find(isSupportedImageFile) ?? null;
}
