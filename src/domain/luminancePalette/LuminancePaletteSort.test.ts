import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import { createLuminancePaletteSwatch } from "./LuminancePaletteSwatch";
import { sortSwatchesByOklchLightnessDesc } from "./LuminancePaletteSort";

describe("sortSwatchesByOklchLightnessDesc", () => {
  it("sorts by OKLCH lightness descending with stable order for equal L", () => {
    const dark = createLuminancePaletteSwatch(rgba(20, 20, 20));
    const mid = createLuminancePaletteSwatch(rgba(128, 128, 128));
    const light = createLuminancePaletteSwatch(rgba(240, 240, 240));

    const sorted = sortSwatchesByOklchLightnessDesc([dark, light, mid]);
    expect(sorted.map((swatch) => swatch.hex)).toEqual([
      light.hex,
      mid.hex,
      dark.hex,
    ]);
  });
});
