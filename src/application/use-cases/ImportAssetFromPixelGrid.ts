import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import {
  addAssetToLibrary,
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
import {
  buildAssetImagePath,
  buildAssetImageRelativePath,
} from "@/domain/asset/AssetLibraryPaths";
import { metadataFromPixelGrid } from "@/domain/asset/AssetMetadata";
import type { AssetRecord, ImageAssetRecord } from "@/domain/asset/AssetRecord";
import { pixelGridToPngBlob } from "./ClipboardUseCases";

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function importAssetFromPixelGrid(
  repository: IAssetLibraryRepository,
  workspacePath: string,
  library: AssetLibraryIndex,
  folderId: string,
  grid: PixelGrid,
  title?: string,
): Promise<{ library: AssetLibraryIndex; asset: ImageAssetRecord }> {
  await repository.ensureLibraryStructure(workspacePath);

  const metadata = metadataFromPixelGrid(grid);
  const { library: withAsset, asset } = addAssetToLibrary(
    library,
    folderId,
    buildAssetImageRelativePath("pending"),
    metadata,
    title,
  );

  const imageRelative = buildAssetImageRelativePath(asset.id);
  const imagePath = buildAssetImagePath(workspacePath, asset.id);
  const pngBlob = await pixelGridToPngBlob(grid);
  const pngBytes = await blobToUint8Array(pngBlob);
  await repository.writeImage(imagePath, pngBytes);

  const finalAsset: ImageAssetRecord = { ...asset, imageFile: imageRelative };
  const finalLibrary: AssetLibraryIndex = {
    ...withAsset,
    assets: withAsset.assets.map((a) =>
      a.id === asset.id ? finalAsset : a,
    ),
  };

  await repository.saveIndex(workspacePath, finalLibrary);
  return { library: finalLibrary, asset: finalAsset };
}
