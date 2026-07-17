import {
  buildExportFilePath,
  resolveExportPixelGrid,
  resolveTargetLongestEdge,
  scalePixelGridToLongestEdge,
} from "@/domain/export/ExportImageOperations";
import { getActiveCanvas, type Project } from "@/domain/project/Project";
import { pixelGridToImageBytes } from "@/infrastructure/image/PixelGridImageCodec";
import { writeFile } from "@tauri-apps/plugin-fs";

export interface QuickExportActiveCanvasInput {
  project: Project;
  directory: string;
}

export async function quickExportActiveCanvas(
  input: QuickExportActiveCanvasInput,
): Promise<{ filePath: string } | null> {
  const grid = resolveExportPixelGrid(input.project, "activeCanvas", null);
  if (!grid) return null;

  const canvas = getActiveCanvas(input.project);
  const filePath = buildExportFilePath(input.directory, canvas.name, "png");
  const targetLongestEdge = resolveTargetLongestEdge(grid, "original", 256);
  const scaled = scalePixelGridToLongestEdge(grid, targetLongestEdge);
  const bytes = await pixelGridToImageBytes(scaled, "png");
  await writeFile(filePath, bytes);
  return { filePath };
}
