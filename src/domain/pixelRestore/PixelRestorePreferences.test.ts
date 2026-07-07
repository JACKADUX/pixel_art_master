import { describe, expect, it } from "vitest";
import {
  DEFAULT_PIXEL_RESTORE_PREFERENCES,
  extractPixelRestorePreferences,
  parsePixelRestorePreferences,
} from "./PixelRestorePreferences";

describe("PixelRestorePreferences", () => {
  it("returns defaults for invalid input", () => {
    expect(parsePixelRestorePreferences(null)).toEqual(DEFAULT_PIXEL_RESTORE_PREFERENCES);
    expect(parsePixelRestorePreferences("bad")).toEqual(DEFAULT_PIXEL_RESTORE_PREFERENCES);
  });

  it("parses valid preferences", () => {
    expect(
      parsePixelRestorePreferences({
        restoreMode: "gridScale",
        selectedScale: 4,
        mergeAlgorithm: "mode",
        gridScaleType: "region",
        gridColumnCount: 8,
        gridRowCount: 6,
        centerPriorityEnabled: true,
        excludeRingCount: 3,
      }),
    ).toEqual({
      restoreMode: "gridScale",
      selectedScale: 4,
      mergeAlgorithm: "mode",
      gridScaleType: "region",
      gridColumnCount: 8,
      gridRowCount: 6,
      centerPriorityEnabled: true,
      excludeRingCount: 3,
    });
  });

  it("falls back for invalid enum values", () => {
    expect(
      parsePixelRestorePreferences({
        restoreMode: "invalid",
        selectedScale: 3,
        mergeAlgorithm: "invalid",
        gridScaleType: "invalid",
      }),
    ).toEqual({
      restoreMode: "fixedScale",
      selectedScale: 3,
      mergeAlgorithm: DEFAULT_PIXEL_RESTORE_PREFERENCES.mergeAlgorithm,
      gridScaleType: DEFAULT_PIXEL_RESTORE_PREFERENCES.gridScaleType,
      gridColumnCount: DEFAULT_PIXEL_RESTORE_PREFERENCES.gridColumnCount,
      gridRowCount: DEFAULT_PIXEL_RESTORE_PREFERENCES.gridRowCount,
      centerPriorityEnabled: DEFAULT_PIXEL_RESTORE_PREFERENCES.centerPriorityEnabled,
      excludeRingCount: DEFAULT_PIXEL_RESTORE_PREFERENCES.excludeRingCount,
    });
  });

  it("clamps selected scale and grid counts", () => {
    expect(parsePixelRestorePreferences({ selectedScale: 0 }).selectedScale).toBe(1);
    expect(parsePixelRestorePreferences({ selectedScale: 99 }).selectedScale).toBe(16);
    expect(parsePixelRestorePreferences({ gridColumnCount: 0 }).gridColumnCount).toBe(1);
    expect(parsePixelRestorePreferences({ gridRowCount: 99999 }).gridRowCount).toBe(4096);
    expect(parsePixelRestorePreferences({ excludeRingCount: 9 }).excludeRingCount).toBe(5);
    expect(parsePixelRestorePreferences({ excludeRingCount: -1 }).excludeRingCount).toBe(0);
  });

  it("extracts and normalizes from source", () => {
    expect(
      extractPixelRestorePreferences({
        restoreMode: "gridScale",
        selectedScale: 8,
        mergeAlgorithm: "average",
        gridScaleType: "region",
        gridColumnCount: 5,
        gridRowCount: 3,
        centerPriorityEnabled: true,
        excludeRingCount: 2,
      }),
    ).toEqual({
      restoreMode: "gridScale",
      selectedScale: 8,
      mergeAlgorithm: "average",
      gridScaleType: "region",
      gridColumnCount: 5,
      gridRowCount: 3,
      centerPriorityEnabled: true,
      excludeRingCount: 2,
    });
  });
});
