import type { SelectionRect } from "./SelectionRect";
import { EMPTY_RECT } from "./SelectionRect";

export interface SelectionMask {
  width: number;
  height: number;
  data: Uint8Array;
}

export function createEmptyMask(width: number, height: number): SelectionMask {
  return { width, height, data: new Uint8Array(width * height) };
}

export function cloneMask(mask: SelectionMask): SelectionMask {
  return { width: mask.width, height: mask.height, data: new Uint8Array(mask.data) };
}

export function maskIndex(mask: SelectionMask, x: number, y: number): number {
  return y * mask.width + x;
}

export function isMaskSelected(mask: SelectionMask, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return false;
  return mask.data[maskIndex(mask, x, y)] > 0;
}

export function setMaskPixel(mask: SelectionMask, x: number, y: number, selected: boolean): void {
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return;
  mask.data[maskIndex(mask, x, y)] = selected ? 255 : 0;
}

export function isMaskEmpty(mask: SelectionMask): boolean {
  for (let i = 0; i < mask.data.length; i++) {
    if (mask.data[i] > 0) return false;
  }
  return true;
}

export function computeMaskBounds(mask: SelectionMask): SelectionRect {
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

  if (maxX < 0) return { ...EMPTY_RECT };
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}
