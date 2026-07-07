import { getAlpha, TRANSPARENT } from "../canvas/PixelColor";
import { PixelGrid } from "../canvas/PixelGrid";
import { LayerProjectedSurface } from "../canvas/LayerProjectedSurface";
import type { WritableCanvasSurface } from "../canvas/MaskedPixelGrid";
import type { Point } from "../tool/ITool";
import type { FloatingSelection } from "./FloatingSelection";
import {
  createEmptyMask,
  isMaskSelected,
  maskIndex,
  setMaskPixel,
  type SelectionMask,
} from "./SelectionMask";
import { normalizeRect, type SelectionRect } from "./SelectionRect";
import type { SelectionCombineMode } from "./SelectionState";

export function createRectMask(
  from: Point,
  to: Point,
  canvasWidth: number,
  canvasHeight: number,
): SelectionMask {
  const mask = createEmptyMask(canvasWidth, canvasHeight);
  const rect = normalizeRect(from.x, from.y, to.x, to.y);
  fillRectInMask(mask, rect);
  return mask;
}

export function createEllipseMask(
  from: Point,
  to: Point,
  canvasWidth: number,
  canvasHeight: number,
): SelectionMask {
  const mask = createEmptyMask(canvasWidth, canvasHeight);
  const rect = normalizeRect(from.x, from.y, to.x, to.y);
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const rx = rect.width / 2;
  const ry = rect.height / 2;

  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) {
      if (x < 0 || y < 0 || x >= canvasWidth || y >= canvasHeight) continue;
      const nx = rx === 0 ? 0 : (x + 0.5 - cx) / rx;
      const ny = ry === 0 ? 0 : (y + 0.5 - cy) / ry;
      if (nx * nx + ny * ny <= 1) {
        setMaskPixel(mask, x, y, true);
      }
    }
  }
  return mask;
}

export function fillRectInMask(mask: SelectionMask, rect: SelectionRect): void {
  for (let y = rect.y; y < rect.y + rect.height; y++) {
    for (let x = rect.x; x < rect.x + rect.width; x++) {
      setMaskPixel(mask, x, y, true);
    }
  }
}

export function combineMasks(
  base: SelectionMask | null,
  incoming: SelectionMask,
  mode: SelectionCombineMode,
): SelectionMask {
  if (mode === "new" || !base) {
    return cloneMaskData(incoming);
  }

  const result = cloneMaskData(base);
  for (let i = 0; i < result.data.length; i++) {
    const b = base.data[i] > 0;
    const n = incoming.data[i] > 0;
    switch (mode) {
      case "add":
        result.data[i] = b || n ? 255 : 0;
        break;
      case "subtract":
        result.data[i] = b && !n ? 255 : 0;
        break;
      case "intersect":
        result.data[i] = b && n ? 255 : 0;
        break;
      default:
        break;
    }
  }
  return result;
}

export function invertMask(mask: SelectionMask): SelectionMask {
  const result = cloneMaskData(mask);
  for (let i = 0; i < result.data.length; i++) {
    result.data[i] = result.data[i] > 0 ? 0 : 255;
  }
  return result;
}

export function selectAllMask(canvasWidth: number, canvasHeight: number): SelectionMask {
  const mask = createEmptyMask(canvasWidth, canvasHeight);
  mask.data.fill(255);
  return mask;
}

export function createMaskFromOpaquePixels(grid: WritableCanvasSurface): SelectionMask {
  const mask = createEmptyMask(grid.width, grid.height);
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (getAlpha(grid.getPixel(x, y)) > 0) {
        setMaskPixel(mask, x, y, true);
      }
    }
  }
  return mask;
}

export function shiftMask(mask: SelectionMask, dx: number, dy: number): SelectionMask {
  const result = createEmptyMask(mask.width, mask.height);
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (!isMaskSelected(mask, x, y)) continue;
      const nx = x + dx;
      const ny = y + dy;
      setMaskPixel(result, nx, ny, true);
    }
  }
  return result;
}

export function extractMaskedPixels(
  grid: WritableCanvasSurface,
  mask: SelectionMask,
  clearSource = false,
): FloatingSelection | null {
  const bounds = computeBoundsFromMask(mask);
  if (bounds.width <= 0 || bounds.height <= 0) return null;

  const position =
    grid instanceof LayerProjectedSurface ? grid.layerPosition : { x: 0, y: 0 };

  const pixels = PixelGrid.createEmpty(bounds.width, bounds.height);
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (!isMaskSelected(mask, x, y)) continue;
      const color = grid.getPixel(x, y);
      pixels.setPixel(x - bounds.x, y - bounds.y, color);
      if (clearSource) {
        grid.setPixel(x, y, TRANSPARENT);
      }
    }
  }

  return {
    pixels,
    offset: { x: bounds.x, y: bounds.y },
    originInLayer: { x: bounds.x - position.x, y: bounds.y - position.y },
    source: "layer",
  };
}

export function blitFloatingToGrid(
  grid: WritableCanvasSurface,
  floating: FloatingSelection,
  mask: SelectionMask | null,
): void {
  const { pixels, offset } = floating;
  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      const color = pixels.getPixel(x, y);
      if (getAlpha(color) === 0) continue;
      const canvasX = offset.x + x;
      const canvasY = offset.y + y;
      if (mask && !isMaskSelected(mask, canvasX, canvasY)) continue;
      grid.setPixel(canvasX, canvasY, color);
    }
  }
}

export function clearMaskedPixels(grid: WritableCanvasSurface, mask: SelectionMask): void {
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (isMaskSelected(mask, x, y)) {
        grid.setPixel(x, y, TRANSPARENT);
      }
    }
  }
}

export function restoreFloatingToOrigin(
  grid: WritableCanvasSurface,
  floating: FloatingSelection,
): void {
  const position =
    grid instanceof LayerProjectedSurface ? grid.layerPosition : { x: 0, y: 0 };
  const { pixels, originInLayer } = floating;
  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      const color = pixels.getPixel(x, y);
      if (getAlpha(color) === 0) continue;
      grid.setPixel(
        originInLayer.x + x + position.x,
        originInLayer.y + y + position.y,
        color,
      );
    }
  }
}

export function computeBoundsFromMask(mask: SelectionMask): SelectionRect {
  let minX = mask.width;
  let minY = mask.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      if (mask.data[maskIndex(mask, x, y)] > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) return { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function cloneMaskData(mask: SelectionMask): SelectionMask {
  return {
    width: mask.width,
    height: mask.height,
    data: new Uint8Array(mask.data),
  };
}

export function extractMaskedRegionAsGrid(
  grid: WritableCanvasSurface,
  mask: SelectionMask,
): PixelGrid | null {
  const bounds = computeBoundsFromMask(mask);
  if (bounds.width <= 0 || bounds.height <= 0) return null;

  const result = PixelGrid.createEmpty(bounds.width, bounds.height);
  for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
      if (!isMaskSelected(mask, x, y)) continue;
      result.setPixel(x - bounds.x, y - bounds.y, grid.getPixel(x, y));
    }
  }
  return result;
}

export function resolveCombineMode(
  shiftKey: boolean,
  altKey: boolean,
): SelectionCombineMode {
  if (shiftKey && altKey) return "intersect";
  if (shiftKey) return "add";
  if (altKey) return "subtract";
  return "new";
}
