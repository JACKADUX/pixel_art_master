import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import { createEmptyLuminancePalette } from "./LuminancePalette";
import { createLuminancePaletteGroup } from "./LuminancePaletteGroup";
import { createLuminancePaletteSwatch } from "./LuminancePaletteSwatch";
import {
  finalizeLuminancePalette,
  filterOpaqueSwatches,
  moveLuminancePaletteGroup,
  pruneEmptyLuminancePaletteGroups,
} from "./LuminancePaletteSanitize";

describe("filterOpaqueSwatches", () => {
  it("removes transparent swatches", () => {
    const opaque = createLuminancePaletteSwatch(rgba(255, 0, 0));
    const transparent = createLuminancePaletteSwatch(rgba(0, 0, 0, 0));
    expect(filterOpaqueSwatches([opaque, transparent]).map((s) => s.hex)).toEqual([opaque.hex]);
  });
});

describe("pruneEmptyLuminancePaletteGroups", () => {
  it("removes groups with no opaque colors", () => {
    const empty = createLuminancePaletteGroup([], "空组", "g-empty");
    const filled = createLuminancePaletteGroup(
      [createLuminancePaletteSwatch(rgba(128, 128, 128))],
      "有色",
      "g-filled",
    );
    const palette = {
      ...createEmptyLuminancePalette(),
      groups: [empty, filled],
      activeGroupId: "g-empty",
    };

    const pruned = pruneEmptyLuminancePaletteGroups(palette);
    expect(pruned.groups).toHaveLength(1);
    expect(pruned.groups[0]?.id).toBe("g-filled");
    expect(pruned.activeGroupId).toBe("g-filled");
  });
});

describe("moveLuminancePaletteGroup", () => {
  it("swaps group order", () => {
    const g1 = createLuminancePaletteGroup(
      [createLuminancePaletteSwatch(rgba(255, 0, 0))],
      "A",
      "g1",
    );
    const g2 = createLuminancePaletteGroup(
      [createLuminancePaletteSwatch(rgba(0, 255, 0))],
      "B",
      "g2",
    );
    const palette = { ...createEmptyLuminancePalette(), groups: [g1, g2] };

    const moved = moveLuminancePaletteGroup(palette, "g2", "left");
    expect(moved.groups.map((group) => group.id)).toEqual(["g2", "g1"]);
  });
});

describe("finalizeLuminancePalette", () => {
  it("keeps empty groups in edit mode", () => {
    const empty = createLuminancePaletteGroup([], "空", "g1");
    const palette = { ...createEmptyLuminancePalette(), groups: [empty] };
    const result = finalizeLuminancePalette(palette, { keepEmptyGroups: true });
    expect(result.groups).toHaveLength(1);
  });
});
