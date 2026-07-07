import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import { createEmptyMask, setMaskPixel } from "@/domain/selection/SelectionMask";
import { createSelectionState, withFloating } from "@/domain/selection/SelectionState";
import type { FloatingSelection } from "@/domain/selection/FloatingSelection";
import {
  buildColorEntriesInScanOrder,
  extractColorsFromFloatingSelection,
  extractColorsFromMaskedGrid,
  extractColorsFromSelection,
} from "./SelectionColorExtraction";

describe("buildColorEntriesInScanOrder", () => {
  it("preserves first-seen order and skips transparent pixels", () => {
    const red = rgba(255, 0, 0);
    const green = rgba(0, 255, 0);
    const transparent = rgba(0, 0, 0, 0);

    const entries = buildColorEntriesInScanOrder([red, transparent, green, red]);
    expect(entries.map((entry) => entry.hex)).toEqual(["#ff0000ff", "#00ff00ff"]);
  });
});

describe("extractColorsFromMaskedGrid", () => {
  it("extracts unique colors from masked pixels in scan order", () => {
    const grid = PixelGrid.createEmpty(3, 2);
    grid.setPixel(0, 0, rgba(255, 0, 0));
    grid.setPixel(1, 0, rgba(0, 255, 0));
    grid.setPixel(2, 0, rgba(255, 0, 0));

    const mask = createEmptyMask(3, 2);
    setMaskPixel(mask, 0, 0, true);
    setMaskPixel(mask, 1, 0, true);
    setMaskPixel(mask, 2, 0, true);

    const entries = extractColorsFromMaskedGrid(grid, mask);
    expect(entries.map((entry) => entry.hex)).toEqual(["#ff0000ff", "#00ff00ff"]);
  });
});

describe("extractColorsFromFloatingSelection", () => {
  it("extracts colors from floating pixel grid", () => {
    const pixels = PixelGrid.createEmpty(2, 1);
    pixels.setPixel(0, 0, rgba(0, 0, 255));
    pixels.setPixel(1, 0, rgba(255, 255, 0));

    const floating: FloatingSelection = {
      pixels,
      offset: { x: 1, y: 1 },
      originInLayer: { x: 1, y: 1 },
      source: "layer",
    };

    const entries = extractColorsFromFloatingSelection(floating);
    expect(entries.map((entry) => entry.hex)).toEqual(["#0000ffff", "#ffff00ff"]);
  });
});

describe("extractColorsFromSelection", () => {
  it("uses floating pixels when selection is floating", () => {
    const pixels = PixelGrid.createEmpty(1, 1);
    pixels.setPixel(0, 0, rgba(128, 128, 128));

    const floating: FloatingSelection = {
      pixels,
      offset: { x: 0, y: 0 },
      originInLayer: { x: 0, y: 0 },
      source: "layer",
    };

    const grid = PixelGrid.createEmpty(1, 1);
    grid.setPixel(0, 0, rgba(255, 0, 0));

    const selection = withFloating(
      createSelectionState(createEmptyMask(1, 1)),
      floating,
    );

    const entries = extractColorsFromSelection(grid, selection);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.hex).toBe("#808080ff");
  });
});
