export interface AssetTag {
  id: string;
  name: string;
  createdAt: string;
}

export function createAssetTag(name: string): AssetTag {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "未命名标签",
    createdAt: new Date().toISOString(),
  };
}

export function renameAssetTag(tag: AssetTag, name: string): AssetTag {
  return { ...tag, name: name.trim() || tag.name };
}
