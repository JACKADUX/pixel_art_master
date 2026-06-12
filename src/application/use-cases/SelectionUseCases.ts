import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import type { Point } from "@/domain/tool/ITool";
import type { ToolSettings } from "@/domain/tool/ToolType";
import { floodSelectMask } from "@/domain/selection/FloodSelect";
import { createLassoMask } from "@/domain/selection/LassoRasterize";
import {
  combineMasks,
  createEllipseMask,
  createRectMask,
  extractMaskedPixels,
  invertMask,
  resolveCombineMode,
  selectAllMask,
  shiftMask,
  blitFloatingToGrid,
  clearMaskedPixels,
  restoreFloatingToOrigin,
} from "@/domain/selection/SelectionMaskOperations";
import {
  cloneSelectionState,
  createSelectionState,
  isSelectionEmpty,
  withFloating,
  withMask,
  type SelectionState,
} from "@/domain/selection/SelectionState";
import { isMaskSelected, createEmptyMask, computeMaskBounds } from "@/domain/selection/SelectionMask";

export function createSelectionFromDrag(
  from: Point,
  to: Point,
  canvasWidth: number,
  canvasHeight: number,
  settings: ToolSettings,
  existing: SelectionState | null,
  shiftKey: boolean,
  altKey: boolean,
): SelectionState {
  const combineMode = resolveCombineMode(shiftKey, altKey);
  const incoming =
    settings.selectionMode === "ellipse"
      ? createEllipseMask(from, to, canvasWidth, canvasHeight)
      : createRectMask(from, to, canvasWidth, canvasHeight);

  const combined = combineMasks(existing?.mask ?? null, incoming, combineMode);
  return createSelectionState(combined);
}

export function createSelectionFromLasso(
  points: Point[],
  canvasWidth: number,
  canvasHeight: number,
  existing: SelectionState | null,
  shiftKey: boolean,
  altKey: boolean,
): SelectionState {
  const combineMode = resolveCombineMode(shiftKey, altKey);
  const incoming = createLassoMask(points, canvasWidth, canvasHeight);
  const combined = combineMasks(existing?.mask ?? null, incoming, combineMode);
  return createSelectionState(combined);
}

export function createSelectionFromMagicWand(
  grid: PixelGrid,
  seed: Point,
  settings: ToolSettings,
  existing: SelectionState | null,
  shiftKey: boolean,
  altKey: boolean,
): SelectionState {
  const combineMode = resolveCombineMode(shiftKey, altKey);
  const incoming = floodSelectMask(grid, seed, {
    tolerance: settings.magicWandTolerance,
    contiguous: settings.magicWandContiguous,
  });
  const combined = combineMasks(existing?.mask ?? null, incoming, combineMode);
  return createSelectionState(combined);
}

export function selectAll(canvasWidth: number, canvasHeight: number): SelectionState {
  return createSelectionState(selectAllMask(canvasWidth, canvasHeight));
}

export function deselectSelection(): null {
  return null;
}

export function invertSelection(state: SelectionState): SelectionState {
  const inverted = invertMask(state.mask);
  return createSelectionState(inverted);
}

export function isPointInSelection(state: SelectionState | null, point: Point): boolean {
  if (!state || isSelectionEmpty(state)) return false;
  if (state.floating) {
    const { offset, pixels } = state.floating;
    const lx = point.x - offset.x;
    const ly = point.y - offset.y;
    if (lx < 0 || ly < 0 || lx >= pixels.width || ly >= pixels.height) return false;
    return pixels.getPixel(lx, ly) !== 0;
  }
  return isMaskSelected(state.mask, point.x, point.y);
}

export function beginMoveSelection(
  grid: PixelGrid,
  state: SelectionState,
): SelectionState {
  if (state.floating) return state;

  const floating = extractMaskedPixels(grid, state.mask, true);
  if (!floating) return state;

  return withFloating(state, floating);
}

export function moveFloatingSelection(
  state: SelectionState,
  dx: number,
  dy: number,
): SelectionState {
  if (!state.floating) {
    const shifted = shiftMask(state.mask, dx, dy);
    return withMask(state, shifted);
  }

  return withFloating(state, {
    ...state.floating,
    offset: {
      x: state.floating.offset.x + dx,
      y: state.floating.offset.y + dy,
    },
  });
}

export function commitFloatingSelection(
  grid: PixelGrid,
  state: SelectionState,
): { grid: PixelGrid; selection: SelectionState } {
  if (!state.floating) return { grid, selection: state };

  blitFloatingToGrid(grid, state.floating, null);

  const newMask = createMaskFromFloating(state);
  const committed = withMask(
    withFloating(state, null),
    newMask,
  );

  return { grid, selection: committed };
}

export function cancelFloatingSelection(
  grid: PixelGrid,
  state: SelectionState,
): { grid: PixelGrid; selection: SelectionState } {
  if (!state.floating) return { grid, selection: state };

  restoreFloatingToOrigin(grid, state.floating);
  return {
    grid,
    selection: withFloating(state, null),
  };
}

export function clearSelectionPixels(
  grid: PixelGrid,
  state: SelectionState,
): PixelGrid {
  if (state.floating) {
    for (let y = 0; y < state.floating.pixels.height; y++) {
      for (let x = 0; x < state.floating.pixels.width; x++) {
        state.floating.pixels.setPixel(x, y, 0);
      }
    }
    return grid;
  }
  clearMaskedPixels(grid, state.mask);
  return grid;
}

export function nudgeSelection(
  grid: PixelGrid,
  state: SelectionState,
  dx: number,
  dy: number,
): { grid: PixelGrid; selection: SelectionState } {
  if (state.floating) {
    return {
      grid,
      selection: moveFloatingSelection(state, dx, dy),
    };
  }

  const moved = beginMoveSelection(grid, cloneSelectionState(state));
  return {
    grid,
    selection: moveFloatingSelection(moved, dx, dy),
  };
}

function createMaskFromFloating(state: SelectionState) {
  if (!state.floating) return state.mask;

  const mask = createEmptyMask(state.mask.width, state.mask.height);
  const { offset, pixels } = state.floating;
  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      if (pixels.getPixel(x, y) !== 0) {
        const cx = offset.x + x;
        const cy = offset.y + y;
        if (cx >= 0 && cy >= 0 && cx < mask.width && cy < mask.height) {
          mask.data[cy * mask.width + cx] = 255;
        }
      }
    }
  }
  return mask;
}

export function updateSelectionBounds(state: SelectionState): SelectionState {
  if (state.floating) {
    return {
      ...state,
      bounds: {
        x: state.floating.offset.x,
        y: state.floating.offset.y,
        width: state.floating.pixels.width,
        height: state.floating.pixels.height,
      },
    };
  }
  return {
    ...state,
    bounds: computeMaskBounds(state.mask),
  };
}

export function extractSelectionForClipboard(state: SelectionState, grid: PixelGrid) {
  if (state.floating) {
    return cloneSelectionState(state).floating;
  }
  return extractMaskedPixels(grid, state.mask, false);
}
