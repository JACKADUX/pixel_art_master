import { describe, expect, it } from "vitest";
import {
  clampExcludeRingCount,
  computeEffectiveExcludeRing,
  computeMaxExcludeRing,
  getCenterPriorityInnerBounds,
  shouldApplyCenterPriority,
} from "./GridMergeCenterPriority";

describe("GridMergeCenterPriority", () => {
  it("computes max exclude ring for various cell sizes", () => {
    expect(computeMaxExcludeRing(5, 5)).toBe(2);
    expect(computeMaxExcludeRing(4, 4)).toBe(1);
    expect(computeMaxExcludeRing(3, 3)).toBe(1);
    expect(computeMaxExcludeRing(2, 2)).toBe(0);
    expect(computeMaxExcludeRing(1, 1)).toBe(0);
  });

  it("clamps requested ring to valid range and cell capacity", () => {
    expect(computeEffectiveExcludeRing(5, 5, 2)).toBe(2);
    expect(computeEffectiveExcludeRing(3, 3, 2)).toBe(1);
    expect(computeEffectiveExcludeRing(2, 2, 2)).toBe(0);
    expect(computeEffectiveExcludeRing(5, 5, 9)).toBe(2);
    expect(computeEffectiveExcludeRing(5, 5, -1)).toBe(0);
  });

  it("returns inner bounds for center sampling", () => {
    expect(getCenterPriorityInnerBounds(5, 5, 2)).toEqual({
      insetLeft: 2,
      insetTop: 2,
      innerWidth: 1,
      innerHeight: 1,
    });
    expect(getCenterPriorityInnerBounds(3, 3, 2)).toEqual({
      insetLeft: 1,
      insetTop: 1,
      innerWidth: 1,
      innerHeight: 1,
    });
    expect(getCenterPriorityInnerBounds(2, 2, 2)).toEqual({
      insetLeft: 0,
      insetTop: 0,
      innerWidth: 2,
      innerHeight: 2,
    });
  });

  it("clamps exclude ring count for preferences", () => {
    expect(clampExcludeRingCount(2)).toBe(2);
    expect(clampExcludeRingCount(9)).toBe(5);
    expect(clampExcludeRingCount(-3)).toBe(0);
    expect(clampExcludeRingCount("bad", 2)).toBe(2);
  });

  it("applies center priority only when enabled with positive ring", () => {
    expect(shouldApplyCenterPriority({ enabled: false, excludeRingCount: 2 })).toBe(false);
    expect(shouldApplyCenterPriority({ enabled: true, excludeRingCount: 0 })).toBe(false);
    expect(shouldApplyCenterPriority({ enabled: true, excludeRingCount: 2 })).toBe(true);
    expect(shouldApplyCenterPriority(undefined)).toBe(false);
  });
});
