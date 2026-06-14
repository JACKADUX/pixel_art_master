import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import {
  addFolder,
  addCategoryToLibrary,
  addTagToLibrary,
  isFolderEmpty,
  removeCategoryFromLibrary,
  removeFolderFromLibrary,
  removeTagFromLibrary,
  renameCategoryInLibrary,
  renameFolderInLibrary,
  renameTagInLibrary,
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
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

export async function deleteAssetFolder(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  folderId: string,
): Promise<AssetLibraryIndex | null> {
  if (!isFolderEmpty(library, folderId)) return null;
  const updated = removeFolderFromLibrary(library, folderId);
  if (!updated) return null;
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
