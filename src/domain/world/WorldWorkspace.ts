const WORLD_EXTENSION = ".world.json";

export function sanitizeWorldFileName(name: string): string {
  const sanitized = name.replace(/[<>:"/\\|?*]/g, "_").trim();
  return sanitized || "未命名世界";
}

export function buildWorldFileName(name: string, suffix = 0): string {
  const base = sanitizeWorldFileName(name);
  if (suffix === 0) {
    return `${base}${WORLD_EXTENSION}`;
  }
  return `${base} (${suffix})${WORLD_EXTENSION}`;
}

export function buildWorldFilePath(workspacePath: string, name: string, suffix = 0): string {
  const separator = workspacePath.includes("\\") ? "\\" : "/";
  const normalized = workspacePath.replace(/[/\\]+$/, "");
  return `${normalized}${separator}${buildWorldFileName(name, suffix)}`;
}

export function isWorldFileName(fileName: string): boolean {
  return fileName.endsWith(WORLD_EXTENSION);
}

export { WORLD_EXTENSION };
