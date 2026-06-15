import { describe, expect, it } from "vitest";
import { rgba } from "../canvas/PixelColor";
import { pixelColorToOklab } from "../color/ColorConverter";
import { applyOklabMerge, reduceOklabClusterColors } from "./OklabMergeOperations";

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

describe("reduceOklabClusterColors", () => {
  it("picks the most frequent color for mode", () => {
    const common = rgba(100, 100, 100, 255);
    const rare = rgba(200, 200, 200, 255);
    const result = reduceOklabClusterColors(
      [
        { color: common, pixelCount: 5, oklab: pixelColorToOklab(common) },
        { color: rare, pixelCount: 1, oklab: pixelColorToOklab(rare) },
      ],
      "mode",
    );
    expect(result).toBe(common);
  });

  it("picks highest chroma color for highChroma", () => {
    const gray = rgba(120, 120, 120, 255);
    const red = rgba(220, 20, 20, 255);
    const result = reduceOklabClusterColors(
      [
        { color: gray, pixelCount: 10, oklab: pixelColorToOklab(gray) },
        { color: red, pixelCount: 1, oklab: pixelColorToOklab(red) },
      ],
      "highChroma",
    );
    expect(result).toBe(red);
  });
});

describe("applyOklabMerge", () => {
  it("preserves transparent pixels", () => {
    const source = createImageData(
      [
        [255, 0, 0, 255],
        [0, 0, 0, 0],
      ],
      2,
    );
    const { imageData } = applyOklabMerge(source, { threshold: 0.05, reduceAlgorithm: "mode" });
    expect(pixelAt(imageData, 1, 0)).toEqual([0, 0, 0, 0]);
  });

  it("merges similar low-chroma palette colors", () => {
    const source = createImageData(
      [
        [10, 10, 10, 255],
        [12, 12, 12, 255],
        [14, 14, 14, 255],
      ],
      3,
    );
    const { imageData, groupCount } = applyOklabMerge(source, {
      threshold: 0.05,
      reduceAlgorithm: "mode",
    });
    expect(groupCount).toBe(1);
    const first = pixelAt(imageData, 0, 0);
    expect(pixelAt(imageData, 1, 0)).toEqual(first);
    expect(pixelAt(imageData, 2, 0)).toEqual(first);
  });

  it("keeps distinct high-chroma colors separate", () => {
    const source = createImageData(
      [
        [220, 20, 20, 255],
        [20, 20, 220, 255],
      ],
      2,
    );
    const { groupCount } = applyOklabMerge(source, {
      threshold: 0.035,
      reduceAlgorithm: "mode",
    });
    expect(groupCount).toBe(2);
  });

  it("uses highChroma representative within merged cluster", () => {
    const gray = rgba(120, 120, 120, 255);
    const redTint = rgba(130, 125, 125, 255);
    const source = createImageData(
      [
        [120, 120, 120, 255],
        [120, 120, 120, 255],
        [130, 125, 125, 255],
      ],
      3,
    );
    const { imageData } = applyOklabMerge(source, {
      threshold: 0.05,
      reduceAlgorithm: "highChroma",
    });
    const merged = pixelAt(imageData, 0, 0);
    expect(merged).toEqual([
      redTint & 0xff,
      (redTint >> 8) & 0xff,
      (redTint >> 16) & 0xff,
      255,
    ]);
    expect(pixelAt(imageData, 1, 0)).toEqual(merged);
    expect(pixelAt(imageData, 2, 0)).toEqual(merged);
    expect(merged).not.toEqual([
      gray & 0xff,
      (gray >> 8) & 0xff,
      (gray >> 16) & 0xff,
      255,
    ]);
  });
});
