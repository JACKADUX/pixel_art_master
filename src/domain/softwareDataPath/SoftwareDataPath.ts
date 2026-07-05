const PROJECT_EXTENSION = ".pixelart.json";

export function validateSoftwareDataPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    throw new Error("软件数据路径不能为空");
  }
  return trimmed;
}

export function validateProjectFilePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    throw new Error("项目文件路径不能为空");
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

export function buildProjectFilePath(softwareDataPath: string, name: string, suffix = 0): string {
  const separator = softwareDataPath.includes("\\") ? "\\" : "/";
  const normalized = softwareDataPath.replace(/[/\\]+$/, "");
  return `${normalized}${separator}${buildProjectFileName(name, suffix)}`;
}

export function isProjectFileName(fileName: string): boolean {
  return fileName.endsWith(PROJECT_EXTENSION);
}

export function isPathInSoftwareDataPath(filePath: string, softwareDataPath: string): boolean {
  const normalizedFile = filePath.replace(/\\/g, "/").toLowerCase();
  const normalizedRoot = softwareDataPath.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  return (
    normalizedFile === normalizedRoot ||
    normalizedFile.startsWith(`${normalizedRoot}/`)
  );
}
