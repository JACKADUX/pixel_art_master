import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import {
  removeAssetFromLibrary,
  updateAssetInLibrary,
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
import { isImageAsset, isMarkdownAsset } from "@/domain/asset/AssetRecord";
import {
  buildAssetImagePath,
  buildAssetNotePath,
} from "@/domain/asset/AssetLibraryPaths";
import { saveAssetLibrary } from "./LoadAssetLibrary";

export async function updateAssetRecord(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  assetId: string,
  updates: {
    title?: string;
    notes?: string;
    content?: string;
    categoryId?: string | null;
    tagIds?: string[];
    folderId?: string;
  },
): Promise<AssetLibraryIndex> {
  const asset = library.assets.find((a) => a.id === assetId);
  if (asset && updates.content !== undefined && isMarkdownAsset(asset)) {
    const notePath = repository.resolveNotePath(workspacePath, asset.contentFile);
    await repository.writeNoteContent(notePath, updates.content);
  }

  const updated = updateAssetInLibrary(library, assetId, updates);
  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}

export async function readMarkdownAssetContent(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  contentFile: string,
): Promise<string> {
  const notePath = repository.resolveNotePath(workspacePath, contentFile);
  try {
    return await repository.readNoteContent(notePath);
  } catch {
    return "";
  }
}

export async function deleteAssetRecord(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  assetId: string,
): Promise<AssetLibraryIndex> {
  const { library: updated, asset } = removeAssetFromLibrary(library, assetId);
  if (asset) {
    if (isImageAsset(asset)) {
      const imagePath = buildAssetImagePath(workspacePath, asset.id);
      await repository.deleteImage(imagePath);
    } else if (isMarkdownAsset(asset)) {
      const notePath = buildAssetNotePath(workspacePath, asset.id);
      await repository.deleteNoteContent(notePath);
    }
  }
  await saveAssetLibrary(repository, workspacePath, updated);
  return updated;
}
