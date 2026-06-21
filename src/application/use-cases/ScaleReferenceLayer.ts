import type { LayerPosition } from "@/domain/layer/Layer";
import {
  resetReferenceScale,
  setReferencePosition,
  setReferenceScale,
  updateReferenceLayer,
} from "@/domain/layer/ReferenceLayerOperations";
import {
  getLayerById,
  touchProject,
  withLayers,
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

  const layers = updateReferenceLayer(project.canvas.layers, layerId, (ref) => {
    const scaled = setReferenceScale(ref, scale);
    return position ? setReferencePosition(scaled, position) : scaled;
  });

  return touchProject(withLayers(project, layers));
}

export function resetReferenceScaleInProject(
  project: Project,
  layerId: string,
): Project | null {
  const layer = getLayerById(project, layerId);
  if (!layer || layer.type !== "reference") return null;

  const layers = updateReferenceLayer(project.canvas.layers, layerId, (ref) =>
    resetReferenceScale(ref),
  );

  return touchProject(withLayers(project, layers));
}
