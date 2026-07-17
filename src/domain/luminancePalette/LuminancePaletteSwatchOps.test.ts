import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import { createEmptyLuminancePalette } from "./LuminancePalette";
import {
  finalizeLiveEditSwatch,
  replaceLuminanceSwatchColorLive,
  setLuminanceSwatchColorAtIndex,
} from "./LuminancePalette";
import { createLuminancePaletteGroup } from "./LuminancePaletteGroup";
import { createLuminancePaletteSwatch } from "./LuminancePaletteSwatch";

describe("setLuminanceSwatchColorAtIndex", () => {
  const dark = createLuminancePaletteSwatch(rgba(20, 20, 20));
  const mid = createLuminancePaletteSwatch(rgba(128, 128, 128));
  const light = createLuminancePaletteSwatch(rgba(240, 240, 240));
  const group = createLuminancePaletteGroup([light, mid, dark], "测试", "g1");

  it("replaces color at index and resorts by default", () => {
    const palette = { ...createEmptyLuminancePalette(), groups: [group] };
    const red = rgba(255, 0, 0);
    const result = setLuminanceSwatchColorAtIndex(palette, "g1", 1, red);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.palette.groups[0]?.colors).toHaveLength(3);
    expect(
      result.palette.groups[0]?.colors.some((s) => s.hex.startsWith("#ff0000")),
    ).toBe(true);
  });

  it("appends at trailing index", () => {
    const palette = { ...createEmptyLuminancePalette(), groups: [group] };
    const green = rgba(0, 255, 0);
    const result = setLuminanceSwatchColorAtIndex(palette, "g1", 3, green);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.palette.groups[0]?.colors).toHaveLength(4);
  });

  it("does not create duplicate colors when appending existing foreground", () => {
    const palette = { ...createEmptyLuminancePalette(), groups: [group] };
    const result = setLuminanceSwatchColorAtIndex(palette, "g1", 3, light.color);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.palette.groups[0]?.colors).toHaveLength(3);
    const lightCount = result.palette.groups[0]?.colors.filter((s) =>
      s.hex.startsWith("#f0f0f0"),
    ).length;
    expect(lightCount).toBe(1);
  });

  it("coerces non-trailing empty slot index to append", () => {
    const palette = { ...createEmptyLuminancePalette(), groups: [group] };
    const green = rgba(0, 255, 0);
    const result = setLuminanceSwatchColorAtIndex(palette, "g1", 9, green);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.palette.groups[0]?.colors).toHaveLength(4);
  });
});

describe("replaceLuminanceSwatchColorLive", () => {
  it("does not resort during live edit", () => {
    const swatches = [
      createLuminancePaletteSwatch(rgba(240, 240, 240)),
      createLuminancePaletteSwatch(rgba(128, 128, 128)),
    ];
    const group = createLuminancePaletteGroup(swatches, "测试", "g1");
    const palette = { ...createEmptyLuminancePalette(), groups: [group] };
    const dark = rgba(10, 10, 10);

    const live = replaceLuminanceSwatchColorLive(palette, "g1", 0, dark);
    expect(live.ok).toBe(true);
    if (!live.ok) return;
    expect(live.palette.groups[0]?.colors[0]?.hex.startsWith("#0a0a0a")).toBe(true);
    expect(live.palette.groups[0]?.colors[1]?.hex).toBe(swatches[1]!.hex);
  });
});

describe("finalizeLiveEditSwatch", () => {
  it("resorts group after live edit ends", () => {
    const swatches = [
      createLuminancePaletteSwatch(rgba(240, 240, 240)),
      createLuminancePaletteSwatch(rgba(10, 10, 10)),
    ];
    const group = createLuminancePaletteGroup(swatches, "测试", "g1");
    const palette = { ...createEmptyLuminancePalette(), groups: [group] };
    const finalized = finalizeLiveEditSwatch(palette, "g1");
    expect(finalized.groups[0]?.colors[0]?.hex.startsWith("#f0f0f0")).toBe(true);
    expect(finalized.groups[0]?.colors[1]?.hex.startsWith("#0a0a0a")).toBe(true);
  });
});
