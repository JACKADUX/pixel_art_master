import type { IClipboardService } from "@/application/ports/IClipboardService";
import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import { PixelGrid as PG } from "@/domain/canvas/PixelGrid";
import type { FloatingSelection } from "@/domain/selection/FloatingSelection";
import { cloneFloatingSelection } from "@/domain/selection/FloatingSelection";
import type { SelectionState } from "@/domain/selection/SelectionState";
import { createSelectionState, withFloating } from "@/domain/selection/SelectionState";
import { createEmptyMask } from "@/domain/selection/SelectionMask";
import {
  clearMaskedPixels,
  extractMaskedRegionAsGrid,
} from "@/domain/selection/SelectionMaskOperations";

export function floatingToPixelGrid(floating: FloatingSelection): PixelGrid {
  return floating.pixels.clone();
}

export function pixelGridToPngBlob(grid: PixelGrid): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = grid.width;
    canvas.height = grid.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Cannot create canvas context"));
      return;
    }
    const imageData = ctx.createImageData(grid.width, grid.height);
    imageData.data.set(grid.toRgba());
    ctx.putImageData(imageData, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create PNG blob"));
    }, "image/png");
  });
}

export async function copyFloatingToClipboard(
  clipboard: IClipboardService,
  floating: FloatingSelection,
): Promise<FloatingSelection> {
  const blob = await pixelGridToPngBlob(floating.pixels);
  await clipboard.copyImage(blob);
  return cloneFloatingSelection(floating);
}

export async function copySelectionToClipboard(
  clipboard: IClipboardService,
  grid: PixelGrid,
  state: SelectionState,
  internalClipboard: FloatingSelection | null,
): Promise<FloatingSelection | null> {
  if (state.floating) {
    return copyFloatingToClipboard(clipboard, state.floating);
  }

  const region = extractMaskedRegionAsGrid(grid, state.mask);
  if (!region) return internalClipboard;

  const bounds = state.bounds;
  const floating: FloatingSelection = {
    pixels: region,
    offset: { x: bounds.x, y: bounds.y },
    originInLayer: { x: bounds.x, y: bounds.y },
  };

  return copyFloatingToClipboard(clipboard, floating);
}

export function cutSelectionPixels(
  grid: PixelGrid,
  state: SelectionState,
): SelectionState {
  if (state.floating) return state;
  clearMaskedPixels(grid, state.mask);
  return state;
}

export function createSelectionFromFloating(
  floating: FloatingSelection,
  canvasWidth: number,
  canvasHeight: number,
): SelectionState {
  const mask = createEmptyMask(canvasWidth, canvasHeight);
  const { offset, pixels } = floating;

  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      if (pixels.getPixel(x, y) === 0) continue;
      const cx = offset.x + x;
      const cy = offset.y + y;
      if (cx >= 0 && cy >= 0 && cx < canvasWidth && cy < canvasHeight) {
        mask.data[cy * canvasWidth + cx] = 255;
      }
    }
  }

  return withFloating(createSelectionState(mask), cloneFloatingSelection(floating));
}

export function imageDataToPixelGrid(imageData: ImageData): PixelGrid {
  return PG.fromRgba(imageData.width, imageData.height, imageData.data);
}

export async function pasteFromClipboard(
  clipboard: IClipboardService,
  canvasWidth: number,
  canvasHeight: number,
  internalClipboard: FloatingSelection | null,
): Promise<SelectionState | null> {
  if (internalClipboard) {
    return createSelectionFromFloating(
      {
        ...cloneFloatingSelection(internalClipboard),
        offset: { ...internalClipboard.offset },
      },
      canvasWidth,
      canvasHeight,
    );
  }

  const imageData = await clipboard.readImage();
  if (!imageData) return null;

  const pixels = imageDataToPixelGrid(imageData);
  const floating: FloatingSelection = {
    pixels,
    offset: {
      x: Math.floor((canvasWidth - pixels.width) / 2),
      y: Math.floor((canvasHeight - pixels.height) / 2),
    },
    originInLayer: { x: 0, y: 0 },
  };

  return createSelectionFromFloating(floating, canvasWidth, canvasHeight);
}
