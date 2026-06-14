import { isSupportedImageFile, pickSupportedImagePath } from "@/domain/image/SupportedImageFormat";
import { isAssetDrag } from "../asset/assetDrag";

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
