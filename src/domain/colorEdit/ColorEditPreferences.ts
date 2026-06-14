import {
  COLOR_EDIT_MODES,
  DEFAULT_COLOR_EDIT_MODE,
  type ColorEditMode,
} from "./ColorEditMode";
import {
  clampAnchorDistance,
  DEFAULT_ANCHOR_DISTANCE,
} from "./ColorMergeAnchor";
import {
  DEFAULT_UNMATCHED_PIXEL_BEHAVIOR,
  parseUnmatchedPixelBehavior,
  type UnmatchedPixelBehavior,
} from "./UnmatchedPixelBehavior";

export interface ColorEditPreferences {
  editMode: ColorEditMode;
  defaultAnchorDistance: number;
  unmatchedPixelBehavior: UnmatchedPixelBehavior;
}

export const COLOR_EDIT_PREFERENCES_VERSION = 3;

export const DEFAULT_COLOR_EDIT_PREFERENCES: ColorEditPreferences = {
  editMode: DEFAULT_COLOR_EDIT_MODE,
  defaultAnchorDistance: DEFAULT_ANCHOR_DISTANCE,
  unmatchedPixelBehavior: DEFAULT_UNMATCHED_PIXEL_BEHAVIOR,
};

export interface ColorEditPreferencesSource {
  editMode: ColorEditMode;
  defaultAnchorDistance: number;
  unmatchedPixelBehavior: UnmatchedPixelBehavior;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseColorEditPreferences(raw: unknown): ColorEditPreferences {
  const defaults = DEFAULT_COLOR_EDIT_PREFERENCES;
  if (!isRecord(raw)) return { ...defaults };

  const editMode = COLOR_EDIT_MODES.includes(raw.editMode as ColorEditMode)
    ? (raw.editMode as ColorEditMode)
    : defaults.editMode;

  return {
    editMode,
    defaultAnchorDistance: clampAnchorDistance(
      typeof raw.defaultAnchorDistance === "number"
        ? raw.defaultAnchorDistance
        : defaults.defaultAnchorDistance,
    ),
    unmatchedPixelBehavior: parseUnmatchedPixelBehavior(raw.unmatchedPixelBehavior),
  };
}

export function extractColorEditPreferences(
  source: ColorEditPreferencesSource,
): ColorEditPreferences {
  const defaults = DEFAULT_COLOR_EDIT_PREFERENCES;
  const editMode = COLOR_EDIT_MODES.includes(source.editMode)
    ? source.editMode
    : defaults.editMode;

  return {
    editMode,
    defaultAnchorDistance: clampAnchorDistance(source.defaultAnchorDistance),
    unmatchedPixelBehavior: parseUnmatchedPixelBehavior(source.unmatchedPixelBehavior),
  };
}
