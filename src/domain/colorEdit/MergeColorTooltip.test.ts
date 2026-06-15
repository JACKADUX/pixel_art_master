import { describe, expect, it } from "vitest";
import { rgba } from "../canvas/PixelColor";
import { formatMergeColorSwatchTooltip } from "./MergeColorTooltip";

describe("formatMergeColorSwatchTooltip", () => {
  it("includes hex, hsl hue/saturation, and oklab lightness", () => {
    const tooltip = formatMergeColorSwatchTooltip(rgba(255, 0, 0, 255));
    expect(tooltip).toContain("#ff0000ff");
    expect(tooltip).toContain("H:");
    expect(tooltip).toContain("S:");
    expect(tooltip).toContain("Oklab L:");
  });
});
