import { describe, expect, it } from "vitest";
import { createEmptyReferenceLayer } from "./Layer";
import type { ReferenceLayer } from "./Layer";
import {
  clampReferenceScale,
  getReferenceBounds,
  getReferenceDisplaySize,
  REFERENCE_SCALE_MAX,
  REFERENCE_SCALE_MIN,
  resetReferenceScale,
  setReferenceImage,
  setReferenceScale,
  toggleReferencePaletteVisibility,
} from "./ReferenceLayerOperations";

function referenceWithCrop(scale = 1): ReferenceLayer {
  return {
    ...createEmptyReferenceLayer(),
    imageData: "data:image/png;base64,test",
    imageSize: { width: 10, height: 10 },
    crop: { x: 0, y: 0, width: 10, height: 10 },
    position: { x: 5, y: 7 },
    scale,
  };
}

describe("clampReferenceScale", () => {
  it("keeps in-range values", () => {
    expect(clampReferenceScale(2)).toBe(2);
  });

  it("clamps below the minimum", () => {
    expect(clampReferenceScale(0)).toBe(REFERENCE_SCALE_MIN);
  });

  it("clamps above the maximum", () => {
    expect(clampReferenceScale(1000)).toBe(REFERENCE_SCALE_MAX);
  });

  it("falls back to 1 for non-finite values", () => {
    expect(clampReferenceScale(Number.NaN)).toBe(1);
  });
});

describe("setReferenceScale", () => {
  it("applies a clamped scale", () => {
    const layer = referenceWithCrop();
    expect(setReferenceScale(layer, 3).scale).toBe(3);
    expect(setReferenceScale(layer, -1).scale).toBe(REFERENCE_SCALE_MIN);
  });
});

describe("resetReferenceScale", () => {
  it("returns the layer at scale 1", () => {
    const layer = referenceWithCrop(4);
    expect(resetReferenceScale(layer).scale).toBe(1);
  });
});

describe("getReferenceDisplaySize", () => {
  it("multiplies crop dimensions by scale", () => {
    expect(getReferenceDisplaySize(referenceWithCrop(2))).toEqual({
      width: 20,
      height: 20,
    });
  });
});

describe("getReferenceBounds", () => {
  it("includes scale in the rendered size", () => {
    const bounds = getReferenceBounds(referenceWithCrop(2), 4);
    expect(bounds).toEqual({
      left: 5 * 4,
      top: 7 * 4,
      width: 10 * 2 * 4,
      height: 10 * 2 * 4,
    });
  });
});

describe("toggleReferencePaletteVisibility", () => {
  it("flips the palette visibility flag", () => {
    const layer = referenceWithCrop();
    expect(layer.paletteVisible).toBe(true);
    const hidden = toggleReferencePaletteVisibility(layer);
    expect(hidden.paletteVisible).toBe(false);
    expect(toggleReferencePaletteVisibility(hidden).paletteVisible).toBe(true);
  });
});

describe("setReferenceImage", () => {
  it("resets scale back to 1 when a new image is loaded", () => {
    const layer = referenceWithCrop(5);
    const next = setReferenceImage(
      layer,
      "data:image/png;base64,next",
      { width: 8, height: 8 },
      { width: 32, height: 32 },
    );
    expect(next.scale).toBe(1);
  });
});
