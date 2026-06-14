export const ASSET_DRAG_MIME = "application/x-pixelart-asset-id";
const ASSET_DRAG_TEXT_PREFIX = "pixelart-asset:";

function listDragTypes(types: DataTransfer["types"]): string[] {
  return Array.from(types as unknown as ArrayLike<string>);
}

export function writeDraggedAssetId(dataTransfer: DataTransfer, assetId: string): void {
  dataTransfer.setData(ASSET_DRAG_MIME, assetId);
  dataTransfer.setData("text/plain", `${ASSET_DRAG_TEXT_PREFIX}${assetId}`);
  dataTransfer.effectAllowed = "move";
}

export function readDraggedAssetId(dataTransfer: DataTransfer): string | null {
  const custom = dataTransfer.getData(ASSET_DRAG_MIME);
  if (custom) return custom;

  const plain = dataTransfer.getData("text/plain");
  if (plain.startsWith(ASSET_DRAG_TEXT_PREFIX)) {
    return plain.slice(ASSET_DRAG_TEXT_PREFIX.length);
  }

  return null;
}

export function isAssetDrag(dataTransfer: DataTransfer): boolean {
  const types = listDragTypes(dataTransfer.types);
  if (types.includes(ASSET_DRAG_MIME)) return true;
  if (types.includes("Files")) return false;
  return types.includes("text/plain") || types.includes("Text");
}
