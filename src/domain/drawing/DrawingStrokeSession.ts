import type { LayerProjectedSurface } from "@/domain/canvas/LayerProjectedSurface";
import { getActiveCanvas, getActiveLayer } from "@/domain/project/Project";
import type { Project } from "@/domain/project/Project";
import { isDrawingLayer } from "@/domain/layer/LayerTypeGuards";

/**
 * Mutable drawing buffer reused for the duration of a pointer stroke.
 * Avoids copying layer pixels on every pointerMove.
 */
export class DrawingStrokeSession {
  readonly surface: LayerProjectedSurface;
  readonly layerId: string;
  readonly canvasId: string;

  constructor(
    surface: LayerProjectedSurface,
    layerId: string,
    canvasId: string,
  ) {
    this.surface = surface;
    this.layerId = layerId;
    this.canvasId = canvasId;
  }
}

export function createDrawingStrokeSession(
  surface: LayerProjectedSurface,
  project: Project,
): DrawingStrokeSession | null {
  const activeLayer = getActiveLayer(project);
  if (!isDrawingLayer(activeLayer)) return null;

  return new DrawingStrokeSession(
    surface,
    activeLayer.id,
    getActiveCanvas(project).id,
  );
}
