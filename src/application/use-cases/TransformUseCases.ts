import type { WritableCanvasSurface } from "@/domain/canvas/MaskedPixelGrid";
import type { Point } from "@/domain/tool/ITool";
import type { FloatingSelection } from "@/domain/selection/FloatingSelection";
import {
  computeResizeRectFromHandle,
  type CanvasRect,
  type ResizeHandle,
} from "@/domain/selection/ResizeTransform";
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
import { syncMaskWithFloating } from "@/domain/selection/FloatingSelectionLifecycle";
import { beginMoveSelection } from "./SelectionUseCases";

export function ensureFloatingForTransform(
  grid: WritableCanvasSurface,
  state: SelectionState,
): SelectionState {
  return beginMoveSelection(grid, state);
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

  return syncMaskWithFloating(
    withFloating(state, {
      ...state.floating,
      pixels: scaled,
      offset: {
        x: Math.round(offset.x - (scaled.width - state.floating.pixels.width) / 2),
        y: Math.round(offset.y - (scaled.height - state.floating.pixels.height) / 2),
      },
    }),
  );
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

  return syncMaskWithFloating(
    withFloating(state, {
      ...state.floating,
      pixels: rotated,
      offset: {
        x: Math.round(offset.x - (rotated.width - oldW) / 2),
        y: Math.round(offset.y - (rotated.height - oldH) / 2),
      },
    }),
  );
}

export function rotateFloatingSelectionByDelta(
  state: SelectionState,
  initialFloating: FloatingSelection,
  deltaDeg: number,
): SelectionState {
  if (!state.floating) return state;

  const rotated = rotateGrid(initialFloating.pixels, deltaDeg);
  const oldW = initialFloating.pixels.width;
  const oldH = initialFloating.pixels.height;

  return syncMaskWithFloating(
    withFloating(state, {
      ...initialFloating,
      pixels: rotated,
      offset: {
        x: Math.round(initialFloating.offset.x - (rotated.width - oldW) / 2),
        y: Math.round(initialFloating.offset.y - (rotated.height - oldH) / 2),
      },
    }),
  );
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

  return syncMaskWithFloating(
    withFloating(state, {
      ...state.floating,
      pixels: rotated,
      offset: {
        x: Math.round(offset.x - (rotated.width - oldW) / 2),
        y: Math.round(offset.y - (rotated.height - oldH) / 2),
      },
    }),
  );
}

export function flipFloatingHorizontal(state: SelectionState): SelectionState {
  if (!state.floating) return state;
  return syncMaskWithFloating(
    withFloating(state, {
      ...state.floating,
      pixels: flipGridHorizontal(state.floating.pixels),
    }),
  );
}

export function flipFloatingVertical(state: SelectionState): SelectionState {
  if (!state.floating) return state;
  return syncMaskWithFloating(
    withFloating(state, {
      ...state.floating,
      pixels: flipGridVertical(state.floating.pixels),
    }),
  );
}

function floatingToCanvasRect(floating: FloatingSelection): CanvasRect {
  return {
    x: floating.offset.x,
    y: floating.offset.y,
    width: floating.pixels.width,
    height: floating.pixels.height,
  };
}

export function resizeFloatingSelectionByHandle(
  state: SelectionState,
  handle: ResizeHandle,
  pointer: Point,
  initialFloating: FloatingSelection,
  modifiers: { shiftKey: boolean; altKey: boolean },
): SelectionState {
  if (!state.floating) return state;

  const initialRect = floatingToCanvasRect(initialFloating);
  const targetRect = computeResizeRectFromHandle(
    handle,
    initialRect,
    pointer,
    modifiers,
  );

  const scaleX = targetRect.width / initialFloating.pixels.width;
  const scaleY = targetRect.height / initialFloating.pixels.height;
  const scaled = scaleGrid(initialFloating.pixels, scaleX, scaleY, "topLeft");

  return syncMaskWithFloating(
    withFloating(state, {
      ...initialFloating,
      pixels: scaled,
      offset: { x: targetRect.x, y: targetRect.y },
    }),
  );
}