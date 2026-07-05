import { createCanvasSize } from "./CanvasSize";
import {
  BUILTIN_CANVAS_SIZE_PRESETS,
  formatCanvasSizeLabel,
  type CanvasSizePreset,
} from "./CanvasSizePreset";

export const MAX_CUSTOM_CANVAS_SIZE_PRESETS = 20;

export interface CustomCanvasSizePresetRecord {
  id: string;
  label: string;
  width: number;
  height: number;
}

export function createCustomPreset(
  width: number,
  height: number,
  label?: string,
): CustomCanvasSizePresetRecord {
  createCanvasSize(width, height);
  const safeLabel = label?.trim() || formatCanvasSizeLabel(width, height);
  return {
    id: crypto.randomUUID(),
    label: safeLabel,
    width,
    height,
  };
}

export function addCustomPreset(
  presets: CustomCanvasSizePresetRecord[],
  preset: CustomCanvasSizePresetRecord,
): CustomCanvasSizePresetRecord[] {
  if (presets.length >= MAX_CUSTOM_CANVAS_SIZE_PRESETS) {
    throw new Error(`最多保存 ${MAX_CUSTOM_CANVAS_SIZE_PRESETS} 个自定义预设`);
  }
  const duplicate = presets.some(
    (item) => item.width === preset.width && item.height === preset.height,
  );
  if (duplicate) {
    throw new Error("该尺寸预设已存在");
  }
  return [...presets, preset];
}

export function removeCustomPreset(
  presets: CustomCanvasSizePresetRecord[],
  id: string,
): CustomCanvasSizePresetRecord[] {
  return presets.filter((preset) => preset.id !== id);
}

export function toCanvasSizePreset(record: CustomCanvasSizePresetRecord): CanvasSizePreset {
  return {
    id: record.id,
    label: record.label,
    width: record.width,
    height: record.height,
    builtin: false,
  };
}

export function allCanvasSizePresets(
  customPresets: CustomCanvasSizePresetRecord[],
): CanvasSizePreset[] {
  return [
    ...BUILTIN_CANVAS_SIZE_PRESETS,
    ...customPresets.map(toCanvasSizePreset),
  ];
}
