import { describe, expect, it } from "vitest";
import { FLOATING_PANEL_Z_BASE } from "@/domain/viewport/FloatingPanelStack";
import {
  computeReferenceLayerCanvasZIndex,
  computeReferenceLayerChromeZIndex,
  REFERENCE_LAYER_CANVAS_Z_BASE,
} from "./LayerStack";

describe("computeReferenceLayerCanvasZIndex", () => {
  it("按堆叠顺序递增", () => {
    expect(computeReferenceLayerCanvasZIndex(0)).toBe(REFERENCE_LAYER_CANVAS_Z_BASE);
    expect(computeReferenceLayerCanvasZIndex(2)).toBe(REFERENCE_LAYER_CANVAS_Z_BASE + 2);
  });
});

describe("computeReferenceLayerChromeZIndex", () => {
  it("控件层高于所有参考图 canvas", () => {
    const referenceCount = 3;
    const maxCanvasZ = computeReferenceLayerCanvasZIndex(referenceCount - 1);
    const activeChromeZ = computeReferenceLayerChromeZIndex(0, true, referenceCount);
    expect(activeChromeZ).toBeGreaterThan(maxCanvasZ);
  });

  it("激活层控件高于非激活层控件", () => {
    const referenceCount = 2;
    const activeZ = computeReferenceLayerChromeZIndex(0, true, referenceCount);
    const inactiveZ = computeReferenceLayerChromeZIndex(1, false, referenceCount);
    expect(activeZ).toBeGreaterThan(inactiveZ);
  });

  it("始终低于悬浮工具窗与弹窗", () => {
    for (let count = 1; count <= 20; count += 1) {
      for (let stackIndex = 0; stackIndex < count; stackIndex += 1) {
        expect(
          computeReferenceLayerChromeZIndex(stackIndex, true, count),
        ).toBeLessThan(FLOATING_PANEL_Z_BASE);
        expect(
          computeReferenceLayerChromeZIndex(stackIndex, false, count),
        ).toBeLessThan(FLOATING_PANEL_Z_BASE);
      }
    }
  });
});
