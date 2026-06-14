import { describe, expect, it } from "vitest";
import { rgba } from "../canvas/PixelColor";
import { PixelGrid } from "../canvas/PixelGrid";
import { buildColorPaletteFromImageData } from "./ImageColorPalette";

function toImageData(grid: PixelGrid): ImageData {
  return { width: grid.width, height: grid.height, data: grid.toRgba() } as ImageData;
}

describe("buildColorPaletteFromImageData", () => {
  it("skips transparent pixels", () => {
    const grid = PixelGrid.createEmpty(2, 2);
    grid.setPixel(0, 0, rgba(255, 0, 0, 255));
    grid.setPixel(1, 1, rgba(0, 255, 0, 128));

    const palette = buildColorPaletteFromImageData(toImageData(grid));

    expect(palette).toHaveLength(2);
    expect(palette.map((entry) => entry.hex)).toContain("#ff0000ff");
    expect(palette.map((entry) => entry.hex)).toContain("#00ff0080");
  });

  it("deduplicates identical colors", () => {
    const grid = PixelGrid.createEmpty(2, 2);
    grid.setPixel(0, 0, rgba(255, 0, 0, 255));
    grid.setPixel(1, 0, rgba(255, 0, 0, 255));
    grid.setPixel(0, 1, rgba(0, 0, 255, 255));

    const palette = buildColorPaletteFromImageData(toImageData(grid));

    expect(palette).toHaveLength(2);
  });

  it("sorts by OKLab lightness then hex", () => {
    const grid = PixelGrid.createEmpty(3, 1);
    grid.setPixel(0, 0, rgba(0, 0, 0, 255));
    grid.setPixel(1, 0, rgba(255, 255, 255, 255));
    grid.setPixel(2, 0, rgba(128, 128, 128, 255));

    const palette = buildColorPaletteFromImageData(toImageData(grid));

    expect(palette[0]?.hex).toBe("#000000ff");
    expect(palette[palette.length - 1]?.hex).toBe("#ffffffff");
  });

  it("respects maxColors limit", () => {
    const grid = PixelGrid.createEmpty(4, 1);
    grid.setPixel(0, 0, rgba(255, 0, 0, 255));
    grid.setPixel(1, 0, rgba(0, 255, 0, 255));
    grid.setPixel(2, 0, rgba(0, 0, 255, 255));
    grid.setPixel(3, 0, rgba(255, 255, 0, 255));

    const palette = buildColorPaletteFromImageData(toImageData(grid), 2);

    expect(palette).toHaveLength(2);
  });
});
