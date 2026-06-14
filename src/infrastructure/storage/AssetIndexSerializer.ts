import {
  ASSET_LIBRARY_VERSION,
  createEmptyAssetLibrary,
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
import type { AssetCategory } from "@/domain/asset/AssetCategory";
import type { AssetFolder } from "@/domain/asset/AssetFolder";
import type { AssetRecord } from "@/domain/asset/AssetRecord";
import type { AssetTag } from "@/domain/asset/AssetTag";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseFolder(raw: unknown): AssetFolder | null {
  if (!isRecord(raw)) return null;
  const { id, name, parentId, createdAt } = raw;
  if (typeof id !== "string" || typeof name !== "string" || typeof createdAt !== "string") {
    return null;
  }
  return {
    id,
    name,
    parentId: parentId === null || typeof parentId === "string" ? parentId : null,
    createdAt,
  };
}

function parseCategory(raw: unknown): AssetCategory | null {
  if (!isRecord(raw)) return null;
  const { id, name, createdAt } = raw;
  if (typeof id !== "string" || typeof name !== "string" || typeof createdAt !== "string") {
    return null;
  }
  return { id, name, createdAt };
}

function parseTag(raw: unknown): AssetTag | null {
  if (!isRecord(raw)) return null;
  const { id, name, createdAt } = raw;
  if (typeof id !== "string" || typeof name !== "string" || typeof createdAt !== "string") {
    return null;
  }
  return { id, name, createdAt };
}

function parseAsset(raw: unknown): AssetRecord | null {
  if (!isRecord(raw)) return null;
  const {
    id,
    folderId,
    title,
    notes,
    categoryId,
    tagIds,
    imageFile,
    width,
    height,
    colorCount,
    createdAt,
    updatedAt,
  } = raw;
  if (
    typeof id !== "string" ||
    typeof folderId !== "string" ||
    typeof title !== "string" ||
    typeof notes !== "string" ||
    typeof imageFile !== "string" ||
    typeof width !== "number" ||
    typeof height !== "number" ||
    typeof colorCount !== "number" ||
    typeof createdAt !== "string" ||
    typeof updatedAt !== "string"
  ) {
    return null;
  }
  const tags = Array.isArray(tagIds)
    ? tagIds.filter((t): t is string => typeof t === "string")
    : [];
  return {
    id,
    folderId,
    title,
    notes,
    categoryId:
      categoryId === null || typeof categoryId === "string" ? categoryId : null,
    tagIds: tags,
    imageFile,
    width,
    height,
    colorCount,
    createdAt,
    updatedAt,
  };
}

export function deserializeAssetLibrary(json: string): AssetLibraryIndex {
  const parsed = JSON.parse(json) as unknown;
  if (!isRecord(parsed)) return createEmptyAssetLibrary();

  const folders = Array.isArray(parsed.folders)
    ? parsed.folders.map(parseFolder).filter((f): f is AssetFolder => f !== null)
    : [];
  const categories = Array.isArray(parsed.categories)
    ? parsed.categories.map(parseCategory).filter((c): c is AssetCategory => c !== null)
    : [];
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.map(parseTag).filter((t): t is AssetTag => t !== null)
    : [];
  const assets = Array.isArray(parsed.assets)
    ? parsed.assets.map(parseAsset).filter((a): a is AssetRecord => a !== null)
    : [];

  return {
    version: ASSET_LIBRARY_VERSION,
    folders,
    categories,
    tags,
    assets,
  };
}

export function serializeAssetLibrary(index: AssetLibraryIndex): string {
  return JSON.stringify(
    {
      version: ASSET_LIBRARY_VERSION,
      folders: index.folders,
      categories: index.categories,
      tags: index.tags,
      assets: index.assets,
    },
    null,
    2,
  );
}
