import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import {
  addFolder,
  addCategoryToLibrary,
  addTagToLibrary,
  type AssetFolderDeletionDisposition,
  removeCategoryFromLibrary,
  removeFolderTreeFromLibrary,
  removeTagFromLibrary,
  renameCategoryInLibrary,
  renameFolderInLibrary,
  renameTagInLibrary,
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
import { buildAssetImagePath } from "@/domain/asset/AssetLibraryPaths";
import { saveAssetLibrary } from "./LoadAssetLibrary";

export async function createAssetFolder(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  name: string,
  parentId: string | null,
): Promise<AssetLibraryIndex> {
  const updated = addFolder(library, name, parentId);
  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}

export async function renameAssetFolderUseCase(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  folderId: string,
  name: string,
): Promise<AssetLibraryIndex> {
  const updated = renameFolderInLibrary(library, folderId, name);
  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}

export async function deleteAssetFolderTree(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  folderId: string,
  disposition: AssetFolderDeletionDisposition,
): Promise<AssetLibraryIndex> {
  const { library: updated, removedAssets } = removeFolderTreeFromLibrary(
    library,
    folderId,
    disposition,
  );

  for (const asset of removedAssets) {
    const imagePath = buildAssetImagePath(workspacePath, asset.id);
    await repository.deleteImage(imagePath);
  }

  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}

export async function createAssetCategory(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  name: string,
): Promise<AssetLibraryIndex> {
  const updated = addCategoryToLibrary(library, name);
  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}

export async function renameAssetCategoryUseCase(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  categoryId: string,
  name: string,
): Promise<AssetLibraryIndex> {
  const updated = renameCategoryInLibrary(library, categoryId, name);
  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}

export async function deleteAssetCategory(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  categoryId: string,
): Promise<AssetLibraryIndex> {
  const updated = removeCategoryFromLibrary(library, categoryId);
  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}

export async function createAssetTag(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  name: string,
): Promise<AssetLibraryIndex> {
  const updated = addTagToLibrary(library, name);
  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}

export async function renameAssetTagUseCase(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  tagId: string,
  name: string,
): Promise<AssetLibraryIndex> {
  const updated = renameTagInLibrary(library, tagId, name);
  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}

export async function deleteAssetTag(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  tagId: string,
): Promise<AssetLibraryIndex> {
  const updated = removeTagFromLibrary(library, tagId);
  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}
