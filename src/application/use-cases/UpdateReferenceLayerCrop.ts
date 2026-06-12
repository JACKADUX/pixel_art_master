import type { CropRect } from "@/domain/layer/Layer";
import {
  setReferenceCrop,
  updateReferenceLayer,
} from "@/domain/layer/ReferenceLayerOperations";
import {
  getLayerById,
  touchProject,
  withLayers,
  type Project,
} from "@/domain/project/Project";

export function updateReferenceLayerCropInProject(
  project: Project,
  layerId: string,
  crop: CropRect,
): Project | null {
  const layer = getLayerById(project, layerId);
  if (!layer || layer.type !== "reference" || !layer.imageSize) return null;

  const layers = updateReferenceLayer(project.canvas.layers, layerId, (ref) =>
    setReferenceCrop(ref, crop),
  );

  return touchProject(withLayers(project, layers));
}
