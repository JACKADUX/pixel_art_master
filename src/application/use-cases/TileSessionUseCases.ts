import type { WritableCanvasSurface } from "@/domain/canvas/MaskedPixelGrid";
import { normalizeRect, type SelectionRect } from "@/domain/selection/SelectionRect";
import {
  captureCanvasSnapshot,
  createIdleTileSession,
  finalizeTileSession,
  type TileSessionState,
} from "@/domain/tile/TileSession";
import {
  regionHasVisiblePixels,
  replicateTilePatternFromRegion,
} from "@/domain/tile/TileReplication";
import type { Point } from "@/domain/tool/ITool";

export function beginTileRegionCreate(): Pick<TileSessionState, "phase"> {
  return { phase: "creating" };
}

export function updateTileRegionPreview(start: Point, current: Point): SelectionRect {
  return normalizeRect(start.x, start.y, current.x, current.y);
}

export function confirmTileRegion(
  grid: WritableCanvasSurface,
  rect: SelectionRect,
): TileSessionState {
  if (rect.width <= 0 || rect.height <= 0) {
    return createIdleTileSession();
  }

  const snapshot = captureCanvasSnapshot(grid);

  if (regionHasVisiblePixels(grid, rect)) {
    replicateTilePatternFromRegion(grid, rect);
  }

  return {
    phase: "drawing",
    region: rect,
    peripheralSnapshot: snapshot,
  };
}

export function cancelTileRegionCreate(): TileSessionState {
  return createIdleTileSession();
}

export function closeTileSession(
  grid: WritableCanvasSurface,
  session: TileSessionState,
): TileSessionState {
  if (session.phase !== "drawing" || !session.peripheralSnapshot) {
    return createIdleTileSession();
  }

  finalizeTileSession(grid, session.region, session.peripheralSnapshot);
  return createIdleTileSession();
}

export interface TileCreateDragState {
  start: Point;
  current: Point;
}

export function handleTileCreatePointerDown(point: Point): TileCreateDragState {
  return { start: point, current: point };
}

export function handleTileCreatePointerMove(
  drag: TileCreateDragState,
  point: Point,
): { drag: TileCreateDragState; previewRect: SelectionRect } {
  const nextDrag = { ...drag, current: point };
  return {
    drag: nextDrag,
    previewRect: updateTileRegionPreview(drag.start, point),
  };
}

export function handleTileCreatePointerUp(
  grid: WritableCanvasSurface,
  drag: TileCreateDragState,
  point: Point,
): { session: TileSessionState; previewRect: SelectionRect | null } {
  const rect = updateTileRegionPreview(drag.start, point);
  if (rect.width <= 0 || rect.height <= 0) {
    return { session: createIdleTileSession(), previewRect: null };
  }

  return {
    session: confirmTileRegion(grid, rect),
    previewRect: null,
  };
}
