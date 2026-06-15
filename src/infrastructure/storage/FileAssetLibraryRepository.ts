import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import { createEmptyAssetLibrary, type AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import {
  buildAssetImagesDir,
  buildAssetIndexPath,
  buildAssetLibraryRoot,
  buildAssetNotesDir,
  joinPath,
} from "@/domain/asset/AssetLibraryPaths";
import {
  exists,
  mkdir,
  readFile,
  readTextFile,
  remove,
  writeFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import {
  deserializeAssetLibrary,
  serializeAssetLibrary,
} from "./AssetIndexSerializer";

export class FileAssetLibraryRepository implements IAssetLibraryRepository {
  async ensureLibraryStructure(workspacePath: string): Promise<void> {
    const root = buildAssetLibraryRoot(workspacePath);
    const imagesDir = buildAssetImagesDir(workspacePath);
    const notesDir = buildAssetNotesDir(workspacePath);
    await mkdir(root, { recursive: true });
    await mkdir(imagesDir, { recursive: true });
    await mkdir(notesDir, { recursive: true });
  }

  async loadIndex(workspacePath: string): Promise<AssetLibraryIndex | null> {
    const indexPath = buildAssetIndexPath(workspacePath);
    try {
      const json = await readTextFile(indexPath);
      return deserializeAssetLibrary(json);
    } catch {
      return null;
    }
  }

  async saveIndex(workspacePath: string, index: AssetLibraryIndex): Promise<void> {
    await this.ensureLibraryStructure(workspacePath);
    const indexPath = buildAssetIndexPath(workspacePath);
    await writeTextFile(indexPath, serializeAssetLibrary(index));
  }

  resolveImagePath(workspacePath: string, relativePath: string): string {
    return joinPath(buildAssetLibraryRoot(workspacePath), relativePath);
  }

  resolveNotePath(workspacePath: string, relativePath: string): string {
    return joinPath(buildAssetLibraryRoot(workspacePath), relativePath);
  }

  async writeImage(imagePath: string, pngBytes: Uint8Array): Promise<void> {
    const dir = imagePath.replace(/[/\\][^/\\]+$/, "");
    await mkdir(dir, { recursive: true });
    await writeFile(imagePath, pngBytes);
  }

  async readImage(imagePath: string): Promise<Uint8Array> {
    return readFile(imagePath);
  }

  async deleteImage(imagePath: string): Promise<void> {
    try {
      await remove(imagePath);
    } catch {
      // ignore missing file
    }
  }

  async imageExists(imagePath: string): Promise<boolean> {
    return exists(imagePath);
  }

  async writeNoteContent(notePath: string, content: string): Promise<void> {
    const dir = notePath.replace(/[/\\][^/\\]+$/, "");
    await mkdir(dir, { recursive: true });
    await writeTextFile(notePath, content);
  }

  async readNoteContent(notePath: string): Promise<string> {
    return readTextFile(notePath);
  }

  async deleteNoteContent(notePath: string): Promise<void> {
    try {
      await remove(notePath);
    } catch {
      // ignore missing file
    }
  }
}

export const assetLibraryRepository = new FileAssetLibraryRepository();

export async function loadOrCreateAssetLibrary(
  repository: IAssetLibraryRepository,
  workspacePath: string,
): Promise<AssetLibraryIndex> {
  await repository.ensureLibraryStructure(workspacePath);
  const loaded = await repository.loadIndex(workspacePath);
  return loaded ?? createEmptyAssetLibrary();
}
