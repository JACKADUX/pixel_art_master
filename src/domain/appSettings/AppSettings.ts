import { fromHex, toHex, type PixelColor } from "@/domain/canvas/PixelColor";
import { DEFAULT_GRID } from "@/domain/project/Project";

export const APP_SETTINGS_VERSION = 1;

export const DEFAULT_AUTO_SAVE_INTERVAL_MINUTES = 2;
export const MIN_AUTO_SAVE_INTERVAL_MINUTES = 1;
export const MAX_AUTO_SAVE_INTERVAL_MINUTES = 120;

export const MIN_GRID_SIZE = 1;
export const MAX_GRID_SIZE = 256;

export const MIN_GRID_LINE_WIDTH = 0.5;
export const MAX_GRID_LINE_WIDTH = 4;

export const MIN_CHECKERBOARD_TILE_SIZE = 2;
export const MAX_CHECKERBOARD_TILE_SIZE = 64;

export const DEFAULT_GRID_COLOR_HEX = "#3b82f6";
export const DEFAULT_CHECKERBOARD_LIGHT_HEX = "#c0c0c0";
export const DEFAULT_CHECKERBOARD_DARK_HEX = "#808080";

export const DEFAULT_SYMMETRY_AXIS_COLOR_HEX = "#ff4fd8";

export const MIN_SYMMETRY_AXIS_LINE_WIDTH = 1;
export const MAX_SYMMETRY_AXIS_LINE_WIDTH = 8;

