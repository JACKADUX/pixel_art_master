export interface AssetCategory {
  id: string;
  name: string;
  createdAt: string;
}

export function createAssetCategory(name: string): AssetCategory {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "未命名分类",
    createdAt: new Date().toISOString(),
  };
}

export function renameAssetCategory(category: AssetCategory, name: string): AssetCategory {
  return { ...category, name: name.trim() || category.name };
}
