import { describe, expect, it } from "vitest";
import { rgba } from "@/domain/canvas/PixelColor";
import {
  addColorToLuminanceGroup,
  createEmptyLuminancePalette,
  luminancePaletteFromJSON,
  luminancePaletteToJSON,
} from "./LuminancePalette";
import { createLuminancePaletteGroup } from "./LuminancePaletteGroup";
import { createLuminancePaletteSwatch } from "./LuminancePaletteSwatch";
import { createLuminancePalettePreset } from "./LuminancePalettePreset";

describe("LuminancePalette serialization", () => {
  it("round-trips palette data", () => {
    const group = createLuminancePaletteGroup(
      [createLuminancePaletteSwatch(rgba(255, 0, 0))],
      "测试组",
      "g1",
    );
    const original = {
      ...createEmptyLuminancePalette(),
      groups: [group],
      activeGroupId: "g1",
    };

    const restored = luminancePaletteFromJSON(luminancePaletteToJSON(original));
    expect(restored.groups).toHaveLength(1);
    expect(restored.groups[0]?.name).toBe("测试组");
    expect(restored.activeGroupId).toBe("g1");
  });
});

describe("addColorToLuminanceGroup", () => {
  it("rejects when group is full", () => {
    const colors = Array.from({ length: 10 }, (_, index) =>
      createLuminancePaletteSwatch(rgba(index * 20, index * 20, index * 20)),
    );
    const palette = {
      ...createEmptyLuminancePalette(),
      groups: [createLuminancePaletteGroup(colors, "full", "g1")],
    };

    const result = addColorToLuminanceGroup(palette, "g1", rgba(255, 255, 255));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("group_full");
    }
  });
});

describe("LuminancePalettePreset", () => {
  it("creates preset with default name", () => {
    const preset = createLuminancePalettePreset(createEmptyLuminancePalette());
    expect(preset.name).toContain("明度色板");
    expect(preset.data.groups).toEqual([]);
  });
});
