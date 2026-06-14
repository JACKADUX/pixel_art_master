export const PATTERN_BRUSH_LIBRARY_DIR = ".pixelart-pattern-brushes";
export const PATTERN_BRUSH_IMAGES_SUBDIR = "images";
export const PATTERN_BRUSH_INDEX_FILE = "index.json";

export function joinPath(base: string, segment: string): string {
  const separator = base.includes("\\") ? "\\" : "/";
  const normalized = base.replace(/[/\\]+$/, "");
  return `${normalized}${separator}${segment}`;
}

export function buildPatternBrushLibraryRoot(workspacePath: string): string {
  return joinPath(workspacePath, PATTERN_BRUSH_LIBRARY_DIR);
}

export function buildPatternBrushIndexPath(workspacePath: string): string {
  return joinPath(buildPatternBrushLibraryRoot(workspacePath), PATTERN_BRUSH_INDEX_FILE);
}

export function buildPatternBrushImagesDir(workspacePath: string): string {
  return joinPath(buildPatternBrushLibraryRoot(workspacePath), PATTERN_BRUSH_IMAGES_SUBDIR);
}

export function buildPatternBrushImagePath(workspacePath: string, brushId: string): string {
  return joinPath(buildPatternBrushImagesDir(workspacePath), `${brushId}.png`);
}

export function buildPatternBrushImageRelativePath(brushId: string): string {
  return `${PATTERN_BRUSH_IMAGES_SUBDIR}/${brushId}.png`;
}
