import type { AppSettings } from "@/domain/appSettings/AppSettings";
import { clampCanvasDimension } from "@/domain/appSettings/AppSettings";
import type { CanvasSize } from "@/domain/canvas/CanvasSize";
import { createCanvasSize } from "@/domain/canvas/CanvasSize";
import {
  addCustomPreset,
  createCustomPreset,
  removeCustomPreset,
  type CustomCanvasSizePresetRecord,
} from "@/domain/canvas/CanvasSizePresetOperations";
import type { PalettePresetLibrary } from "@/domain/palette/PalettePresetLibrary";
import type { Project } from "@/domain/project/Project";
import { createEmptyProjectWithDefaultPalette } from "./PalettePresetUseCases";

function applyGridDefaults(project: Project, settings: AppSettings): Project {
  return {
    ...project,
    grid: {
      ...project.grid,
      primary: settings.defaultGridPrimary,
      secondary: Math.min(settings.defaultGridSecondary, settings.defaultGridPrimary),
    },
  };
}

export function getDefaultCanvasSize(settings: AppSettings): CanvasSize {
  return createCanvasSize(settings.defaultCanvasWidth, settings.defaultCanvasHeight);
}

export function saveDefaultCanvasSize(
  settings: AppSettings,
  size: CanvasSize,
): AppSettings {
  const width = clampCanvasDimension(size.width);
  const height = clampCanvasDimension(size.height);
  return {
    ...settings,
    defaultCanvasWidth: width,
    defaultCanvasHeight: height,
  };
}

export function addCustomCanvasSizePreset(
  settings: AppSettings,
  size: CanvasSize,
  label?: string,
): AppSettings {
  const preset = createCustomPreset(size.width, size.height, label);
  return {
    ...settings,
    customCanvasSizePresets: addCustomPreset(settings.customCanvasSizePresets, preset),
  };
}

export function removeCustomCanvasSizePreset(
  settings: AppSettings,
  id: string,
): AppSettings {
  return {
    ...settings,
    customCanvasSizePresets: removeCustomPreset(settings.customCanvasSizePresets, id),
  };
}

export function createBlankProjectWithPreferences(
  settings: AppSettings,
  library: PalettePresetLibrary,
  name?: string,
): Project {
  const size = getDefaultCanvasSize(settings);
  return applyGridDefaults(createEmptyProjectWithDefaultPalette(library, name, size), settings);
}

export function findCustomCanvasSizePreset(
  settings: AppSettings,
  id: string,
): CustomCanvasSizePresetRecord | undefined {
  return settings.customCanvasSizePresets.find((preset) => preset.id === id);
}
