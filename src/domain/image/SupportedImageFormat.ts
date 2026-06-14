export const SUPPORTED_IMAGE_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "bmp",
  "gif",
  "webp",
] as const;

export type SupportedImageExtension = (typeof SUPPORTED_IMAGE_EXTENSIONS)[number];

export function isSupportedImageFileName(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext !== undefined && (SUPPORTED_IMAGE_EXTENSIONS as readonly string[]).includes(ext);
}

export function isSupportedImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return isSupportedImageFileName(file.name);
}

export function isSupportedImagePath(path: string): boolean {
  const name = path.split(/[/\\]/).pop() ?? path;
  return isSupportedImageFileName(name);
}

export function pickSupportedImagePath(paths: string[]): string | null {
  return paths.find(isSupportedImagePath) ?? null;
}
