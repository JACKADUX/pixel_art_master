import { describe, expect, it } from "vitest";
import { createEmptyDrawingLayer } from "./Layer";
import {
  clampDrawingLayerOpacity,
  isDrawingLayerEditable,
  setDrawingLayerOpacity,
  toggleDrawingLayerLock,
} from "./LayerOperations";

describe("LayerOperations drawing layer opacity and lock", () => {
  it("clamps opacity to 0–255", () => {
    expect(clampDrawingLayerOpacity(-10)).toBe(0);
    expect(clampDrawingLayerOpacity(128.6)).toBe(129);
    expect(clampDrawingLayerOpacity(300)).toBe(255);
  });

  it("sets drawing layer opacity immutably", () => {
    const layer = createEmptyDrawingLayer({ width: 4, height: 4 });
    const layers = setDrawingLayerOpacity([layer], layer.id, 128);

    expect(layers[0].type).toBe("drawing");
    if (layers[0].type === "drawing") {
      expect(layers[0].opacity).toBe(128);
    }
    if (layer.type === "drawing") {
      expect(layer.opacity).toBe(255);
    }
  });

  it("toggles drawing layer lock immutably", () => {
    const layer = createEmptyDrawingLayer({ width: 4, height: 4 });
    const locked = toggleDrawingLayerLock([layer], layer.id);

    expect(locked[0].type).toBe("drawing");
    if (locked[0].type === "drawing") {
      expect(locked[0].locked).toBe(true);
      expect(isDrawingLayerEditable(locked[0])).toBe(false);
    }
  });
});
