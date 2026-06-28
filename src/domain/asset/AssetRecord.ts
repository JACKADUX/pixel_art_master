import type { AssetMetadata } from "./AssetMetadata";
import { formatAssetDefaultTitle } from "./AssetMetadata";

export type AssetKind = "image" | "markdown";

export interface AssetRecordBase {
  id: string;
  folderId: string;
  title: string;
  categoryId: string | null;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ImageAssetRecord extends AssetRecordBase {
  kind: "image";
  notes: string;
  imageFile: string;
  width: number;
  height: number;
  colorCount: number;
}

export interface MarkdownAssetRecord extends AssetRecordBase {
  kind: "markdown";
  contentFile: string;
}

export type AssetRecord = ImageAssetRecord | MarkdownAssetRecord;

export function isImageAsset(asset: AssetRecord): asset is ImageAssetRecord {
  return asset.kind === "image";
}

export function isMarkdownAsset(asset: AssetRecord): asset is MarkdownAssetRecord {
  return asset.kind === "markdown";
}

/** 返回资产在资产库根目录下的相对文件路径。 */
export function getAssetRelativeFilePath(asset: AssetRecord): string {
  return isImageAsset(asset) ? asset.imageFile : asset.contentFile;
}

/** @deprecated Use createImageAssetRecord */
export function createAssetRecord(
  folderId: string,
  imageFile: string,
  metadata: AssetMetadata,
  title?: string,
): ImageAssetRecord {
  return createImageAssetRecord(folderId, imageFile, metadata, title);
}

export function createImageAssetRecord(
  folderId: string,
  imageFile: string,
  metadata: AssetMetadata,
  title?: string,
): ImageAssetRecord {
  const now = new Date().toISOString();
  return {
    kind: "image",
    id: crypto.randomUUID(),
    folderId,
    title: title ?? formatAssetDefaultTitle(),
    notes: "",
    categoryId: null,
    tagIds: [],
    imageFile,
    width: metadata.width,
    height: metadata.height,
    colorCount: metadata.colorCount,
    createdAt: now,
    updatedAt: now,
  };
}

export function createMarkdownAssetRecord(
  folderId: string,
  contentFile: string,
  title?: string,
): MarkdownAssetRecord {
  const now = new Date().toISOString();
  return {
    kind: "markdown",
    id: crypto.randomUUID(),
    folderId,
    title: title ?? "未命名笔记",
    categoryId: null,
    tagIds: [],
    contentFile,
    createdAt: now,
    updatedAt: now,
  };
}

export function touchAssetRecord<T extends AssetRecord>(record: T): T {
  return { ...record, updatedAt: new Date().toISOString() };
}

export function updateAssetTitle(record: AssetRecord, title: string): AssetRecord {
  return touchAssetRecord({ ...record, title: title.trim() || record.title });
}

export function updateAssetNotes(record: ImageAssetRecord, notes: string): ImageAssetRecord {
  return touchAssetRecord({ ...record, notes });
}

export function updateMarkdownAssetContent(
  record: MarkdownAssetRecord,
): MarkdownAssetRecord {
  return touchAssetRecord(record);
}

export function setAssetCategory(record: AssetRecord, categoryId: string | null): AssetRecord {
  return touchAssetRecord({ ...record, categoryId });
}

export function setAssetTags(record: AssetRecord, tagIds: string[]): AssetRecord {
  return touchAssetRecord({ ...record, tagIds: [...tagIds] });
}

export function moveAssetToFolder(record: AssetRecord, folderId: string): AssetRecord {
  return touchAssetRecord({ ...record, folderId });
}
