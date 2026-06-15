import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import { typeScriptColorEditProcessor } from "@/infrastructure/colorEdit/TypeScriptColorEditProcessor";

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

describe("TypeScriptColorEditProcessor", () => {
  it("runs the full color edit pipeline", async () => {
    const source = createImageData(
      [
        [10, 10, 10, 255],
        [12, 12, 12, 255],
        [14, 14, 14, 255],
      ],
      3,
    );

    const result = await typeScriptColorEditProcessor.applyColorEdit({
      sourceImageData: source,
      options: { threshold: 0.05, reduceAlgorithm: "mode" },
    });

    expect(result.mergeGroupCount).toBe(1);
    expect(result.statsBefore.uniqueCount).toBe(3);
    expect(result.statsAfter.uniqueCount).toBe(1);
    const first = pixelAt(result.resultImageData, 0, 0);
    expect(pixelAt(result.resultImageData, 1, 0)).toEqual(first);
    expect(pixelAt(result.resultImageData, 2, 0)).toEqual(first);
  });

  it("applies manual anchors and disabled colors", async () => {
    const red = rgba(220, 20, 20, 255);
    const blue = rgba(20, 20, 220, 255);
    const source = createImageData(
      [
        [220, 20, 20, 255],
        [20, 20, 220, 255],
      ],
      2,
    );

    const result = await typeScriptColorEditProcessor.applyColorEdit({
      sourceImageData: source,
      options: { threshold: 0.035, reduceAlgorithm: "mode" },
      manualAnchors: [{ id: "anchor-1", color: red, threshold: 0.05 }],
      disabledColors: [blue],
    });

    expect(result.mergeGroupCount).toBe(2);
    expect(result.statsAfter.uniqueCount).toBe(1);
    expect(pixelAt(result.resultImageData, 0, 0)).toEqual([220, 20, 20, 255]);
    expect(pixelAt(result.resultImageData, 1, 0)).toEqual([220, 20, 20, 255]);
  });
});
