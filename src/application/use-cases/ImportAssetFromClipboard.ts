import type { IClipboardService } from "@/application/ports/IClipboardService";
import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import type { AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import type { AssetRecord } from "@/domain/asset/AssetRecord";
import { imageDataToPixelGrid } from "./ClipboardUseCases";
import { importAssetFromPixelGrid } from "./ImportAssetFromPixelGrid";

export async function importAssetFromClipboard(
  clipboard: IClipboardService,
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  folderId: string,
): Promise<{ library: AssetLibraryIndex; asset: AssetRecord } | null> {
  const imageData = await clipboard.readImage();
  if (!imageData) return null;
  const grid = imageDataToPixelGrid(imageData);
  return importAssetFromPixelGrid(repository, workspacePath, library, folderId, grid);
}
