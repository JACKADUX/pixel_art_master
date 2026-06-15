export const ASSET_LIBRARY_DIR = ".pixelart-assets";
export const ASSET_IMAGES_SUBDIR = "images";
export const ASSET_NOTES_SUBDIR = "notes";
export const ASSET_INDEX_FILE = "index.json";

export function joinPath(base: string, segment: string): string {
  const separator = base.includes("\\") ? "\\" : "/";
  const normalized = base.replace(/[/\\]+$/, "");
  return `${normalized}${separator}${segment}`;
}

export function buildAssetLibraryRoot(workspacePath: string): string {
  return joinPath(workspacePath, ASSET_LIBRARY_DIR);
}

export function buildAssetIndexPath(workspacePath: string): string {
  return joinPath(buildAssetLibraryRoot(workspacePath), ASSET_INDEX_FILE);
}

export function buildAssetImagesDir(workspacePath: string): string {
  return joinPath(buildAssetLibraryRoot(workspacePath), ASSET_IMAGES_SUBDIR);
}

export function buildAssetNotesDir(workspacePath: string): string {
  return joinPath(buildAssetLibraryRoot(workspacePath), ASSET_NOTES_SUBDIR);
}

export function buildAssetImagePath(workspacePath: string, assetId: string): string {
  return joinPath(buildAssetImagesDir(workspacePath), `${assetId}.png`);
}

export function buildAssetImageRelativePath(assetId: string): string {
  return `${ASSET_IMAGES_SUBDIR}/${assetId}.png`;
}

export function buildAssetNotePath(workspacePath: string, assetId: string): string {
  return joinPath(buildAssetNotesDir(workspacePath), `${assetId}.md`);
}

export function buildAssetNoteRelativePath(assetId: string): string {
  return `${ASSET_NOTES_SUBDIR}/${assetId}.md`;
}
