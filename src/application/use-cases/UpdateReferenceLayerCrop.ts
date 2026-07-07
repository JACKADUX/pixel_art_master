import type { CropRect } from "@/domain/layer/Layer";
import {
  setReferenceCrop,
  updateReferenceLayer,
} from "@/domain/layer/ReferenceLayerOperations";
import { isReferenceLayer } from "@/domain/layer/LayerTypeGuards";
import {
  getLayerById,
  touchProject,
  type Project,
} from "@/domain/project/Project";

export function updateReferenceLayerCropInProject(
  project: Project,
  layerId: string,
  crop: CropRect,
): Project | null {
  const layer = getLayerById(project, layerId);
  if (!layer || layer.type !== "reference" || !layer.imageSize) return null;

  const referenceLayers = updateReferenceLayer(project.referenceLayers, layerId, (ref) =>
    setReferenceCrop(ref, crop),
  ).filter(isReferenceLayer);

  return touchProject({ ...project, referenceLayers });
}
