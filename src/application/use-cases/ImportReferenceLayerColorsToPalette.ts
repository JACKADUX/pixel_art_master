import { extractUniqueColorsFromPixels } from "@/domain/layer/ReferenceLayerPalette";
import type { ReferenceLayer } from "@/domain/layer/Layer";
import { touchProject, type Project } from "@/domain/project/Project";

export type ReferenceColorImportScope = "crop" | "full";

export async function importReferenceLayerColorsToPalette(
  project: Project,
  layer: ReferenceLayer,
  scope: ReferenceColorImportScope,
  loadPixels: (
    layer: ReferenceLayer,
    scope: ReferenceColorImportScope,
  ) => Promise<Uint32Array | null>,
): Promise<Project> {
  if (!layer.imageData) return project;
  if (scope === "crop" && !layer.crop) return project;
  if (scope === "full" && !layer.imageSize) return project;

  const pixels = await loadPixels(layer, scope);
  if (!pixels) return project;

  const colors = extractUniqueColorsFromPixels(pixels);
  if (colors.length === 0) return project;

  return touchProject({
    ...project,
    palette: project.palette.withAddedColors(colors),
  });
}
