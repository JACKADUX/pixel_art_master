import type { IPatternBrushRepository } from "@/application/ports/IPatternBrushRepository";
import {
  removePatternBrush,
  type PatternBrushLibrary,
} from "@/domain/patternBrush/PatternBrushLibrary";
import { buildPatternBrushImagePath } from "@/domain/patternBrush/PatternBrushPaths";

export async function deletePatternBrush(
  repository: IPatternBrushRepository,
  workspacePath: string,
  library: PatternBrushLibrary,
  brushId: string,
): Promise<PatternBrushLibrary> {
  const brush = library.brushes.find((b) => b.id === brushId);
  if (brush) {
    const imagePath = buildPatternBrushImagePath(workspacePath, brush.id);
    await repository.deleteImage(imagePath);
  }
  const updated = removePatternBrush(library, brushId);
  await repository.saveIndex(workspacePath, updated);
  return updated;
}
