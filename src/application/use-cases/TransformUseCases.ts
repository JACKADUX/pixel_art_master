import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import {
  flipGridHorizontal,
  flipGridVertical,
  rotateGrid,
  rotateGrid90,
  scaleGrid,
  type TransformAnchor,
} from "@/domain/selection/PixelTransform";
import type { SelectionState } from "@/domain/selection/SelectionState";
import { withFloating } from "@/domain/selection/SelectionState";
import { extractMaskedPixels } from "@/domain/selection/SelectionMaskOperations";

export function ensureFloatingForTransform(
  grid: PixelGrid,
  state: SelectionState,
): SelectionState {
  if (state.floating) return state;
  const floating = extractMaskedPixels(grid, state.mask, true);
  if (!floating) return state;
  return withFloating(state, floating);
}

export function scaleFloatingSelection(
  state: SelectionState,
  scaleX: number,
  scaleY: number,
  anchor: TransformAnchor = "center",
): SelectionState {
  if (!state.floating) return state;

  const scaled = scaleGrid(state.floating.pixels, scaleX, scaleY, anchor);
  const offset = state.floating.offset;

  return withFloating(state, {
    ...state.floating,
    pixels: scaled,
    offset: {
      x: Math.round(offset.x - (scaled.width - state.floating.pixels.width) / 2),
      y: Math.round(offset.y - (scaled.height - state.floating.pixels.height) / 2),
    },
  });
}

export function rotateFloatingSelection(
  state: SelectionState,
  angleDeg: number,
): SelectionState {
  if (!state.floating) return state;

  const rotated = rotateGrid(state.floating.pixels, angleDeg);
  const offset = state.floating.offset;
  const oldW = state.floating.pixels.width;
  const oldH = state.floating.pixels.height;

  return withFloating(state, {
    ...state.floating,
    pixels: rotated,
    offset: {
      x: Math.round(offset.x - (rotated.width - oldW) / 2),
      y: Math.round(offset.y - (rotated.height - oldH) / 2),
    },
  });
}

export function rotateFloatingSelection90(
  state: SelectionState,
  steps: number,
): SelectionState {
  if (!state.floating) return state;

  const rotated = rotateGrid90(state.floating.pixels, steps);
  const offset = state.floating.offset;
  const oldW = state.floating.pixels.width;
  const oldH = state.floating.pixels.height;

  return withFloating(state, {
    ...state.floating,
    pixels: rotated,
    offset: {
      x: Math.round(offset.x - (rotated.width - oldW) / 2),
      y: Math.round(offset.y - (rotated.height - oldH) / 2),
    },
  });
}

export function flipFloatingHorizontal(state: SelectionState): SelectionState {
  if (!state.floating) return state;
  return withFloating(state, {
    ...state.floating,
    pixels: flipGridHorizontal(state.floating.pixels),
  });
}

export function flipFloatingVertical(state: SelectionState): SelectionState {
  if (!state.floating) return state;
  return withFloating(state, {
    ...state.floating,
    pixels: flipGridVertical(state.floating.pixels),
  });
}