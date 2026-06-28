import { describe, expect, it } from "vitest";
import {
  computeRatioSize,
  deriveRatioState,
  findAspectRatioPreset,
  swapDimensions,
} from "./RatioSize";

describe("computeRatioSize", () => {
  it("将最大边分配给较长一侧（横向）", () => {
    expect(computeRatioSize({ w: 16, h: 9 }, 1920, "landscape")).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it("竖向时长短边互换", () => {
    expect(computeRatioSize({ w: 16, h: 9 }, 1920, "portrait")).toEqual({
      width: 1080,
      height: 1920,
    });
  });

  it("1:1 比例两边相等", () => {
    expect(computeRatioSize({ w: 1, h: 1 }, 512, "landscape")).toEqual({
      width: 512,
      height: 512,
    });
  });

  it("可对齐到 step 的整数倍", () => {
    const result = computeRatioSize({ w: 3, h: 2 }, 1000, "landscape", 8);
    expect(result.width % 8).toBe(0);
    expect(result.height % 8).toBe(0);
  });
});

describe("swapDimensions", () => {
  it("交换宽高", () => {
    expect(swapDimensions({ width: 1920, height: 1080 })).toEqual({
      width: 1080,
      height: 1920,
    });
  });
});

describe("deriveRatioState", () => {
  it("宽 >= 高 推断为横向", () => {
    expect(deriveRatioState(1920, 1080)).toEqual({
      orientation: "landscape",
      maxEdge: 1920,
    });
  });

  it("高 > 宽 推断为竖向", () => {
    expect(deriveRatioState(768, 1024)).toEqual({
      orientation: "portrait",
      maxEdge: 1024,
    });
  });
});

describe("findAspectRatioPreset", () => {
  it("可按 id 查找", () => {
    expect(findAspectRatioPreset("4:3")).toMatchObject({ w: 4, h: 3 });
  });

  it("未知 id 返回 undefined", () => {
    expect(findAspectRatioPreset("nope")).toBeUndefined();
  });
});
