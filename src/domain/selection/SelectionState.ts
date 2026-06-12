import type { SelectionMask } from "./SelectionMask";
import { cloneMask, computeMaskBounds, isMaskEmpty } from "./SelectionMask";
import type { SelectionRect } from "./SelectionRect";
import { EMPTY_RECT } from "./SelectionRect";
import type { FloatingSelection } from "./FloatingSelection";
import { cloneFloatingSelection } from "./FloatingSelection";

export type SelectionMode = "rectangle" | "ellipse" | "lasso" | "magicWand";
export type SelectionCombineMode = "new" | "add" | "subtract" | "intersect";

export interface SelectionState {
  mask: SelectionMask;
  bounds: SelectionRect;
  floating: FloatingSelection | null;
}

export function createSelectionState(mask: SelectionMask): SelectionState {
  return {
    mask,
    bounds: computeMaskBounds(mask),
    floating: null,
  };
}

export function cloneSelectionState(state: SelectionState): SelectionState {
  return {
    mask: cloneMask(state.mask),
    bounds: { ...state.bounds },
    floating: state.floating ? cloneFloatingSelection(state.floating) : null,
  };
}

export function isSelectionEmpty(state: SelectionState | null): boolean {
  if (!state) return true;
  return isMaskEmpty(state.mask) && state.floating === null;
}

export function withFloating(
  state: SelectionState,
  floating: FloatingSelection | null,
): SelectionState {
  return { ...state, floating };
}

export function withMask(state: SelectionState, mask: SelectionMask): SelectionState {
  return {
    ...state,
    mask,
    bounds: computeMaskBounds(mask),
  };
}

export function getEffectiveBounds(state: SelectionState): SelectionRect {
  if (state.floating) {
    return {
      x: state.floating.offset.x,
      y: state.floating.offset.y,
      width: state.floating.pixels.width,
      height: state.floating.pixels.height,
    };
  }
  if (isMaskEmpty(state.mask)) return { ...EMPTY_RECT };
  return state.bounds;
}
