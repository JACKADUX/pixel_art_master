import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import { createEmptyMask, setMaskPixel } from "@/domain/selection/SelectionMask";
import { createSelectionState } from "@/domain/selection/SelectionState";
import { createGroupFromSelectionColors } from "./CreateGroupFromSelection";
import { LUMINANCE_PALETTE_MAX_SWATCHES } from "./LuminancePaletteGroup";

describe("createGroupFromSelectionColors", () => {
  it("returns null when selection has no opaque colors", () => {
    const grid = PixelGrid.createEmpty(1, 1);
    const mask = createEmptyMask(1, 1);
    const selection = createSelectionState(mask);

    expect(createGroupFromSelectionColors(grid, selection, 1)).toBeNull();
  });

  it("keeps top 10 colors sorted by lightness", () => {
    const grid = PixelGrid.createEmpty(12, 1);
    const colors = Array.from({ length: 12 }, (_, index) =>
      rgba(index * 20, index * 20, index * 20),
    );
    colors.forEach((color, index) => grid.setPixel(index, 0, color));

    const mask = createEmptyMask(12, 1);
    for (let x = 0; x < 12; x += 1) {
      setMaskPixel(mask, x, 0, true);
    }
    const selection = createSelectionState(mask);

    const group = createGroupFromSelectionColors(grid, selection, 1);
    expect(group).not.toBeNull();
    expect(group?.colors).toHaveLength(LUMINANCE_PALETTE_MAX_SWATCHES);

    const lightnessValues = group!.colors.map((swatch) => swatch.color & 0xff);
    for (let i = 1; i < lightnessValues.length; i += 1) {
      expect(lightnessValues[i - 1]!).toBeGreaterThanOrEqual(lightnessValues[i]!);
    }
  });
});
