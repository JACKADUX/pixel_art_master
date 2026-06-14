import {
  PATTERN_BRUSH_LIBRARY_VERSION,
  createEmptyPatternBrushLibrary,
  type PatternBrushLibrary,
} from "@/domain/patternBrush/PatternBrushLibrary";
import type { PatternBrushRecord } from "@/domain/patternBrush/PatternBrushRecord";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseBrush(raw: unknown): PatternBrushRecord | null {
  if (!isRecord(raw)) return null;
  const { id, title, imageFile, width, height, createdAt } = raw;
  if (
    typeof id !== "string" ||
    typeof title !== "string" ||
    typeof imageFile !== "string" ||
    typeof width !== "number" ||
    typeof height !== "number" ||
    typeof createdAt !== "string"
  ) {
    return null;
  }
  return { id, title, imageFile, width, height, createdAt };
}

export function deserializePatternBrushLibrary(json: string): PatternBrushLibrary {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) return createEmptyPatternBrushLibrary();
    if (parsed.version !== PATTERN_BRUSH_LIBRARY_VERSION) {
      return createEmptyPatternBrushLibrary();
    }
    const brushesRaw = parsed.brushes;
    if (!Array.isArray(brushesRaw)) return createEmptyPatternBrushLibrary();
    const brushes = brushesRaw
      .map(parseBrush)
      .filter((b): b is PatternBrushRecord => b !== null);
    return { version: PATTERN_BRUSH_LIBRARY_VERSION, brushes };
  } catch {
    return createEmptyPatternBrushLibrary();
  }
}

export function serializePatternBrushLibrary(library: PatternBrushLibrary): string {
  return JSON.stringify(library, null, 2);
}
