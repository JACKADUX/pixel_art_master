import type { IPatternBrushRepository } from "@/application/ports/IPatternBrushRepository";
import {
  createEmptyPatternBrushLibrary,
  type PatternBrushLibrary,
} from "@/domain/patternBrush/PatternBrushLibrary";
import {
  buildPatternBrushImagesDir,
  buildPatternBrushIndexPath,
  buildPatternBrushLibraryRoot,
  joinPath,
} from "@/domain/patternBrush/PatternBrushPaths";
import {
  mkdir,
  readFile,
  readTextFile,
  remove,
  writeFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import {
  deserializePatternBrushLibrary,
  serializePatternBrushLibrary,
} from "./PatternBrushIndexSerializer";

export class FilePatternBrushRepository implements IPatternBrushRepository {
  async ensureLibraryStructure(workspacePath: string): Promise<void> {
    const root = buildPatternBrushLibraryRoot(workspacePath);
    const imagesDir = buildPatternBrushImagesDir(workspacePath);
    await mkdir(root, { recursive: true });
    await mkdir(imagesDir, { recursive: true });
  }

  async loadIndex(workspacePath: string): Promise<PatternBrushLibrary | null> {
    const indexPath = buildPatternBrushIndexPath(workspacePath);
    try {
      const json = await readTextFile(indexPath);
      return deserializePatternBrushLibrary(json);
    } catch {
      return null;
    }
  }

  async saveIndex(workspacePath: string, index: PatternBrushLibrary): Promise<void> {
    await this.ensureLibraryStructure(workspacePath);
    const indexPath = buildPatternBrushIndexPath(workspacePath);
    await writeTextFile(indexPath, serializePatternBrushLibrary(index));
  }

  resolveImagePath(workspacePath: string, relativePath: string): string {
    return joinPath(buildPatternBrushLibraryRoot(workspacePath), relativePath);
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
}

export const patternBrushRepository = new FilePatternBrushRepository();

export async function loadOrCreatePatternBrushLibrary(
  repository: IPatternBrushRepository,
  workspacePath: string,
): Promise<PatternBrushLibrary> {
  await repository.ensureLibraryStructure(workspacePath);
  const loaded = await repository.loadIndex(workspacePath);
  return loaded ?? createEmptyPatternBrushLibrary();
}
