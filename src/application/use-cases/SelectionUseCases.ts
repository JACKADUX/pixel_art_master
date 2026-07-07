import type { WritableCanvasSurface } from "@/domain/canvas/MaskedPixelGrid";

import type { Point } from "@/domain/tool/ITool";

import type { ToolSettings } from "@/domain/tool/ToolType";

import { floodSelectMaskByTargetColor } from "@/domain/selection/FloodSelect";
import type { ReferenceLayerPixelData } from "@/infrastructure/canvas/ReferenceLayerPixelCache";
import { resolveMagicWandTargetColor } from "./ResolveMagicWandTargetColor";
import type { Project } from "@/domain/project/Project";
import { getActiveLayer, getActiveReferenceLayer } from "@/domain/project/Project";
import { isDrawingLayer } from "@/domain/layer/LayerTypeGuards";
import {
  ensureActiveLayerContainsFloatingRestoreInProject,
  ensureActiveLayerContainsFloatingSelectionInProject,
  getActiveLayerProjectedSurfaceFromProject,
  syncActiveLayerPixels,
} from "./LayerUseCases";

import { createLassoMask } from "@/domain/selection/LassoRasterize";

import {

  combineMasks,

  createEllipseMask,

  createRectMask,

  extractMaskedPixels,

  resolveCombineMode,

  createMaskFromOpaquePixels,

  selectAllMask,

  clearMaskedPixels,

} from "@/domain/selection/SelectionMaskOperations";

import {

  cancelFloating,

  commitFloating,

  getEffectiveSelectionMask,

  invertFloatingSelection,

  syncMaskWithFloating,

} from "@/domain/selection/FloatingSelectionLifecycle";

import {

  cloneSelectionState,

  createSelectionState,

  getEffectiveBounds,

  isSelectionEmpty,

  withFloating,

  type SelectionState,

} from "@/domain/selection/SelectionState";

import { isMaskSelected, computeMaskBounds } from "@/domain/selection/SelectionMask";



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

  grid: WritableCanvasSurface,

  seed: Point,

  settings: ToolSettings,

  existing: SelectionState | null,

  shiftKey: boolean,

  altKey: boolean,

  project?: Project,

  getPixelCache?: (layerId: string, cropKey: string) => ReferenceLayerPixelData | null,

): SelectionState {

  const combineMode = resolveCombineMode(shiftKey, altKey);

  const targetColor =
    project && getPixelCache
      ? resolveMagicWandTargetColor(project, grid, seed, getPixelCache)
      : grid.inBounds(seed.x, seed.y)
        ? grid.getPixel(seed.x, seed.y)
        : 0;

  const incoming = floodSelectMaskByTargetColor(grid, seed, targetColor, {

    tolerance: settings.magicWandTolerance,

    contiguous: settings.magicWandContiguous,

  });

  const combined = combineMasks(existing?.mask ?? null, incoming, combineMode);

  return createSelectionState(combined);

}



export function selectAll(canvasWidth: number, canvasHeight: number): SelectionState {

  return createSelectionState(selectAllMask(canvasWidth, canvasHeight));

}



export function createSelectionFromLayerContent(
  grid: WritableCanvasSurface,
): SelectionState | null {

  const mask = createMaskFromOpaquePixels(grid);

  const state = createSelectionState(mask);

  return isSelectionEmpty(state) ? null : state;

}

export function resolveSelectionForTransform(
  project: Project,
  selection: SelectionState | null,
): SelectionState | null {
  if (!isSelectionEmpty(selection)) return selection;
  if (getActiveReferenceLayer(project)) return null;
  const activeLayer = getActiveLayer(project);
  if (!isDrawingLayer(activeLayer)) return null;
  const grid = getActiveLayerProjectedSurfaceFromProject(project);
  return createSelectionFromLayerContent(grid);
}

export function deselectSelection(): null {

  return null;

}



