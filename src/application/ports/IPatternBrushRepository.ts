import type { PatternBrushLibrary } from "@/domain/patternBrush/PatternBrushLibrary";

export interface IPatternBrushRepository {
  ensureLibraryStructure(workspacePath: string): Promise<void>;
  loadIndex(workspacePath: string): Promise<PatternBrushLibrary | null>;
  saveIndex(workspacePath: string, index: PatternBrushLibrary): Promise<void>;
  writeImage(imagePath: string, pngBytes: Uint8Array): Promise<void>;
  readImage(imagePath: string): Promise<Uint8Array>;
  deleteImage(imagePath: string): Promise<void>;
  resolveImagePath(workspacePath: string, relativePath: string): string;
}
