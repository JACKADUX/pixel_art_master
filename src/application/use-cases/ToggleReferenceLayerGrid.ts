import { toggleReferenceGridVisibility, updateReferenceLayer } from "@/domain/layer/ReferenceLayerOperations";
import { isReferenceLayer } from "@/domain/layer/LayerTypeGuards";
import {
  getLayerById,
  touchProject,
  type Project,
} from "@/domain/project/Project";

export function toggleReferenceLayerGridInProject(
  project: Project,
  layerId: string,
): Project | null {
  const layer = getLayerById(project, layerId);
  if (!layer || layer.type !== "reference") return null;

  const referenceLayers = updateReferenceLayer(project.referenceLayers, layerId, (ref) =>
    toggleReferenceGridVisibility(ref),
  ).filter(isReferenceLayer);

  return touchProject({ ...project, referenceLayers });
}
