import { describe, expect, it } from "vitest";
import {
  clampCameraAngle,
  computeForeshortenedSecondarySpan,
  computeForeshortenedSpan,
  DEFAULT_ORTHOGRAPHIC_VIEW,
  resolveOrthographicAngle,
} from "./OrthographicView";

describe("OrthographicView", () => {
  it("clamps camera angle to 1-89 with one decimal place", () => {
    expect(clampCameraAngle(0)).toBe(1);
    expect(clampCameraAngle(45.64)).toBe(45.6);
    expect(clampCameraAngle(63.55)).toBe(63.6);
    expect(clampCameraAngle(100)).toBe(89);
  });

  it("computes foreshortened span with angle 90 equal to width", () => {
    expect(computeForeshortenedSpan(16, 90)).toBe(16);
  });

  it("computes foreshortened span with angle 45", () => {
    expect(computeForeshortenedSpan(16, 45)).toBe(11);
  });

  it("enforces minimum span of 1", () => {
    expect(computeForeshortenedSpan(16, 1)).toBe(1);
  });

  it("derives secondary span from primary foreshortening ratio", () => {
    expect(computeForeshortenedSecondarySpan(16, 8, 45)).toBe(6);
    expect(computeForeshortenedSecondarySpan(16, 8, 90)).toBe(8);
  });

  it("keeps secondary subdivisions aligned when rounding differs", () => {
    const primarySpanY = computeForeshortenedSpan(16, 25);
    const secondarySpanY = computeForeshortenedSecondarySpan(16, 8, 25);
    expect(secondarySpanY).toBe(Math.round((primarySpanY * 8) / 16));
  });

  it("resolves angle as 90 when disabled", () => {
    expect(resolveOrthographicAngle(DEFAULT_ORTHOGRAPHIC_VIEW)).toBe(90);
  });

  it("resolves configured angle when enabled", () => {
    expect(
      resolveOrthographicAngle({ enabled: true, cameraAngle: 30 }),
    ).toBe(30);
  });
});
