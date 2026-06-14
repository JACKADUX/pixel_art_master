import type { AssetLibraryIndex } from "@/domain/asset/AssetLibrary";

export interface IAssetLibraryRepository {
  ensureLibraryStructure(workspacePath: string): Promise<void>;
  loadIndex(workspacePath: string): Promise<AssetLibraryIndex | null>;
  saveIndex(workspacePath: string, index: AssetLibraryIndex): Promise<void>;
  writeImage(imagePath: string, pngBytes: Uint8Array): Promise<void>;
  readImage(imagePath: string): Promise<Uint8Array>;
  deleteImage(imagePath: string): Promise<void>;
  imageExists(imagePath: string): Promise<boolean>;
  resolveImagePath(workspacePath: string, relativePath: string): string;
}
