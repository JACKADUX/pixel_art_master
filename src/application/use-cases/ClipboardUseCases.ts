import type { IClipboardService } from "@/application/ports/IClipboardService";
import type { WritableCanvasSurface } from "@/domain/canvas/MaskedPixelGrid";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import type { FloatingSelection } from "@/domain/selection/FloatingSelection";
import { cloneFloatingSelection } from "@/domain/selection/FloatingSelection";
import type { SelectionState } from "@/domain/selection/SelectionState";
import { createSelectionState, withFloating } from "@/domain/selection/SelectionState";
import { createEmptyMask } from "@/domain/selection/SelectionMask";
import { syncMaskWithFloating } from "@/domain/selection/FloatingSelectionLifecycle";
import { extractMaskedRegionAsGrid } from "@/domain/selection/SelectionMaskOperations";

const PASTE_NUDGE = 8;

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
  grid: WritableCanvasSurface,
  state: SelectionState,
): Promise<FloatingSelection | null> {
  if (state.floating) {
    return copyFloatingToClipboard(clipboard, state.floating);
  }

  const region = extractMaskedRegionAsGrid(grid, state.mask);
  if (!region) return null;

  const bounds = state.bounds;
  const floating: FloatingSelection = {
    pixels: region,
    offset: { x: bounds.x, y: bounds.y },
    originInLayer: { x: bounds.x, y: bounds.y },
    source: "layer",
  };

  return copyFloatingToClipboard(clipboard, floating);
}

export function createSelectionFromFloating(
  floating: FloatingSelection,
  canvasWidth: number,
  canvasHeight: number,
): SelectionState {
  const cloned = cloneFloatingSelection(floating);
  const base = withFloating(
    createSelectionState(createEmptyMask(canvasWidth, canvasHeight)),
    cloned,
  );
  return syncMaskWithFloating(base);
}

export function imageDataToPixelGrid(imageData: ImageData): PixelGrid {
  return PixelGrid.fromRgba(imageData.width, imageData.height, imageData.data);
}

function nudgePasteOffset(
  offset: { x: number; y: number },
  canvasWidth: number,
  canvasHeight: number,
  pixelsWidth: number,
  pixelsHeight: number,
): { x: number; y: number } {
  let x = offset.x + PASTE_NUDGE;
  let y = offset.y + PASTE_NUDGE;
  if (x + pixelsWidth > canvasWidth) x = Math.max(0, offset.x - PASTE_NUDGE);
  if (y + pixelsHeight > canvasHeight) y = Math.max(0, offset.y - PASTE_NUDGE);
  return { x, y };
}

export async function pasteFromClipboard(
  clipboard: IClipboardService,
  canvasWidth: number,
  canvasHeight: number,
  internalClipboard: FloatingSelection | null,
): Promise<SelectionState | null> {
  if (internalClipboard) {
    const nudgedOffset = nudgePasteOffset(
      internalClipboard.offset,
      canvasWidth,
      canvasHeight,
      internalClipboard.pixels.width,
      internalClipboard.pixels.height,
    );
    const floating: FloatingSelection = {
      ...cloneFloatingSelection(internalClipboard),
      offset: nudgedOffset,
      originInLayer: { ...nudgedOffset },
      source: "paste",
    };
    return createSelectionFromFloating(floating, canvasWidth, canvasHeight);
  }

  const imageData = await clipboard.readImage();
  if (!imageData) return null;

  const pixels = imageDataToPixelGrid(imageData);
  const offset = {
    x: Math.floor((canvasWidth - pixels.width) / 2),
    y: Math.floor((canvasHeight - pixels.height) / 2),
  };
  const floating: FloatingSelection = {
    pixels,
    offset,
    originInLayer: { ...offset },
    source: "paste",
  };

  return createSelectionFromFloating(floating, canvasWidth, canvasHeight);
}
