import { open } from "@tauri-apps/plugin-dialog";
import type { IImageProcessor } from "@/application/ports/IImageProcessor";
import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import type { AssetLibraryIndex } from "@/domain/asset/AssetLibrary";
import type { AssetRecord } from "@/domain/asset/AssetRecord";
import { imageDataToPixelGrid } from "./ClipboardUseCases";
import { importAssetFromPixelGrid } from "./ImportAssetFromPixelGrid";

export async function importAssetFromFileDialog(
  repository: IAssetLibraryRepository,
  imageProcessor: IImageProcessor,
  workspacePath: string,
  library: AssetLibraryIndex,
  folderId: string,
): Promise<{ library: AssetLibraryIndex; asset: AssetRecord } | null> {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "图片",
        extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp"],
      },
    ],
  });
  if (!selected || typeof selected !== "string") return null;

  const imageData = await imageProcessor.loadImageFromPath(selected);
  const grid = imageDataToPixelGrid(imageData);
  return importAssetFromPixelGrid(repository, workspacePath, library, folderId, grid);
}
