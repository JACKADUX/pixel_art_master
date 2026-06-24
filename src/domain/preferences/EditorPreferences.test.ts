import { describe, expect, it } from "vitest";
import { parseEditorPreferences } from "./EditorPreferences";

describe("parseEditorPreferences", () => {
  it("migrates legacy oklab palette view mode to oklch", () => {
    const preferences = parseEditorPreferences({ paletteViewMode: "oklabMap" });

    expect(preferences.paletteViewMode).toBe("oklchMap");
  });

  it("migrates legacy oklab color picker mode to oklch", () => {
    const preferences = parseEditorPreferences({ colorPickerMode: "oklab" });

    expect(preferences.colorPickerMode).toBe("oklch");
  });

  it("migrates legacy hsl color picker mode to oklch", () => {
    const preferences = parseEditorPreferences({ colorPickerMode: "hsl" });

    expect(preferences.colorPickerMode).toBe("oklch");
  });

  it("migrates legacy oklab canvas display mode to oklch", () => {
    const preferences = parseEditorPreferences({ canvasDisplayMode: "oklabLightness" });

    expect(preferences.canvasDisplayMode).toBe("oklchLightness");
  });
});
