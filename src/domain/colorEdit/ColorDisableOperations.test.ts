import { describe, expect, it } from "vitest";
import { rgba } from "../canvas/PixelColor";
import { computeColorPaletteStats } from "./ColorPaletteStats";
import {
  applyDisabledColors,
  buildDisabledColorReplacementMap,
  filterDisabledColorsInPalette,
  findNearestPaletteColor,
} from "./ColorDisableOperations";

function createImageData(pixels: Array<[number, number, number, number]>, width: number): ImageData {
  const height = pixels.length / width;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i += 1) {
    const [r, g, b, a] = pixels[i];
    const offset = i * 4;
    data[offset] = r;
    data[offset + 1] = g;
    data[offset + 2] = b;
    data[offset + 3] = a;
  }
  return { width, height, data } as ImageData;
}

function pixelAt(imageData: ImageData, x: number, y: number): [number, number, number, number] {
  const offset = (y * imageData.width + x) * 4;
  const { data } = imageData;
  return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
}

describe("findNearestPaletteColor", () => {
  it("picks the closest color in OKLab space", () => {
    const target = rgba(100, 100, 100, 255);
    const near = rgba(110, 110, 110, 255);
    const far = rgba(20, 20, 220, 255);
    expect(findNearestPaletteColor(target, [far, near])).toBe(near);
  });

  it("returns null when no candidates", () => {
    expect(findNearestPaletteColor(rgba(255, 0, 0, 255), [])).toBeNull();
  });
});

describe("filterDisabledColorsInPalette", () => {
  it("keeps only colors that exist in the normalized palette", () => {
    const image = createImageData(
      [
        [220, 20, 20, 255],
        [20, 20, 220, 255],
      ],
      2,
    );
    const palette = computeColorPaletteStats(image);
    const stale = rgba(0, 255, 0, 255);
    expect(filterDisabledColorsInPalette(palette, [palette.colors[0].color, stale])).toEqual([
      palette.colors[0].color,
    ]);
  });
});

describe("buildDisabledColorReplacementMap", () => {
  it("maps disabled colors to nearest remaining palette color", () => {
    const red = rgba(220, 20, 20, 255);
    const darkRed = rgba(180, 10, 10, 255);
    const blue = rgba(20, 20, 220, 255);
    const image = createImageData(
      [
        [220, 20, 20, 255],
        [180, 10, 10, 255],
        [20, 20, 220, 255],
      ],
      3,
    );

    const map = buildDisabledColorReplacementMap(image, [red]);
    expect(map.get(red)).toBe(darkRed);
    expect(map.has(blue)).toBe(false);
  });

  it("returns empty map when all colors are disabled", () => {
    const red = rgba(255, 0, 0, 255);
    const image = createImageData([[255, 0, 0, 255]], 1);
    expect(buildDisabledColorReplacementMap(image, [red]).size).toBe(0);
  });
});

describe("applyDisabledColors", () => {
  it("returns image unchanged when no disabled colors", () => {
    const image = createImageData([[255, 0, 0, 255]], 1);
    expect(applyDisabledColors(image, [])).toBe(image);
  });

  it("replaces disabled color pixels with nearest remaining color", () => {
    const red = rgba(220, 20, 20, 255);
    const darkRed = rgba(180, 10, 10, 255);
    const blue = rgba(20, 20, 220, 255);
    const image = createImageData(
      [
        [220, 20, 20, 255],
        [180, 10, 10, 255],
        [20, 20, 220, 255],
      ],
      3,
    );

    const result = applyDisabledColors(image, [red]);
    expect(pixelAt(result, 0, 0)).toEqual([180, 10, 10, 255]);
    expect(pixelAt(result, 1, 0)).toEqual([180, 10, 10, 255]);
    expect(pixelAt(result, 2, 0)).toEqual([20, 20, 220, 255]);
    expect(red).not.toBe(darkRed);
    expect(red).not.toBe(blue);
  });

  it("preserves transparent pixels", () => {
    const red = rgba(255, 0, 0, 255);
    const green = rgba(0, 255, 0, 255);
    const image = createImageData(
      [
        [255, 0, 0, 255],
        [0, 255, 0, 255],
        [0, 0, 0, 0],
      ],
      3,
    );

    const result = applyDisabledColors(image, [red]);
    expect(pixelAt(result, 0, 0)).toEqual([0, 255, 0, 255]);
    expect(pixelAt(result, 1, 0)).toEqual([0, 255, 0, 255]);
    expect(pixelAt(result, 2, 0)).toEqual([0, 0, 0, 0]);
    expect(red).not.toBe(green);
  });

  it("applies multiple disabled colors at once", () => {
    const red = rgba(220, 20, 20, 255);
    const darkRed = rgba(180, 10, 10, 255);
    const blue = rgba(20, 20, 220, 255);
    const image = createImageData(
      [
        [220, 20, 20, 255],
        [180, 10, 10, 255],
        [20, 20, 220, 255],
      ],
      3,
    );

    const result = applyDisabledColors(image, [red, darkRed]);
    expect(pixelAt(result, 0, 0)).toEqual([20, 20, 220, 255]);
    expect(pixelAt(result, 1, 0)).toEqual([20, 20, 220, 255]);
    expect(pixelAt(result, 2, 0)).toEqual([20, 20, 220, 255]);
  });
});
