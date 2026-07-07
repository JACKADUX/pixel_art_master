import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba } from "@/domain/canvas/PixelColor";
import {
  combineMasks,
  createMaskFromOpaquePixels,
  createRectMask,
  invertMask,
  resolveCombineMode,
} from "@/domain/selection/SelectionMaskOperations";
import { isMaskSelected } from "@/domain/selection/SelectionMask";

describe("SelectionMaskOperations", () => {
  it("creates rectangular masks", () => {
    const mask = createRectMask({ x: 1, y: 1 }, { x: 3, y: 3 }, 8, 8);
    expect(isMaskSelected(mask, 1, 1)).toBe(true);
    expect(isMaskSelected(mask, 2, 2)).toBe(true);
    expect(isMaskSelected(mask, 3, 3)).toBe(true);
    expect(isMaskSelected(mask, 0, 0)).toBe(false);
  });

  it("combines masks with add mode", () => {
    const a = createRectMask({ x: 0, y: 0 }, { x: 1, y: 1 }, 4, 4);
    const b = createRectMask({ x: 2, y: 2 }, { x: 3, y: 3 }, 4, 4);
    const combined = combineMasks(a, b, "add");
    expect(isMaskSelected(combined, 0, 0)).toBe(true);
    expect(isMaskSelected(combined, 2, 2)).toBe(true);
  });

  it("inverts masks", () => {
    const mask = createRectMask({ x: 0, y: 0 }, { x: 0, y: 0 }, 2, 2);
    const inverted = invertMask(mask);
    expect(isMaskSelected(inverted, 0, 0)).toBe(false);
    expect(isMaskSelected(inverted, 1, 1)).toBe(true);
  });

  it("creates masks from opaque pixels", () => {
    const grid = PixelGrid.createEmpty(4, 4);
    grid.setPixel(1, 1, rgba(255, 0, 0));
    grid.setPixel(2, 2, rgba(255, 0, 0, 128));
    const mask = createMaskFromOpaquePixels(grid);
    expect(isMaskSelected(mask, 1, 1)).toBe(true);
    expect(isMaskSelected(mask, 2, 2)).toBe(true);
    expect(isMaskSelected(mask, 0, 0)).toBe(false);
  });

  it("resolves combine modes like Aseprite", () => {
    expect(resolveCombineMode(false, false, false)).toBe("new");
    expect(resolveCombineMode(true, false, false)).toBe("add");
    expect(resolveCombineMode(true, true, false)).toBe("subtract");
    expect(resolveCombineMode(true, false, true)).toBe("intersect");
    expect(resolveCombineMode(false, true, false)).toBe("new");
  });

  it("combines masks with intersect mode", () => {
    const a = createRectMask({ x: 0, y: 0 }, { x: 2, y: 2 }, 4, 4);
    const b = createRectMask({ x: 1, y: 1 }, { x: 3, y: 3 }, 4, 4);
    const combined = combineMasks(a, b, "intersect");
    expect(isMaskSelected(combined, 1, 1)).toBe(true);
    expect(isMaskSelected(combined, 0, 0)).toBe(false);
    expect(isMaskSelected(combined, 3, 3)).toBe(false);
  });
});
