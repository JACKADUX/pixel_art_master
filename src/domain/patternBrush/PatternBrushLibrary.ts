import type { PatternBrushRecord } from "./PatternBrushRecord";
import { createPatternBrushRecord, updatePatternBrushTitle } from "./PatternBrushRecord";

export const PATTERN_BRUSH_LIBRARY_VERSION = 1;

export interface PatternBrushLibrary {
  version: number;
  brushes: PatternBrushRecord[];
}

export function createEmptyPatternBrushLibrary(): PatternBrushLibrary {
  return {
    version: PATTERN_BRUSH_LIBRARY_VERSION,
    brushes: [],
  };
}

export function listPatternBrushes(library: PatternBrushLibrary): PatternBrushRecord[] {
  return [...library.brushes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getPatternBrush(
  library: PatternBrushLibrary,
  id: string,
): PatternBrushRecord | null {
  return library.brushes.find((b) => b.id === id) ?? null;
}

export function addPatternBrush(
  library: PatternBrushLibrary,
  imageFile: string,
  width: number,
  height: number,
  title?: string,
): { library: PatternBrushLibrary; brush: PatternBrushRecord } {
  const brush = createPatternBrushRecord(imageFile, width, height, title);
  return {
    library: { ...library, brushes: [...library.brushes, brush] },
    brush,
  };
}

export function removePatternBrush(
  library: PatternBrushLibrary,
  id: string,
): PatternBrushLibrary {
  return {
    ...library,
    brushes: library.brushes.filter((b) => b.id !== id),
  };
}

export function renamePatternBrushInLibrary(
  library: PatternBrushLibrary,
  id: string,
  title: string,
): PatternBrushLibrary {
  return {
    ...library,
    brushes: library.brushes.map((brush) =>
      brush.id === id ? updatePatternBrushTitle(brush, title) : brush,
    ),
  };
}
