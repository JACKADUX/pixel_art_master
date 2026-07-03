import { describe, expect, it } from "vitest";
import { buildPaletteFromLeadingPixels } from "./ImagePixelPalette";

function makeImageData(pixels: [number, number, number, number][]): ImageData {
  const data = new Uint8ClampedArray(pixels.length * 4);
  pixels.forEach(([r, g, b, a], i) => {
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = a;
  });
  return { width: pixels.length, height: 1, data } as ImageData;
}

describe("buildPaletteFromLeadingPixels", () => {
  it("按出现顺序去重像素颜色", () => {
    const imageData = makeImageData([
      [255, 0, 0, 255],
      [255, 0, 0, 255],
      [0, 255, 0, 255],
    ]);
    const entries = buildPaletteFromLeadingPixels(imageData);
    expect(entries.map((e) => e.hex)).toEqual(["#ff0000ff", "#00ff00ff"]);
  });

  it("只取前 maxPixels 个像素", () => {
    const pixels: [number, number, number, number][] = Array.from(
      { length: 10 },
      (_, i) => [i, i, i, 255],
    );
    const entries = buildPaletteFromLeadingPixels(makeImageData(pixels), 3);
    expect(entries).toHaveLength(3);
    expect(entries.map((e) => e.hex)).toEqual(["#000000ff", "#010101ff", "#020202ff"]);
  });

  it("最多保留 256 个去重颜色", () => {
    const pixels: [number, number, number, number][] = Array.from(
      { length: 512 },
      (_, i) => [i % 256, 0, 0, 255],
    );
    const entries = buildPaletteFromLeadingPixels(makeImageData(pixels));
    expect(entries).toHaveLength(256);
  });

  it("保留 alpha 通道", () => {
    const entries = buildPaletteFromLeadingPixels(makeImageData([[0, 255, 0, 128]]));
    expect(entries.map((e) => e.hex)).toEqual(["#00ff0080"]);
  });

  it("空图片返回空数组", () => {
    expect(buildPaletteFromLeadingPixels(makeImageData([]))).toEqual([]);
  });
});
