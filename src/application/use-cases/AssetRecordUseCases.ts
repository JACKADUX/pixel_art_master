import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import {
  removeAssetFromLibrary,
  updateAssetInLibrary,
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
import { buildAssetImagePath } from "@/domain/asset/AssetLibraryPaths";
import { saveAssetLibrary } from "./LoadAssetLibrary";

export async function updateAssetRecord(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  assetId: string,
  updates: {
    title?: string;
    notes?: string;
    categoryId?: string | null;
    tagIds?: string[];
    folderId?: string;
  },
): Promise<AssetLibraryIndex> {
  const updated = updateAssetInLibrary(library, assetId, updates);
  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}

export async function deleteAssetRecord(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  assetId: string,
): Promise<AssetLibraryIndex> {
  const { library: updated, asset } = removeAssetFromLibrary(library, assetId);
  if (asset) {
    const imagePath = buildAssetImagePath(workspacePath, asset.id);
    await repository.deleteImage(imagePath);
  }
  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}
