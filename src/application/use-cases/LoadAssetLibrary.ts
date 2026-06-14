import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import type { AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import { loadOrCreateAssetLibrary } from "@/infrastructure/storage/FileAssetLibraryRepository";

export async function loadAssetLibrary(
  repository: IAssetLibraryRepository,
  workspacePath: string,
): Promise<AssetLibraryIndex> {
  return loadOrCreateAssetLibrary(repository, workspacePath);
}

export async function saveAssetLibrary(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
): Promise<void> {
  await repository.saveIndex(workspacePath, library);
}