export function invertSelection(state: SelectionState): SelectionState {

  return invertFloatingSelection(state);

}



export { getEffectiveSelectionMask };



export function isPointInSelection(state: SelectionState | null, point: Point): boolean {

  if (!state || isSelectionEmpty(state)) return false;

  if (state.floating) {

    const bounds = getEffectiveBounds(state);

    if (bounds.width <= 0 || bounds.height <= 0) return false;

    return (

      point.x >= bounds.x &&

      point.y >= bounds.y &&

      point.x < bounds.x + bounds.width &&

      point.y < bounds.y + bounds.height

    );

  }

  return isMaskSelected(state.mask, point.x, point.y);

}



export function beginMoveSelection(

  grid: WritableCanvasSurface,

  state: SelectionState,

): SelectionState {

  if (state.floating) return state;



  const floating = extractMaskedPixels(grid, state.mask, true);

  if (!floating) return state;



  return syncMaskWithFloating(withFloating(state, floating));

}



export function moveFloatingSelection(

  state: SelectionState,

  dx: number,

  dy: number,

): SelectionState {

  if (!state.floating) return state;



  const moved = withFloating(state, {

    ...state.floating,

    offset: {

      x: state.floating.offset.x + dx,

      y: state.floating.offset.y + dy,

    },

  });

  return syncMaskWithFloating(moved);

}



export function commitFloatingSelection(

  grid: WritableCanvasSurface,

  state: SelectionState,

): { grid: WritableCanvasSurface; selection: SelectionState } {

  return commitFloating(grid, state);

}



export function cancelFloatingSelection(

  grid: WritableCanvasSurface,

  state: SelectionState,

): { grid: WritableCanvasSurface; selection: SelectionState } {

  return cancelFloating(grid, state);

}



export function commitFloatingSelectionInProject(

  project: Project,

  state: SelectionState,

): { project: Project; selection: SelectionState } {

  if (!state.floating) {

    return { project, selection: state };

  }



  const prepared = ensureActiveLayerContainsFloatingSelectionInProject(project, state);

  const surface = getActiveLayerProjectedSurfaceFromProject(prepared);

  const { selection: committed } = commitFloatingSelection(surface, state);

  const updatedProject = syncActiveLayerPixels(prepared, surface.underlyingGrid);



  return { project: updatedProject, selection: committed };

}



export function cancelFloatingSelectionInProject(

  project: Project,

  state: SelectionState,

): { project: Project; selection: SelectionState } {

  if (!state.floating) {

    return { project, selection: state };

  }



  const prepared = ensureActiveLayerContainsFloatingRestoreInProject(project, state);

  const surface = getActiveLayerProjectedSurfaceFromProject(prepared);

  const { selection: cancelled } = cancelFloatingSelection(surface, state);

  const updatedProject = syncActiveLayerPixels(prepared, surface.underlyingGrid);



  return { project: updatedProject, selection: cancelled };

}



export function clearSelectionPixels(

  grid: WritableCanvasSurface,

  state: SelectionState,

): WritableCanvasSurface {

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

  grid: WritableCanvasSurface,

  state: SelectionState,

  dx: number,

  dy: number,

): { grid: WritableCanvasSurface; selection: SelectionState } {

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



export function extractSelectionForClipboard(
  state: SelectionState,
  grid: WritableCanvasSurface,
) {

  if (state.floating) {

    return cloneSelectionState(state).floating;

  }

  return extractMaskedPixels(grid, state.mask, false);

}



export function createFloatingFromCut(

  grid: WritableCanvasSurface,

  state: SelectionState,

): { grid: WritableCanvasSurface; selection: SelectionState } | null {

  const floating = extractMaskedPixels(grid, state.mask, true);

  if (!floating) return null;



  return {

    grid,

    selection: syncMaskWithFloating(

      withFloating(state, { ...floating, source: "cut" }),

    ),

  };

}


