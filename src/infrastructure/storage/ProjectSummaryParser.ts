import type { ProjectSummary } from "@/domain/project/ProjectSummary";

interface SerializedSummary {
  id?: string;
  name?: string;
  updatedAt?: string;
  canvas?: {
    width?: number;
    height?: number;
  };
}

export function parseProjectSummary(json: string, filePath: string): ProjectSummary {
  const data: SerializedSummary = JSON.parse(json);
  const fileName = filePath.split(/[/\\]/).pop() ?? "未命名项目";
  const fallbackName = fileName.replace(/\.pixelart\.json$/, "") || "未命名项目";

  return {
    filePath,
    id: data.id ?? filePath,
    name: data.name ?? fallbackName,
    updatedAt: data.updatedAt ?? new Date(0).toISOString(),
    width: data.canvas?.width ?? 0,
    height: data.canvas?.height ?? 0,
  };
}
