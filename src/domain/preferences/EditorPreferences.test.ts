import { describe, expect, it } from "vitest";
import { getFloatingColorPickerPanelDimensions } from "@/domain/color/ColorPickerLayout";
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

  it("derives floating color picker dimensions from layout orientation", () => {
    const horizontal = parseEditorPreferences({
      colorPickerLayoutOrientation: "horizontal",
      floatingColorPickerLayout: {
        panelWidth: 280,
        panelHeight: 400,
      },
    });
    const vertical = parseEditorPreferences({
      colorPickerLayoutOrientation: "vertical",
      floatingColorPickerLayout: {
        panelWidth: 340,
        panelHeight: 132,
      },
    });

    expect(horizontal.floatingColorPickerLayout.panelWidth).toBe(
      getFloatingColorPickerPanelDimensions("horizontal").width,
    );
    expect(horizontal.floatingColorPickerLayout.panelHeight).toBe(
      getFloatingColorPickerPanelDimensions("horizontal").height,
    );
    expect(vertical.floatingColorPickerLayout.panelWidth).toBe(
      getFloatingColorPickerPanelDimensions("vertical").width,
    );
    expect(vertical.floatingColorPickerLayout.panelHeight).toBe(
      getFloatingColorPickerPanelDimensions("vertical").height,
    );
  });
});
