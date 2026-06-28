import type { IImageExportPreferencesRepository } from "@/application/ports/IImageExportPreferencesRepository";
import type { Project } from "@/domain/project/Project";
import type { SelectionState } from "@/domain/selection/SelectionState";
import {
  buildExportFilePath,
  resolveExportPixelGrid,
  resolveTargetLongestEdge,
  scalePixelGridToLongestEdge,
} from "@/domain/export/ExportImageOperations";
import type {
  ImageExportFormat,
  ImageExportPreferences,
  ImageExportScalePreset,
  ImageExportScope,
} from "@/domain/export/ImageExportPreferences";
import { pixelGridToImageBytes } from "@/infrastructure/image/PixelGridImageCodec";
import { writeFile } from "@tauri-apps/plugin-fs";

export interface ExportImageInput {
  project: Project;
  selection: SelectionState | null;
  directory: string;
  fileName: string;
  format: ImageExportFormat;
  scope: ImageExportScope;
  scalePreset: ImageExportScalePreset;
  customLongestEdge: number;
  preferencesRepository: IImageExportPreferencesRepository;
}

export async function exportImage(input: ExportImageInput): Promise<{ filePath: string } | null> {
  const grid = resolveExportPixelGrid(input.project, input.scope, input.selection);
  if (!grid) return null;

  const targetLongestEdge = resolveTargetLongestEdge(
    grid,
    input.scalePreset,
    input.customLongestEdge,
  );
  const scaled = scalePixelGridToLongestEdge(grid, targetLongestEdge);
  const bytes = await pixelGridToImageBytes(scaled, input.format);
  const filePath = buildExportFilePath(input.directory, input.fileName, input.format);

  await writeFile(filePath, bytes);

  const preferences: ImageExportPreferences = {
    lastExportDirectory: input.directory,
    format: input.format,
    scope: input.scope,
    scalePreset: input.scalePreset,
    customLongestEdge: input.customLongestEdge,
  };
  input.preferencesRepository.save(preferences);

  return { filePath };
}
