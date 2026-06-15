import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import {
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
import {
  buildAssetNotePath,
  buildAssetNoteRelativePath,
} from "@/domain/asset/AssetLibraryPaths";
import {
  createMarkdownAssetRecord,
  type MarkdownAssetRecord,
} from "@/domain/asset/AssetRecord";
import { saveAssetLibrary } from "./LoadAssetLibrary";

export async function createMarkdownAsset(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  folderId: string,
  title?: string,
): Promise<{ library: AssetLibraryIndex; asset: MarkdownAssetRecord }> {
  await repository.ensureLibraryStructure(workspacePath);

  const draft = createMarkdownAssetRecord(folderId, "", title);
  const noteRelative = buildAssetNoteRelativePath(draft.id);
  const asset: MarkdownAssetRecord = { ...draft, contentFile: noteRelative };

  const notePath = buildAssetNotePath(workspacePath, asset.id);
  await repository.writeNoteContent(notePath, "");

  const finalLibrary: AssetLibraryIndex = {
    ...library,
    assets: [...library.assets, asset],
  };

  await saveAssetLibrary(repository, workspacePath, finalLibrary);
  return { library: finalLibrary, asset };
}
