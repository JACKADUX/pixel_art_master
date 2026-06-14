import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import type { AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import { extractRectFromGrid } from "@/domain/asset/AssetCaptureRect";
import type { AssetRecord } from "@/domain/asset/AssetRecord";
import type { SelectionRect } from "@/domain/selection/SelectionRect";
import { importAssetFromPixelGrid } from "./ImportAssetFromPixelGrid";

export async function importAssetFromCanvasRegion(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  folderId: string,
  compositeGrid: PixelGrid,
  rect: SelectionRect,
): Promise<{ library: AssetLibraryIndex; asset: AssetRecord } | null> {
  const region = extractRectFromGrid(compositeGrid, rect);
  if (!region) return null;
  return importAssetFromPixelGrid(
    repository,
    workspacePath,
    library,
    folderId,
    region,
  );
}
