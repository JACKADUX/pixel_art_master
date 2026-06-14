import { describe, expect, it } from "vitest";
import { createRestoreScale } from "./RestoreScale";
import {
  canApplyFixedScaleRestore,
  computeRestoreOutputSize,
  resolveDefaultRestoreScale,
  validateFixedScaleRestore,
} from "./FixedScaleRestoreOperations";

describe("FixedScaleRestoreOperations", () => {
  const source = { width: 128, height: 96 };

  it("computes output size from source and scale", () => {
    const scale = createRestoreScale(4);
    expect(computeRestoreOutputSize(source, scale)).toEqual({
      width: 32,
      height: 24,
    });
  });

  it("accepts evenly divisible dimensions", () => {
    const scale = createRestoreScale(4);
    expect(canApplyFixedScaleRestore(source, scale)).toBe(true);
  });

  it("rejects dimensions that do not divide evenly", () => {
    const scale = createRestoreScale(5);
    expect(canApplyFixedScaleRestore(source, scale)).toBe(false);
  });

  it("validates and returns output size", () => {
    const scale = createRestoreScale(2);
    expect(validateFixedScaleRestore(source, scale)).toEqual({
      width: 64,
      height: 48,
    });
  });

  it("throws when scale does not divide source dimensions", () => {
    const scale = createRestoreScale(3);
    expect(() => validateFixedScaleRestore(source, scale)).toThrow(
      /not evenly divisible/,
    );
  });

  it("uses detected scale when valid", () => {
    expect(resolveDefaultRestoreScale(4, source)).toBe(4);
  });

  it("falls back to 2 when detected scale is invalid for source", () => {
    expect(resolveDefaultRestoreScale(5, source)).toBe(2);
    expect(resolveDefaultRestoreScale(1, source)).toBe(2);
  });
});
