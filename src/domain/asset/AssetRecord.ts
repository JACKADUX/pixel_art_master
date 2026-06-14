import type { AssetMetadata } from "./AssetMetadata";
import { formatAssetDefaultTitle } from "./AssetMetadata";

export interface AssetRecord {
  id: string;
  folderId: string;
  title: string;
  notes: string;
  categoryId: string | null;
  tagIds: string[];
  imageFile: string;
  width: number;
  height: number;
  colorCount: number;
  createdAt: string;
  updatedAt: string;
}

export function createAssetRecord(
  folderId: string,
  imageFile: string,
  metadata: AssetMetadata,
  title?: string,
): AssetRecord {
  const now = new Date().toISOString();
  return {
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

export function touchAssetRecord(record: AssetRecord): AssetRecord {
  return { ...record, updatedAt: new Date().toISOString() };
}

export function updateAssetTitle(record: AssetRecord, title: string): AssetRecord {
  return touchAssetRecord({ ...record, title: title.trim() || record.title });
}

export function updateAssetNotes(record: AssetRecord, notes: string): AssetRecord {
  return touchAssetRecord({ ...record, notes });
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
