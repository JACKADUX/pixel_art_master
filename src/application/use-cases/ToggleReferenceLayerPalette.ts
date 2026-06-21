import {
  toggleReferencePaletteVisibility,
  updateReferenceLayer,
} from "@/domain/layer/ReferenceLayerOperations";
import {
  getLayerById,
  touchProject,
  withLayers,
  type Project,
} from "@/domain/project/Project";

export function toggleReferenceLayerPaletteInProject(
  project: Project,
  layerId: string,
): Project | null {
  const layer = getLayerById(project, layerId);
  if (!layer || layer.type !== "reference") return null;

  const layers = updateReferenceLayer(project.canvas.layers, layerId, (ref) =>
    toggleReferencePaletteVisibility(ref),
  );

  return touchProject(withLayers(project, layers));
}
