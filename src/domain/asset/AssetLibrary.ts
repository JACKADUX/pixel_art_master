import type { AssetCategory } from "./AssetCategory";
import { createAssetCategory, renameAssetCategory } from "./AssetCategory";
import type { AssetFolder } from "./AssetFolder";
import {
  createAssetFolder,
  isFolderDescendant,
  renameAssetFolder,
  validateFolderParent,
} from "./AssetFolder";
import type { AssetRecord } from "./AssetRecord";
import {
  createAssetRecord,
  moveAssetToFolder,
  setAssetCategory,
  setAssetTags,
  updateAssetNotes,
  updateAssetTitle,
} from "./AssetRecord";
import type { AssetMetadata } from "./AssetMetadata";
import type { AssetTag } from "./AssetTag";
import { createAssetTag, renameAssetTag } from "./AssetTag";

export const ASSET_LIBRARY_VERSION = 1;
export const ROOT_FOLDER_ID = "__root__";

export interface AssetLibraryIndex {
  version: number;
  folders: AssetFolder[];
  categories: AssetCategory[];
  tags: AssetTag[];
  assets: AssetRecord[];
}

export function createEmptyAssetLibrary(): AssetLibraryIndex {
  return {
    version: ASSET_LIBRARY_VERSION,
    folders: [],
    categories: [],
    tags: [],
    assets: [],
  };
}

export function listChildFolders(library: AssetLibraryIndex, parentId: string | null): AssetFolder[] {
  return library.folders
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listAssetsInFolder(library: AssetLibraryIndex, folderId: string): AssetRecord[] {
  return library.assets
    .filter((a) => a.folderId === folderId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function folderHasChildren(library: AssetLibraryIndex, folderId: string): boolean {
  return library.folders.some((f) => f.parentId === folderId);
}

export function folderHasAssets(library: AssetLibraryIndex, folderId: string): boolean {
  return library.assets.some((a) => a.folderId === folderId);
}

export function isFolderEmpty(library: AssetLibraryIndex, folderId: string): boolean {
  return !folderHasChildren(library, folderId) && !folderHasAssets(library, folderId);
}

export function addFolder(
  library: AssetLibraryIndex,
  name: string,
  parentId: string | null = null,
): AssetLibraryIndex {
  const folder = createAssetFolder(name, parentId);
  return { ...library, folders: [...library.folders, folder] };
}

export function renameFolderInLibrary(
  library: AssetLibraryIndex,
  folderId: string,
  name: string,
): AssetLibraryIndex {
  return {
    ...library,
    folders: library.folders.map((f) =>
      f.id === folderId ? renameAssetFolder(f, name) : f,
    ),
  };
}

export function removeFolderFromLibrary(
  library: AssetLibraryIndex,
  folderId: string,
): AssetLibraryIndex | null {
  if (!isFolderEmpty(library, folderId)) return null;
  return {
    ...library,
    folders: library.folders.filter((f) => f.id !== folderId),
  };
}

export function addCategoryToLibrary(
  library: AssetLibraryIndex,
  name: string,
): AssetLibraryIndex {
  const category = createAssetCategory(name);
  return { ...library, categories: [...library.categories, category] };
}

export function renameCategoryInLibrary(
  library: AssetLibraryIndex,
  categoryId: string,
  name: string,
): AssetLibraryIndex {
  return {
    ...library,
    categories: library.categories.map((c) =>
      c.id === categoryId ? renameAssetCategory(c, name) : c,
    ),
  };
}

export function removeCategoryFromLibrary(
  library: AssetLibraryIndex,
  categoryId: string,
): AssetLibraryIndex {
  return {
    ...library,
    categories: library.categories.filter((c) => c.id !== categoryId),
    assets: library.assets.map((a) =>
      a.categoryId === categoryId ? setAssetCategory(a, null) : a,
    ),
  };
}

export function addTagToLibrary(library: AssetLibraryIndex, name: string): AssetLibraryIndex {
  const tag = createAssetTag(name);
  return { ...library, tags: [...library.tags, tag] };
}

export function renameTagInLibrary(
  library: AssetLibraryIndex,
  tagId: string,
  name: string,
): AssetLibraryIndex {
  return {
    ...library,
    tags: library.tags.map((t) => (t.id === tagId ? renameAssetTag(t, name) : t)),
  };
}

export function removeTagFromLibrary(
  library: AssetLibraryIndex,
  tagId: string,
): AssetLibraryIndex {
  return {
    ...library,
    tags: library.tags.filter((t) => t.id !== tagId),
    assets: library.assets.map((a) =>
      a.tagIds.includes(tagId)
        ? setAssetTags(a, a.tagIds.filter((id) => id !== tagId))
        : a,
    ),
  };
}

export function addAssetToLibrary(
  library: AssetLibraryIndex,
  folderId: string,
  imageFile: string,
  metadata: AssetMetadata,
  title?: string,
): { library: AssetLibraryIndex; asset: AssetRecord } {
  const asset = createAssetRecord(folderId, imageFile, metadata, title);
  return {
    library: { ...library, assets: [...library.assets, asset] },
    asset,
  };
}

export function removeAssetFromLibrary(
  library: AssetLibraryIndex,
  assetId: string,
): { library: AssetLibraryIndex; asset: AssetRecord | null } {
  const asset = library.assets.find((a) => a.id === assetId) ?? null;
  if (!asset) return { library, asset: null };
  return {
    library: { ...library, assets: library.assets.filter((a) => a.id !== assetId) },
    asset,
  };
}

export function updateAssetInLibrary(
  library: AssetLibraryIndex,
  assetId: string,
  updates: {
    title?: string;
    notes?: string;
    categoryId?: string | null;
    tagIds?: string[];
    folderId?: string;
  },
): AssetLibraryIndex {
  return {
    ...library,
    assets: library.assets.map((a) => {
      if (a.id !== assetId) return a;
      let updated = a;
      if (updates.title !== undefined) updated = updateAssetTitle(updated, updates.title);
      if (updates.notes !== undefined) updated = updateAssetNotes(updated, updates.notes);
      if (updates.categoryId !== undefined) updated = setAssetCategory(updated, updates.categoryId);
      if (updates.tagIds !== undefined) updated = setAssetTags(updated, updates.tagIds);
      if (updates.folderId !== undefined) updated = moveAssetToFolder(updated, updates.folderId);
      return updated;
    }),
  };
}

export function findAssetById(library: AssetLibraryIndex, assetId: string): AssetRecord | null {
  return library.assets.find((a) => a.id === assetId) ?? null;
}

export function findFolderById(library: AssetLibraryIndex, folderId: string): AssetFolder | null {
  return library.folders.find((f) => f.id === folderId) ?? null;
}

export function getFolderPathLabel(
  library: AssetLibraryIndex,
  folderId: string | null,
): string {
  if (folderId === null) return "根目录";
  const parts: string[] = [];
  let current = library.folders.find((f) => f.id === folderId);
  while (current) {
    parts.unshift(current.name);
    current = current.parentId
      ? library.folders.find((f) => f.id === current!.parentId)
      : undefined;
  }
  return parts.join("/") || "根目录";
}

export { validateFolderParent, isFolderDescendant };
