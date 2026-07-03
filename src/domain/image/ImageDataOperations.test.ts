import { describe, expect, it } from "vitest";
import { cloneImageData, cropImageData } from "./ImageDataOperations";

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

describe("cropImageData", () => {
  // 2x2 图像：红、绿 / 蓝、白
  const source = createImageData(2, 2, [
    255, 0, 0, 255, 0, 255, 0, 255,
    0, 0, 255, 255, 255, 255, 255, 255,
  ]);

  it("裁剪出指定矩形区域的像素", () => {
    const cropped = cropImageData(source, { x: 1, y: 0, width: 1, height: 2 });
    expect(cropped).not.toBeNull();
    expect(cropped!.width).toBe(1);
    expect(cropped!.height).toBe(2);
    expect(Array.from(cropped!.data)).toEqual([0, 255, 0, 255, 255, 255, 255, 255]);
  });

  it("超出范围的尺寸会被夹紧到图像边界", () => {
    const cropped = cropImageData(source, { x: 0, y: 0, width: 10, height: 10 });
    expect(cropped!.width).toBe(2);
    expect(cropped!.height).toBe(2);
  });

  it("零尺寸或完全越界时返回 null", () => {
    expect(cropImageData(source, { x: 0, y: 0, width: 0, height: 5 })).toBeNull();
    expect(cropImageData(source, { x: 5, y: 5, width: 2, height: 2 })).toBeNull();
  });
});
