import { describe, expect, it } from "vitest";
import { rgba, TRANSPARENT } from "./PixelColor";
import { PixelGrid } from "./PixelGrid";

describe("PixelGrid.blitOnto", () => {
  it("writes non-transparent source pixels at offset", () => {
    const target = PixelGrid.createEmpty(4, 4);
    const source = PixelGrid.createEmpty(2, 2);
    source.setPixel(0, 0, rgba(255, 0, 0, 255));
    source.setPixel(1, 1, rgba(0, 255, 0, 255));

    target.blitOnto(source, 1, 1);

    expect(target.getPixel(1, 1)).toBe(rgba(255, 0, 0, 255));
    expect(target.getPixel(2, 2)).toBe(rgba(0, 255, 0, 255));
    expect(target.getPixel(0, 0)).toBe(TRANSPARENT);
  });

  it("clips pixels outside target bounds", () => {
    const target = PixelGrid.createEmpty(2, 2);
    const source = PixelGrid.createEmpty(3, 3);
    source.setPixel(2, 2, rgba(255, 0, 0, 255));

    target.blitOnto(source, 1, 1);

    expect(target.getPixel(0, 0)).toBe(TRANSPARENT);
    expect(target.getPixel(1, 1)).toBe(TRANSPARENT);
  });
});
