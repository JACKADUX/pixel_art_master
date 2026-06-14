import { describe, expect, it } from "vitest";
import { rgba } from "../canvas/PixelColor";
import { circularHueDelta, mergeVectorDistance, pixelToMergeVector } from "./MergeColorVector";

describe("MergeColorVector", () => {
  it("computes circular hue delta", () => {
    expect(circularHueDelta(359, 1)).toBe(2);
    expect(circularHueDelta(10, 350)).toBe(20);
  });

  it("ignores hue for achromatic colors", () => {
    const gray = pixelToMergeVector(rgba(128, 128, 128, 255));
    const white = pixelToMergeVector(rgba(255, 255, 255, 255));
    const colorful = pixelToMergeVector(rgba(255, 0, 0, 255));
    expect(mergeVectorDistance(gray, white)).toBeLessThan(mergeVectorDistance(colorful, white));
  });
});
