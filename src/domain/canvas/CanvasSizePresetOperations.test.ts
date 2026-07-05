import { describe, expect, it } from "vitest";
import {
  addCustomPreset,
  createCustomPreset,
  MAX_CUSTOM_CANVAS_SIZE_PRESETS,
  removeCustomPreset,
} from "./CanvasSizePresetOperations";

describe("CanvasSizePresetOperations", () => {
  it("creates a custom preset with default label", () => {
    const preset = createCustomPreset(128, 64);
    expect(preset.label).toBe("128×64");
    expect(preset.width).toBe(128);
    expect(preset.height).toBe(64);
    expect(preset.id).toBeTruthy();
  });

  it("adds and removes custom presets", () => {
    const first = createCustomPreset(96, 96, "角色");
    const second = createCustomPreset(48, 32);
    const added = addCustomPreset([], first);
    expect(added).toHaveLength(1);
    expect(addCustomPreset(added, second)).toHaveLength(2);
    expect(removeCustomPreset(added, first.id)).toHaveLength(0);
  });

  it("rejects duplicate preset sizes", () => {
    const preset = createCustomPreset(64, 64);
    expect(() => addCustomPreset([preset], createCustomPreset(64, 64))).toThrow(
      "该尺寸预设已存在",
    );
  });

  it("rejects more than max custom presets", () => {
    const presets = Array.from({ length: MAX_CUSTOM_CANVAS_SIZE_PRESETS }, (_, index) =>
      createCustomPreset(16 + index, 16 + index),
    );
    expect(() => addCustomPreset(presets, createCustomPreset(999, 999))).toThrow(
      `最多保存 ${MAX_CUSTOM_CANVAS_SIZE_PRESETS} 个自定义预设`,
    );
  });
});
