import {
  DEFAULT_GRID_MERGE_ALGORITHM,
  GRID_MERGE_ALGORITHMS,
  type GridMergeAlgorithm,
} from "./GridMergeAlgorithm";
import {
  DEFAULT_GRID_SCALE_TYPE,
  GRID_SCALE_TYPES,
  type GridScaleType,
} from "./GridScaleType";
import {
  clampExcludeRingCount,
  DEFAULT_GRID_MERGE_CENTER_PRIORITY,
} from "./GridMergeCenterPriority";
import { MAX_RESTORE_SCALE, MIN_RESTORE_SCALE } from "./RestoreScale";

export type PixelRestoreMode = "fixedScale" | "gridScale";

export interface PixelRestorePreferences {
  restoreMode: PixelRestoreMode;
  selectedScale: number;
  mergeAlgorithm: GridMergeAlgorithm;
  gridScaleType: GridScaleType;
  gridColumnCount: number;
  gridRowCount: number;
  centerPriorityEnabled: boolean;
  excludeRingCount: number;
}

export const PIXEL_RESTORE_PREFERENCES_VERSION = 3;

export const DEFAULT_PIXEL_RESTORE_PREFERENCES: PixelRestorePreferences = {
  restoreMode: "fixedScale",
  selectedScale: 2,
  mergeAlgorithm: DEFAULT_GRID_MERGE_ALGORITHM,
  gridScaleType: DEFAULT_GRID_SCALE_TYPE,
  gridColumnCount: 1,
  gridRowCount: 1,
  centerPriorityEnabled: DEFAULT_GRID_MERGE_CENTER_PRIORITY.enabled,
  excludeRingCount: DEFAULT_GRID_MERGE_CENTER_PRIORITY.excludeRingCount,
};

const RESTORE_MODES: PixelRestoreMode[] = ["fixedScale", "gridScale"];
const MIN_GRID_COUNT = 1;
const MAX_GRID_COUNT = 4096;

export interface PixelRestorePreferencesSource {
  restoreMode: PixelRestoreMode;
  selectedScale: number;
  mergeAlgorithm: GridMergeAlgorithm;
  gridScaleType: GridScaleType;
  gridColumnCount: number;
  gridRowCount: number;
  centerPriorityEnabled: boolean;
  excludeRingCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return Math.min(Math.max(rounded, min), max);
}

export function parsePixelRestorePreferences(raw: unknown): PixelRestorePreferences {
  const defaults = DEFAULT_PIXEL_RESTORE_PREFERENCES;
  if (!isRecord(raw)) return { ...defaults };

  const restoreMode = RESTORE_MODES.includes(raw.restoreMode as PixelRestoreMode)
    ? (raw.restoreMode as PixelRestoreMode)
    : defaults.restoreMode;

  const mergeAlgorithm = GRID_MERGE_ALGORITHMS.includes(raw.mergeAlgorithm as GridMergeAlgorithm)
    ? (raw.mergeAlgorithm as GridMergeAlgorithm)
    : defaults.mergeAlgorithm;

  const gridScaleType = GRID_SCALE_TYPES.includes(raw.gridScaleType as GridScaleType)
    ? (raw.gridScaleType as GridScaleType)
    : defaults.gridScaleType;

  return {
    restoreMode,
    selectedScale: clampInteger(
      raw.selectedScale,
      MIN_RESTORE_SCALE,
      MAX_RESTORE_SCALE,
      defaults.selectedScale,
    ),
    mergeAlgorithm,
    gridScaleType,
    gridColumnCount: clampInteger(
      raw.gridColumnCount,
      MIN_GRID_COUNT,
      MAX_GRID_COUNT,
      defaults.gridColumnCount,
    ),
    gridRowCount: clampInteger(
      raw.gridRowCount,
      MIN_GRID_COUNT,
      MAX_GRID_COUNT,
      defaults.gridRowCount,
    ),
    centerPriorityEnabled:
      typeof raw.centerPriorityEnabled === "boolean"
        ? raw.centerPriorityEnabled
        : defaults.centerPriorityEnabled,
    excludeRingCount: clampExcludeRingCount(raw.excludeRingCount, defaults.excludeRingCount),
  };
}

export function extractPixelRestorePreferences(
  source: PixelRestorePreferencesSource,
): PixelRestorePreferences {
  const defaults = DEFAULT_PIXEL_RESTORE_PREFERENCES;
  return {
    restoreMode: RESTORE_MODES.includes(source.restoreMode)
      ? source.restoreMode
      : defaults.restoreMode,
    selectedScale: clampInteger(
      source.selectedScale,
      MIN_RESTORE_SCALE,
      MAX_RESTORE_SCALE,
      defaults.selectedScale,
    ),
    mergeAlgorithm: GRID_MERGE_ALGORITHMS.includes(source.mergeAlgorithm)
      ? source.mergeAlgorithm
      : defaults.mergeAlgorithm,
    gridScaleType: GRID_SCALE_TYPES.includes(source.gridScaleType)
      ? source.gridScaleType
      : defaults.gridScaleType,
    gridColumnCount: clampInteger(
      source.gridColumnCount,
      MIN_GRID_COUNT,
      MAX_GRID_COUNT,
      defaults.gridColumnCount,
    ),
    gridRowCount: clampInteger(
      source.gridRowCount,
      MIN_GRID_COUNT,
      MAX_GRID_COUNT,
      defaults.gridRowCount,
    ),
    centerPriorityEnabled:
      typeof source.centerPriorityEnabled === "boolean"
        ? source.centerPriorityEnabled
        : defaults.centerPriorityEnabled,
    excludeRingCount: clampExcludeRingCount(source.excludeRingCount, defaults.excludeRingCount),
  };
}
