export type ImageExportScope = "project" | "layer" | "selection";
export type ImageExportFormat = "png" | "webp";
export type ImageExportScalePreset = "original" | "256" | "512" | "1024" | "custom";

export interface ImageExportPreferences {
  lastExportDirectory: string | null;
  format: ImageExportFormat;
  scope: ImageExportScope;
  scalePreset: ImageExportScalePreset;
  customLongestEdge: number;
}

export const IMAGE_EXPORT_PREFERENCES_VERSION = 1;

export const MIN_CUSTOM_LONGEST_EDGE = 1;
export const MAX_CUSTOM_LONGEST_EDGE = 8192;

export const DEFAULT_IMAGE_EXPORT_PREFERENCES: ImageExportPreferences = {
  lastExportDirectory: null,
  format: "png",
  scope: "project",
  scalePreset: "original",
  customLongestEdge: 256,
};

const SCOPES: ImageExportScope[] = ["project", "layer", "selection"];
const FORMATS: ImageExportFormat[] = ["png", "webp"];
const SCALE_PRESETS: ImageExportScalePreset[] = [
  "original",
  "256",
  "512",
  "1024",
  "custom",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clampLongestEdge(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.round(value), MIN_CUSTOM_LONGEST_EDGE), MAX_CUSTOM_LONGEST_EDGE);
}

export function parseImageExportPreferences(raw: unknown): ImageExportPreferences {
  const defaults = DEFAULT_IMAGE_EXPORT_PREFERENCES;
  if (!isRecord(raw)) return { ...defaults };

  const format = FORMATS.includes(raw.format as ImageExportFormat)
    ? (raw.format as ImageExportFormat)
    : defaults.format;
  const scope = SCOPES.includes(raw.scope as ImageExportScope)
    ? (raw.scope as ImageExportScope)
    : defaults.scope;
  const scalePreset = SCALE_PRESETS.includes(raw.scalePreset as ImageExportScalePreset)
    ? (raw.scalePreset as ImageExportScalePreset)
    : defaults.scalePreset;

  return {
    lastExportDirectory:
      typeof raw.lastExportDirectory === "string" ? raw.lastExportDirectory : null,
    format,
    scope,
    scalePreset,
    customLongestEdge: clampLongestEdge(raw.customLongestEdge, defaults.customLongestEdge),
  };
}

export function getImageExportExtension(format: ImageExportFormat): string {
  return format === "webp" ? "webp" : "png";
}
