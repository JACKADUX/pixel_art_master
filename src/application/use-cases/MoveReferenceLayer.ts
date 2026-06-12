import type { LayerPosition } from "@/domain/layer/Layer";
import {
  setReferencePosition,
  updateReferenceLayer,
} from "@/domain/layer/ReferenceLayerOperations";
import {
  getLayerById,
  touchProject,
  withLayers,
  type Project,
} from "@/domain/project/Project";

export function moveReferenceLayerInProject(
  project: Project,
  layerId: string,
  position: LayerPosition,
): Project | null {
  const layer = getLayerById(project, layerId);
  if (!layer || layer.type !== "reference") return null;

  const layers = updateReferenceLayer(project.canvas.layers, layerId, (ref) =>
    setReferencePosition(ref, position),
  );

  return touchProject(withLayers(project, layers));
}

export function moveReferenceLayerByDeltaInProject(
  project: Project,
  layerId: string,
  delta: LayerPosition,
): Project | null {
  const layer = getLayerById(project, layerId);
  if (!layer || layer.type !== "reference") return null;

  return moveReferenceLayerInProject(project, layerId, {
    x: layer.position.x + delta.x,
    y: layer.position.y + delta.y,
  });
}
