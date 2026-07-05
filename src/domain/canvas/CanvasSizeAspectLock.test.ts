import { describe, expect, it } from "vitest";
import {
  computeAspectLockedSize,
  computeAspectRatio,
} from "./CanvasSizeAspectLock";

describe("CanvasSizeAspectLock", () => {
  it("computes aspect ratio from width and height", () => {
    expect(computeAspectRatio(128, 64)).toBe(2);
    expect(computeAspectRatio(64, 128)).toBe(0.5);
  });

  it("keeps width and recalculates height when width changes", () => {
    expect(computeAspectLockedSize("width", 128, 2)).toEqual({
      width: 128,
      height: 64,
    });
  });

  it("keeps height and recalculates width when height changes", () => {
    expect(computeAspectLockedSize("height", 64, 2)).toEqual({
      width: 128,
      height: 64,
    });
  });

  it("clamps dimensions to valid range", () => {
    expect(computeAspectLockedSize("width", 5000, 1)).toEqual({
      width: 4096,
      height: 4096,
    });
    expect(computeAspectLockedSize("height", 0, 2)).toEqual({
      width: 2,
      height: 1,
    });
  });
});
