import { describe, expect, it } from "vitest";
import { cloneImageData } from "./ImageDataOperations";

function createImageData(width: number, height: number, pixels: number[]): ImageData {
  return { width, height, data: new Uint8ClampedArray(pixels), colorSpace: "srgb" } as ImageData;
}

describe("cloneImageData", () => {
  it("creates a deep copy of pixel data", () => {
    const source = createImageData(2, 1, [255, 0, 0, 255, 0, 255, 0, 255]);

    const clone = cloneImageData(source);

    expect(clone).not.toBe(source);
    expect(clone.data).not.toBe(source.data);
    expect(clone.width).toBe(source.width);
    expect(clone.height).toBe(source.height);
    expect(Array.from(clone.data)).toEqual(Array.from(source.data));

    clone.data[0] = 0;
    expect(source.data[0]).toBe(255);
  });
});
