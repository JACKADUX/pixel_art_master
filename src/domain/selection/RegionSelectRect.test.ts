import { describe, expect, it } from "vitest";
import {
  hitTestRegionCornerHandle,
  moveRegionRect,
  normalizeRegionRect,
  resizeRegionFromCornerHandle,
  resizeRegionRect,
} from "./RegionSelectRect";

const IMAGE = { width: 100, height: 80 };

describe("normalizeRegionRect", () => {
  it("从任意拖拽方向归一化出左上角与正向尺寸", () => {
    expect(normalizeRegionRect({ x: 30, y: 40 }, { x: 10, y: 20 })).toEqual({
      x: 10,
      y: 20,
      width: 20,
      height: 20,
    });
  });

  it("零尺寸拖拽时保底为最小 1px", () => {
    expect(normalizeRegionRect({ x: 5, y: 5 }, { x: 5, y: 5 })).toEqual({
      x: 5,
      y: 5,
      width: 1,
      height: 1,
    });
  });
});

describe("moveRegionRect", () => {
  it("平移选框并保持尺寸不变", () => {
    expect(moveRegionRect({ x: 10, y: 10, width: 20, height: 20 }, 5, -3, IMAGE)).toEqual({
      x: 15,
      y: 7,
      width: 20,
      height: 20,
    });
  });

  it("移动到边界时被夹紧，不超出图像", () => {
    expect(moveRegionRect({ x: 90, y: 70, width: 20, height: 20 }, 50, 50, IMAGE)).toEqual({
      x: 80,
      y: 60,
      width: 20,
      height: 20,
    });
    expect(moveRegionRect({ x: 5, y: 5, width: 20, height: 20 }, -50, -50, IMAGE)).toEqual({
      x: 0,
      y: 0,
      width: 20,
      height: 20,
    });
  });
});

describe("resizeRegionRect", () => {
  it("固定左上角伸缩右下角", () => {
    expect(resizeRegionRect({ x: 10, y: 10, width: 20, height: 20 }, 5, -4, IMAGE)).toEqual({
      x: 10,
      y: 10,
      width: 25,
      height: 16,
    });
  });

  it("尺寸不会小于 1px", () => {
    expect(resizeRegionRect({ x: 10, y: 10, width: 2, height: 2 }, -10, -10, IMAGE)).toEqual({
      x: 10,
      y: 10,
      width: 1,
      height: 1,
    });
  });
});

describe("hitTestRegionCornerHandle", () => {
  const rect = { x: 10, y: 10, width: 40, height: 30 };

  it("命中四个角点", () => {
    expect(hitTestRegionCornerHandle({ x: 10, y: 10 }, rect, 1)).toBe("topLeft");
    expect(hitTestRegionCornerHandle({ x: 50, y: 10 }, rect, 1)).toBe("topRight");
    expect(hitTestRegionCornerHandle({ x: 10, y: 40 }, rect, 1)).toBe("bottomLeft");
    expect(hitTestRegionCornerHandle({ x: 50, y: 40 }, rect, 1)).toBe("bottomRight");
  });

  it("远离角点时返回 null", () => {
    expect(hitTestRegionCornerHandle({ x: 30, y: 25 }, rect, 1)).toBeNull();
  });
});

describe("resizeRegionFromCornerHandle", () => {
  const rect = { x: 10, y: 10, width: 40, height: 30 };

  it("拖拽右下角扩大选框", () => {
    expect(
      resizeRegionFromCornerHandle(rect, "bottomRight", { x: 70, y: 60 }, IMAGE),
    ).toEqual({ x: 10, y: 10, width: 60, height: 50 });
  });

  it("拖拽左上角移动起点并保持右下角不动", () => {
    expect(
      resizeRegionFromCornerHandle(rect, "topLeft", { x: 5, y: 5 }, IMAGE),
    ).toEqual({ x: 5, y: 5, width: 45, height: 35 });
  });

  it("越过对角点时保底最小尺寸", () => {
    const result = resizeRegionFromCornerHandle(rect, "topLeft", { x: 999, y: 999 }, IMAGE);
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });
});
