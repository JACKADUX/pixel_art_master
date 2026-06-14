export interface AssetFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export function createAssetFolder(name: string, parentId: string | null = null): AssetFolder {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "新建文件夹",
    parentId,
    createdAt: new Date().toISOString(),
  };
}

export function renameAssetFolder(folder: AssetFolder, name: string): AssetFolder {
  return { ...folder, name: name.trim() || folder.name };
}

export function isFolderDescendant(
  folders: AssetFolder[],
  folderId: string,
  ancestorId: string,
): boolean {
  let current = folders.find((f) => f.id === folderId);
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = folders.find((f) => f.id === current!.parentId);
  }
  return false;
}

export function validateFolderParent(
  folders: AssetFolder[],
  folderId: string,
  newParentId: string | null,
): boolean {
  if (newParentId === null) return true;
  if (folderId === newParentId) return false;
  return !isFolderDescendant(folders, newParentId, folderId);
}
