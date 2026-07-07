import type { Project } from "@/domain/project/Project";
import { getActiveCanvas, getLayerById, touchProject, withLayers } from "@/domain/project/Project";
import { canMoveDrawingLayer, moveDrawingLayerPosition } from "@/domain/layer/DrawingLayerOperations";
import type { DrawingLayer, LayerPosition } from "@/domain/layer/Layer";
import { isDrawingLayer } from "@/domain/layer/LayerTypeGuards";

export function moveDrawingLayerInProject(
  project: Project,
  layerId: string,
  position: LayerPosition,
): Project | null {
  const layer = getLayerById(project, layerId);
  if (!layer || !isDrawingLayer(layer) || !canMoveDrawingLayer(layer)) return null;

  const updatedLayer: DrawingLayer = {
    ...layer,
    position: { ...position },
  };

  const layers = getActiveCanvas(project).layers.map((entry) =>
    entry.id === layerId ? updatedLayer : entry,
  );

  return touchProject(withLayers(project, layers));
}

export function moveDrawingLayerByDeltaInProject(
  project: Project,
  layerId: string,
  delta: LayerPosition,
): Project | null {
  const layer = getLayerById(project, layerId);
  if (!layer || !isDrawingLayer(layer)) return null;
  return moveDrawingLayerInProject(
    project,
    layerId,
    moveDrawingLayerPosition(layer, delta).position,
  );
}
