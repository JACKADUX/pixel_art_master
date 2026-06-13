import type { PixelGrid } from "../canvas/PixelGrid";
import { getAlpha } from "../canvas/PixelColor";
import type { SelectionMask } from "./SelectionMask";
import { createEmptyMask } from "./SelectionMask";
import {
  blitFloatingToGrid,
  invertMask,
  restoreFloatingToOrigin,
} from "./SelectionMaskOperations";
import {
  isSelectionEmpty,
  withFloating,
  withMask,
  type SelectionState,
} from "./SelectionState";

export function syncMaskWithFloating(state: SelectionState): SelectionState {
  if (!state.floating) return state;

  const mask = createEmptyMask(state.mask.width, state.mask.height);
  const { offset, pixels } = state.floating;

  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      if (getAlpha(pixels.getPixel(x, y)) === 0) continue;
      const cx = offset.x + x;
      const cy = offset.y + y;
      if (cx >= 0 && cy >= 0 && cx < mask.width && cy < mask.height) {
        mask.data[cy * mask.width + cx] = 255;
      }
    }
  }

  return withMask(state, mask);
}

export function getEffectiveSelectionMask(
  state: SelectionState | null,
): SelectionMask | null {
  if (!state || isSelectionEmpty(state)) return null;
  if (state.floating) {
    return syncMaskWithFloating(state).mask;
  }
  return state.mask;
}

export function commitFloating(
  grid: PixelGrid,
  state: SelectionState,
): { grid: PixelGrid; selection: SelectionState } {
  if (!state.floating) return { grid, selection: state };

  blitFloatingToGrid(grid, state.floating, null);
  const synced = syncMaskWithFloating(state);
  return {
    grid,
    selection: withFloating(withMask(synced, synced.mask), null),
  };
}

export function cancelFloating(
  grid: PixelGrid,
  state: SelectionState,
): { grid: PixelGrid; selection: SelectionState } {
  if (!state.floating) return { grid, selection: state };

  if (state.floating.source !== "paste") {
    restoreFloatingToOrigin(grid, state.floating);
  }

  return {
    grid,
    selection: withFloating(state, null),
  };
}

export function invertFloatingSelection(state: SelectionState): SelectionState {
  const invertedMask = invertMask(state.mask);
  if (!state.floating) {
    return withMask(state, invertedMask);
  }
  return {
    ...state,
    mask: invertedMask,
  };
}
