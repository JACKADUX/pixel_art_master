import { describe, expect, it } from "vitest";
import { createOklab } from "./OklabColor";
import {
  OKLCH_MAX_CHROMA,
  createOklch,
  oklabToOklch,
  oklchToOklab,
} from "./OklchColor";

describe("createOklch", () => {
  it("clamps lightness and chroma, and normalizes hue", () => {
    expect(createOklch(2, OKLCH_MAX_CHROMA + 1, -30)).toEqual({
      l: 1,
      c: OKLCH_MAX_CHROMA,
      h: 330,
    });
  });
});

describe("OKLab and OKLCH conversion", () => {
  it("converts OKLab to OKLCH", () => {
    const oklch = oklabToOklch(createOklab(0.5, 0.2, 0.2));

    expect(oklch.l).toBeCloseTo(0.5, 5);
    expect(oklch.c).toBeCloseTo(Math.hypot(0.2, 0.2), 5);
    expect(oklch.h).toBeCloseTo(45, 5);
  });

  it("roundtrips through OKLCH", () => {
    const source = createOklab(0.62, 0.12, -0.08);
    const result = oklchToOklab(oklabToOklch(source));

    expect(result.l).toBeCloseTo(source.l, 5);
    expect(result.a).toBeCloseTo(source.a, 5);
    expect(result.b).toBeCloseTo(source.b, 5);
  });
});
