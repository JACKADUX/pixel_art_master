import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import type { SelectionMask } from "@/domain/selection/SelectionMask";
import { extractMaskedRegionAsGrid } from "@/domain/selection/SelectionMaskOperations";
import type { IPatternBrushRepository } from "@/application/ports/IPatternBrushRepository";
import type { PatternBrushLibrary } from "@/domain/patternBrush/PatternBrushLibrary";
import type { PatternBrushRecord } from "@/domain/patternBrush/PatternBrushRecord";
import { cropPixelGridToOpaqueBounds } from "@/domain/patternBrush/PatternBrushCrop";
import { createPatternBrushFromGrid } from "./CreatePatternBrushFromGrid";

export async function createPatternBrushFromSelection(
  repository: IPatternBrushRepository,
  workspacePath: string,
  library: PatternBrushLibrary,
  grid: PixelGrid,
  mask: SelectionMask,
  title?: string,
): Promise<{ library: PatternBrushLibrary; brush: PatternBrushRecord; pixels: PixelGrid } | null> {
  const region = extractMaskedRegionAsGrid(grid, mask);
  if (!region) return null;
  const cropped = cropPixelGridToOpaqueBounds(region);
  if (!cropped) return null;
  const result = await createPatternBrushFromGrid(
    repository,
    workspacePath,
    library,
    cropped,
    title,
  );
  return { ...result, pixels: cropped };
}
