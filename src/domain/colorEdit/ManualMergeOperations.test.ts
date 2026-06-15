import { describe, expect, it } from "vitest";
import { rgba } from "../canvas/PixelColor";
import { createManualMergeAnchor } from "./ManualMergeAnchor";
import { applyManualMergeOverlays } from "./ManualMergeOperations";

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

describe("applyManualMergeOverlays", () => {
  it("returns merged image unchanged when no anchors", () => {
    const source = createImageData([[255, 0, 0, 255]], 1);
    const merged = createImageData([[128, 128, 128, 255]], 1);
    const result = applyManualMergeOverlays(source, merged, []);
    expect(result).toBe(merged);
  });

  it("restores anchor color for similar source pixels", () => {
    const anchorColor = rgba(220, 20, 20, 255);
    const similar = rgba(215, 18, 18, 255);
    const different = rgba(20, 20, 220, 255);

    const source = createImageData(
      [
        [215, 18, 18, 255],
        [20, 20, 220, 255],
      ],
      2,
    );
    const merged = createImageData(
      [
        [128, 128, 128, 255],
        [128, 128, 128, 255],
      ],
      2,
    );

    const result = applyManualMergeOverlays(source, merged, [
      createManualMergeAnchor(anchorColor, 0.05),
    ]);

    expect(pixelAt(result, 0, 0)).toEqual([220, 20, 20, 255]);
    expect(pixelAt(result, 1, 0)).toEqual([128, 128, 128, 255]);
    expect(similar).not.toBe(anchorColor);
    expect(different).not.toBe(anchorColor);
  });

  it("preserves transparent pixels", () => {
    const source = createImageData([[255, 0, 0, 255], [0, 0, 0, 0]], 2);
    const merged = createImageData([[100, 100, 100, 255], [50, 50, 50, 0]], 2);
    const anchorColor = rgba(255, 0, 0, 255);

    const result = applyManualMergeOverlays(source, merged, [
      createManualMergeAnchor(anchorColor, 0.05),
    ]);

    expect(pixelAt(result, 0, 0)).toEqual([255, 0, 0, 255]);
    expect(pixelAt(result, 1, 0)).toEqual([50, 50, 50, 0]);
  });

  it("applies anchors in order with later anchors overriding earlier", () => {
    const firstAnchor = rgba(200, 10, 10, 255);
    const secondAnchor = rgba(205, 12, 12, 255);

    const source = createImageData([[200, 10, 10, 255]], 1);
    const merged = createImageData([[128, 128, 128, 255]], 1);

    const secondWinsLast = applyManualMergeOverlays(source, merged, [
      createManualMergeAnchor(firstAnchor, 0.05),
      createManualMergeAnchor(secondAnchor, 0.05),
    ]);
    expect(pixelAt(secondWinsLast, 0, 0)).toEqual([205, 12, 12, 255]);

    const firstWinsLast = applyManualMergeOverlays(source, merged, [
      createManualMergeAnchor(secondAnchor, 0.05),
      createManualMergeAnchor(firstAnchor, 0.05),
    ]);
    expect(pixelAt(firstWinsLast, 0, 0)).toEqual([200, 10, 10, 255]);
  });

  it("does not match when threshold is too small", () => {
    const anchorColor = rgba(255, 0, 0, 255);
    const source = createImageData([[200, 10, 10, 255]], 1);
    const merged = createImageData([[128, 128, 128, 255]], 1);

    const result = applyManualMergeOverlays(source, merged, [
      createManualMergeAnchor(anchorColor, 0.02),
    ]);

    expect(pixelAt(result, 0, 0)).toEqual([128, 128, 128, 255]);
  });
});
