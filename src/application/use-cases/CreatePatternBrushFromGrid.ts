import type { IPatternBrushRepository } from "@/application/ports/IPatternBrushRepository";
import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import {
  addPatternBrush,
  type PatternBrushLibrary,
} from "@/domain/patternBrush/PatternBrushLibrary";
import {
  buildPatternBrushImagePath,
  buildPatternBrushImageRelativePath,
} from "@/domain/patternBrush/PatternBrushPaths";
import { cropPixelGridToOpaqueBounds } from "@/domain/patternBrush/PatternBrushCrop";
import type { PatternBrushRecord } from "@/domain/patternBrush/PatternBrushRecord";
import { pixelGridToPngBlob } from "./ClipboardUseCases";

async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}

export async function createPatternBrushFromGrid(
  repository: IPatternBrushRepository,
  workspacePath: string,
  library: PatternBrushLibrary,
  grid: PixelGrid,
  title?: string,
): Promise<{ library: PatternBrushLibrary; brush: PatternBrushRecord }> {
  await repository.ensureLibraryStructure(workspacePath);

  const cropped = cropPixelGridToOpaqueBounds(grid);
  if (!cropped) {
    throw new Error("Pattern brush has no opaque pixels");
  }

  const { library: withBrush, brush } = addPatternBrush(
    library,
    buildPatternBrushImageRelativePath("pending"),
    cropped.width,
    cropped.height,
    title,
  );

  const imageRelative = buildPatternBrushImageRelativePath(brush.id);
  const imagePath = buildPatternBrushImagePath(workspacePath, brush.id);
  const pngBlob = await pixelGridToPngBlob(cropped);
  const pngBytes = await blobToUint8Array(pngBlob);
  await repository.writeImage(imagePath, pngBytes);

  const finalBrush: PatternBrushRecord = { ...brush, imageFile: imageRelative };
  const finalLibrary: PatternBrushLibrary = {
    ...withBrush,
    brushes: withBrush.brushes.map((b) => (b.id === brush.id ? finalBrush : b)),
  };

  await repository.saveIndex(workspacePath, finalLibrary);
  return { library: finalLibrary, brush: finalBrush };
}
