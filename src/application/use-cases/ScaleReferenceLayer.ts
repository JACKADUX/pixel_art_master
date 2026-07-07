import type { LayerPosition } from "@/domain/layer/Layer";
import {
  resetReferenceScale,
  setReferencePosition,
  setReferenceScale,
  updateReferenceLayer,
} from "@/domain/layer/ReferenceLayerOperations";
import { isReferenceLayer } from "@/domain/layer/LayerTypeGuards";
import {
  getLayerById,
  touchProject,
  type Project,
} from "@/domain/project/Project";

export function scaleReferenceLayerInProject(
  project: Project,
  layerId: string,
  scale: number,
  position?: LayerPosition,
): Project | null {
  const layer = getLayerById(project, layerId);
  if (!layer || layer.type !== "reference") return null;

  const referenceLayers = updateReferenceLayer(project.referenceLayers, layerId, (ref) => {
    const scaled = setReferenceScale(ref, scale);
    return position ? setReferencePosition(scaled, position) : scaled;
  }).filter(isReferenceLayer);

  return touchProject({ ...project, referenceLayers });
}

export function resetReferenceScaleInProject(
  project: Project,
  layerId: string,
): Project | null {
  const layer = getLayerById(project, layerId);
  if (!layer || layer.type !== "reference") return null;

  const referenceLayers = updateReferenceLayer(project.referenceLayers, layerId, (ref) =>
    resetReferenceScale(ref),
  ).filter(isReferenceLayer);

  return touchProject({ ...project, referenceLayers });
}