export interface AppSettings {
  autoSaveIntervalMinutes: number;
  pomodoroVisible: boolean;
  defaultGridPrimary: number;
  defaultGridSecondary: number;
  gridColorHex: string;
  gridLineWidth: number;
  subGridEnabled: boolean;
  checkerboardTileSize: number;
  checkerboardLightHex: string;
  checkerboardDarkHex: string;
  symmetryAxisVisible: boolean;
  symmetryAxisColorHex: string;
  symmetryAxisLineWidth: number;
  symmetryAxisOutlineEnabled: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  autoSaveIntervalMinutes: DEFAULT_AUTO_SAVE_INTERVAL_MINUTES,
  pomodoroVisible: true,
  defaultGridPrimary: DEFAULT_GRID.primary,
  defaultGridSecondary: DEFAULT_GRID.secondary,
  gridColorHex: DEFAULT_GRID_COLOR_HEX,
  gridLineWidth: 1,
  subGridEnabled: true,
  checkerboardTileSize: 16,
  checkerboardLightHex: DEFAULT_CHECKERBOARD_LIGHT_HEX,
  checkerboardDarkHex: DEFAULT_CHECKERBOARD_DARK_HEX,
  symmetryAxisVisible: true,
  symmetryAxisColorHex: DEFAULT_SYMMETRY_AXIS_COLOR_HEX,
  symmetryAxisLineWidth: 2,
  symmetryAxisOutlineEnabled: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clampNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function parseHexColor(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const color = fromHex(raw);
  if (color === 0 && raw !== "#000000" && raw !== "#000") return fallback;
  return toHex(color);
}

export function clampGridSize(value: number): number {
  return clampNumber(value, MIN_GRID_SIZE, MAX_GRID_SIZE, DEFAULT_GRID.primary);
}

export function clampAutoSaveIntervalMinutes(value: number): number {
  return clampNumber(
    value,
    MIN_AUTO_SAVE_INTERVAL_MINUTES,
    MAX_AUTO_SAVE_INTERVAL_MINUTES,
    DEFAULT_AUTO_SAVE_INTERVAL_MINUTES,
  );
}

export function clampGridLineWidth(value: number): number {
  return clampNumber(
    value,
    MIN_GRID_LINE_WIDTH,
    MAX_GRID_LINE_WIDTH,
    DEFAULT_APP_SETTINGS.gridLineWidth,
  );
}

export function clampCheckerboardTileSize(value: number): number {
  return clampNumber(
    value,
    MIN_CHECKERBOARD_TILE_SIZE,
    MAX_CHECKERBOARD_TILE_SIZE,
    DEFAULT_APP_SETTINGS.checkerboardTileSize,
  );
}

export function clampSymmetryAxisLineWidth(value: number): number {
  return clampNumber(
    value,
    MIN_SYMMETRY_AXIS_LINE_WIDTH,
    MAX_SYMMETRY_AXIS_LINE_WIDTH,
    DEFAULT_APP_SETTINGS.symmetryAxisLineWidth,
  );
}

export function symmetryAxisColorRgba(hex: string, alpha = 1): string {
  const { r, g, b } = parseRgbFromHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function gridColorRgbString(hex: string): string {
  const { r, g, b } = parseRgbFromHex(hex);
  return `${r}, ${g}, ${b}`;
}

export function parseRgbFromHex(hex: string): { r: number; g: number; b: number } {
  const color: PixelColor = fromHex(hex);
  return {
    r: color & 0xff,
    g: (color >> 8) & 0xff,
    b: (color >> 16) & 0xff,
  };
}

export function parseAppSettings(raw: unknown): AppSettings {
  const defaults = DEFAULT_APP_SETTINGS;
  if (!isRecord(raw)) return { ...defaults };

  const defaultGridPrimary = clampGridSize(
    typeof raw.defaultGridPrimary === "number" ? raw.defaultGridPrimary : defaults.defaultGridPrimary,
  );
  let defaultGridSecondary = clampGridSize(
    typeof raw.defaultGridSecondary === "number"
      ? raw.defaultGridSecondary
      : defaults.defaultGridSecondary,
  );
  if (defaultGridSecondary > defaultGridPrimary) {
    defaultGridSecondary = defaultGridPrimary;
  }

  return {
    autoSaveIntervalMinutes: clampAutoSaveIntervalMinutes(
      typeof raw.autoSaveIntervalMinutes === "number"
        ? raw.autoSaveIntervalMinutes
        : defaults.autoSaveIntervalMinutes,
    ),
    pomodoroVisible:
      typeof raw.pomodoroVisible === "boolean" ? raw.pomodoroVisible : defaults.pomodoroVisible,
    defaultGridPrimary,
    defaultGridSecondary,
    gridColorHex: parseHexColor(raw.gridColorHex, defaults.gridColorHex),
    gridLineWidth: clampGridLineWidth(
      typeof raw.gridLineWidth === "number" ? raw.gridLineWidth : defaults.gridLineWidth,
    ),
    subGridEnabled:
      typeof raw.subGridEnabled === "boolean" ? raw.subGridEnabled : defaults.subGridEnabled,
    checkerboardTileSize: clampCheckerboardTileSize(
      typeof raw.checkerboardTileSize === "number"
        ? raw.checkerboardTileSize
        : defaults.checkerboardTileSize,
    ),
    checkerboardLightHex: parseHexColor(
      raw.checkerboardLightHex,
      defaults.checkerboardLightHex,
    ),
    checkerboardDarkHex: parseHexColor(raw.checkerboardDarkHex, defaults.checkerboardDarkHex),
    symmetryAxisVisible:
      typeof raw.symmetryAxisVisible === "boolean"
        ? raw.symmetryAxisVisible
        : defaults.symmetryAxisVisible,
    symmetryAxisColorHex: parseHexColor(
      raw.symmetryAxisColorHex,
      defaults.symmetryAxisColorHex,
    ),
    symmetryAxisLineWidth: clampSymmetryAxisLineWidth(
      typeof raw.symmetryAxisLineWidth === "number"
        ? raw.symmetryAxisLineWidth
        : defaults.symmetryAxisLineWidth,
    ),
    symmetryAxisOutlineEnabled:
      typeof raw.symmetryAxisOutlineEnabled === "boolean"
        ? raw.symmetryAxisOutlineEnabled
        : defaults.symmetryAxisOutlineEnabled,
  };
}
