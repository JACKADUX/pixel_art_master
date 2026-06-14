import type { IPatternBrushRepository } from "@/application/ports/IPatternBrushRepository";
import {
  renamePatternBrushInLibrary,
  type PatternBrushLibrary,
} from "@/domain/patternBrush/PatternBrushLibrary";

export async function renamePatternBrush(
  repository: IPatternBrushRepository,
  workspacePath: string,
  library: PatternBrushLibrary,
  brushId: string,
  title: string,
): Promise<PatternBrushLibrary> {
  const updated = renamePatternBrushInLibrary(library, brushId, title);
  await repository.saveIndex(workspacePath, updated);
  return updated;
}
