import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import type { AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import type { AssetRecord } from "@/domain/asset/AssetRecord";
import { imageDataToPixelGrid } from "./ClipboardUseCases";
import { importAssetFromPixelGrid } from "./ImportAssetFromPixelGrid";

export async function importAssetFromImageData(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  folderId: string,
  imageData: ImageData,
  title?: string,
): Promise<{ library: AssetLibraryIndex; asset: AssetRecord }> {
  const grid = imageDataToPixelGrid(imageData);
  return importAssetFromPixelGrid(repository, workspacePath, library, folderId, grid, title);
}
