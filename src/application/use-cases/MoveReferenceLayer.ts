import type { LayerPosition } from "@/domain/layer/Layer";
import {
  setReferencePosition,
  updateReferenceLayer,
} from "@/domain/layer/ReferenceLayerOperations";
import { isReferenceLayer } from "@/domain/layer/LayerTypeGuards";
import {
  getLayerById,
  touchProject,
  type Project,
} from "@/domain/project/Project";

export function moveReferenceLayerInProject(
  project: Project,
  layerId: string,
  position: LayerPosition,
): Project | null {
  const layer = getLayerById(project, layerId);
  if (!layer || layer.type !== "reference") return null;

  const referenceLayers = updateReferenceLayer(project.referenceLayers, layerId, (ref) =>
    setReferencePosition(ref, position),
  ).filter(isReferenceLayer);

  return touchProject({ ...project, referenceLayers });
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
