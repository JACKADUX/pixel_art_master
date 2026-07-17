import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import { createLuminancePaletteGroup } from "./LuminancePaletteGroup";
import { createLuminancePaletteSwatch } from "./LuminancePaletteSwatch";
import {
  navigateGroupColor,
  pickColorByShortcutIndex,
  pickFirstColorInGroup,
  pickGroupByShortcutIndex,
  resolveActiveGroup,
  shortcutKeyToGroupIndex,
  shortcutKeyToSwatchIndex,
  swatchIndexToShortcutLabel,
} from "./LuminancePaletteNavigation";

describe("shortcut mapping", () => {
  it("maps digit keys to swatch indices", () => {
    expect(shortcutKeyToSwatchIndex("1")).toBe(0);
    expect(shortcutKeyToSwatchIndex("9")).toBe(8);
    expect(shortcutKeyToSwatchIndex("0")).toBe(9);
    expect(shortcutKeyToSwatchIndex("a")).toBeNull();
  });

  it("maps Alt+digit keys to group indices", () => {
    expect(shortcutKeyToGroupIndex("1")).toBe(0);
    expect(shortcutKeyToGroupIndex("9")).toBe(8);
    expect(shortcutKeyToGroupIndex("0")).toBeNull();
  });

  it("maps swatch indices to shortcut labels", () => {
    expect(swatchIndexToShortcutLabel(0)).toBe("1");
    expect(swatchIndexToShortcutLabel(8)).toBe("9");
    expect(swatchIndexToShortcutLabel(9)).toBe("0");
  });
});

describe("resolveActiveGroup", () => {
  const light = createLuminancePaletteSwatch(rgba(240, 240, 240));
  const dark = createLuminancePaletteSwatch(rgba(20, 20, 20));
  const groupA = createLuminancePaletteGroup([light], "A", "group-a");
  const groupB = createLuminancePaletteGroup([dark], "B", "group-b");

  it("prefers group containing foreground color", () => {
    const active = resolveActiveGroup([groupA, groupB], dark.color, "group-a");
    expect(active?.id).toBe("group-b");
  });

  it("falls back to activeGroupId then first group", () => {
    const unknown = rgba(1, 2, 3);
    expect(resolveActiveGroup([groupA, groupB], unknown, "group-b")?.id).toBe("group-b");
    expect(resolveActiveGroup([groupA, groupB], unknown, null)?.id).toBe("group-a");
  });
});

describe("navigateGroupColor", () => {
  const swatches = [
    createLuminancePaletteSwatch(rgba(240, 240, 240)),
    createLuminancePaletteSwatch(rgba(128, 128, 128)),
    createLuminancePaletteSwatch(rgba(20, 20, 20)),
  ];
  const group = createLuminancePaletteGroup(swatches);

  it("cycles forward and backward within group", () => {
    expect(navigateGroupColor(group, swatches[0]!.color, "next")?.toString(16)).toBe(
      swatches[1]!.color.toString(16),
    );
    expect(navigateGroupColor(group, swatches[0]!.color, "prev")?.toString(16)).toBe(
      swatches[2]!.color.toString(16),
    );
  });

  it("returns null when current color is not in group", () => {
    expect(navigateGroupColor(group, rgba(1, 2, 3), "next")).toBeNull();
  });
});

describe("pickColorByShortcutIndex", () => {
  it("returns color at shortcut index", () => {
    const swatch = createLuminancePaletteSwatch(rgba(255, 0, 0));
    const group = createLuminancePaletteGroup([swatch]);
    expect(pickColorByShortcutIndex(group, 0)?.toString(16)).toBe(swatch.color.toString(16));
    expect(pickColorByShortcutIndex(group, 9)).toBeNull();
  });
});

describe("pickFirstColorInGroup", () => {
  it("returns first swatch color when group has colors", () => {
    const swatch = createLuminancePaletteSwatch(rgba(255, 0, 0));
    const group = createLuminancePaletteGroup([swatch]);
    expect(pickFirstColorInGroup(group)?.toString(16)).toBe(swatch.color.toString(16));
  });

  it("returns null for empty group", () => {
    const group = createLuminancePaletteGroup([]);
    expect(pickFirstColorInGroup(group)).toBeNull();
  });
});

describe("pickGroupByShortcutIndex", () => {
  it("returns group at shortcut index", () => {
    const groupA = createLuminancePaletteGroup([], "A", "a");
    const groupB = createLuminancePaletteGroup([], "B", "b");
    expect(pickGroupByShortcutIndex([groupA, groupB], 0)?.id).toBe("a");
    expect(pickGroupByShortcutIndex([groupA, groupB], 1)?.id).toBe("b");
    expect(pickGroupByShortcutIndex([groupA], 1)).toBeNull();
  });
});
