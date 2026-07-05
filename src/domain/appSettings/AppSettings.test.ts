import { describe, expect, it } from "vitest";
import {
  DEFAULT_APP_SETTINGS,
  parseAppSettings,
} from "./AppSettings";

describe("AppSettings canvas size fields", () => {
  it("falls back to default canvas size when fields are missing", () => {
    const settings = parseAppSettings({});
    expect(settings.defaultCanvasWidth).toBe(DEFAULT_APP_SETTINGS.defaultCanvasWidth);
    expect(settings.defaultCanvasHeight).toBe(DEFAULT_APP_SETTINGS.defaultCanvasHeight);
    expect(settings.customCanvasSizePresets).toEqual([]);
  });

  it("parses default canvas size and custom presets", () => {
    const settings = parseAppSettings({
      defaultCanvasWidth: 128,
      defaultCanvasHeight: 96,
      customCanvasSizePresets: [
        { id: "a", label: "角色", width: 48, height: 32 },
        { id: "b", label: "", width: 5000, height: 0 },
        "invalid",
      ],
    });

    expect(settings.defaultCanvasWidth).toBe(128);
    expect(settings.defaultCanvasHeight).toBe(96);
    expect(settings.customCanvasSizePresets).toEqual([
      { id: "a", label: "角色", width: 48, height: 32 },
      { id: "b", label: "4096×1", width: 4096, height: 1 },
    ]);
  });
});
