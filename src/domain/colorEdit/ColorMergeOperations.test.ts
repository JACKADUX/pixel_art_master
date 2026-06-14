import { describe, expect, it } from "vitest";
import { rgba } from "../canvas/PixelColor";
import { createColorMergeAnchor } from "./ColorMergeAnchor";
import { applyColorMerge, reorderAnchors } from "./ColorMergeOperations";
import { computeColorPaletteStats } from "./ColorPaletteStats";

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

describe("ColorMergeOperations", () => {
  it("preserves transparent pixels", () => {
    const source = createImageData(
      [
        [255, 0, 0, 255],
        [0, 0, 0, 0],
      ],
      2,
    );
    const result = applyColorMerge(source, [
      createColorMergeAnchor(rgba(255, 0, 0, 255), 0.5),
    ]);
    expect(result.data[4]).toBe(0);
    expect(result.data[7]).toBe(0);
  });

  it("snaps matching pixels to anchor color", () => {
    const source = createImageData([[250, 10, 10, 255]], 1);
    const anchorColor = rgba(255, 0, 0, 255);
    const result = applyColorMerge(source, [createColorMergeAnchor(anchorColor, 0.3)]);
    expect(result.data[0]).toBe(255);
    expect(result.data[1]).toBe(0);
    expect(result.data[2]).toBe(0);
  });

  it("removes unmatched pixels by default", () => {
    const source = createImageData([[10, 250, 10, 255]], 1);
    const result = applyColorMerge(source, [
      createColorMergeAnchor(rgba(255, 0, 0, 255), 0.05),
    ]);
    expect(result.data[3]).toBe(0);
  });

  it("keeps unmatched pixels when configured", () => {
    const source = createImageData([[10, 250, 10, 255]], 1);
    const result = applyColorMerge(
      source,
      [createColorMergeAnchor(rgba(255, 0, 0, 255), 0.05)],
      { unmatchedPixelBehavior: "keep" },
    );
    expect(result.data[0]).toBe(10);
    expect(result.data[1]).toBe(250);
    expect(result.data[2]).toBe(10);
    expect(result.data[3]).toBe(255);
  });

  it("respects anchor priority order", () => {
    const source = createImageData([[250, 10, 10, 255]], 1);
    const red = rgba(255, 0, 0, 255);
    const orange = rgba(255, 128, 0, 255);
    const result = applyColorMerge(source, [
      createColorMergeAnchor(red, 0.5),
      createColorMergeAnchor(orange, 0.5),
    ]);
    expect(result.data[0]).toBe(255);
    expect(result.data[1]).toBe(0);
    expect(result.data[2]).toBe(0);
  });

  it("merges similar colors and reduces palette size", () => {
    const source = createImageData(
      [
        [250, 10, 10, 255],
        [240, 20, 15, 255],
        [10, 250, 10, 255],
      ],
      3,
    );
    const before = computeColorPaletteStats(source);
    const result = applyColorMerge(source, [
      createColorMergeAnchor(rgba(255, 0, 0, 255), 0.35),
      createColorMergeAnchor(rgba(0, 255, 0, 255), 0.35),
    ]);
    const after = computeColorPaletteStats(result);
    expect(before.uniqueCount).toBe(3);
    expect(after.uniqueCount).toBeLessThan(before.uniqueCount);
  });

  it("reorders anchors before a target index", () => {
    const a = { ...createColorMergeAnchor(rgba(255, 0, 0, 255), 0.2), id: "anchor-a" };
    const b = { ...createColorMergeAnchor(rgba(0, 255, 0, 255), 0.2), id: "anchor-b" };
    const c = { ...createColorMergeAnchor(rgba(0, 0, 255, 255), 0.2), id: "anchor-c" };
    expect(reorderAnchors([a, b, c], 0, 2).map((item) => item.id)).toEqual([
      "anchor-b",
      "anchor-a",
      "anchor-c",
    ]);
  });

  it("reorders anchors to the bottom", () => {
    const a = { ...createColorMergeAnchor(rgba(255, 0, 0, 255), 0.2), id: "anchor-a" };
    const b = { ...createColorMergeAnchor(rgba(0, 255, 0, 255), 0.2), id: "anchor-b" };
    const c = { ...createColorMergeAnchor(rgba(0, 0, 255, 255), 0.2), id: "anchor-c" };
    expect(reorderAnchors([a, b, c], 0, 3).map((item) => item.id)).toEqual([
      "anchor-b",
      "anchor-c",
      "anchor-a",
    ]);
  });

  it("returns original image when anchor list is empty", () => {
    const source = createImageData([[100, 120, 140, 255]], 1);
    const result = applyColorMerge(source, []);
    expect(result.data[0]).toBe(100);
    expect(result.data[1]).toBe(120);
    expect(result.data[2]).toBe(140);
  });
});
