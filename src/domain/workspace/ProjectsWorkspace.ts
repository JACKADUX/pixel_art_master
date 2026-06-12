const PROJECT_EXTENSION = ".pixelart.json";

export function validateWorkspacePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    throw new Error("项目目录路径不能为空");
  }
  return trimmed;
}

export function sanitizeProjectFileName(name: string): string {
  const sanitized = name.replace(/[<>:"/\\|?*]/g, "_").trim();
  return sanitized || "未命名项目";
}

export function buildProjectFileName(name: string, suffix = 0): string {
  const base = sanitizeProjectFileName(name);
  if (suffix === 0) {
    return `${base}${PROJECT_EXTENSION}`;
  }
  return `${base} (${suffix})${PROJECT_EXTENSION}`;
}

export function buildProjectFilePath(workspacePath: string, name: string, suffix = 0): string {
  const separator = workspacePath.includes("\\") ? "\\" : "/";
  const normalized = workspacePath.replace(/[/\\]+$/, "");
  return `${normalized}${separator}${buildProjectFileName(name, suffix)}`;
}

export function isProjectFileName(fileName: string): boolean {
  return fileName.endsWith(PROJECT_EXTENSION);
}
