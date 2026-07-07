import { getActiveLayerProjectedSurfaceFromProject } from "@/application/use-cases/LayerUseCases";
import { extractColorsFromSelection } from "@/domain/selection/SelectionColorExtraction";
import { isSelectionEmpty, type SelectionState } from "@/domain/selection/SelectionState";
import type { ColorEntry } from "@/domain/palette/Palette";
import type { Project } from "@/domain/project/Project";

export function extractSelectionColorsForAnalysis(
  project: Project,
  selection: SelectionState | null,
): ColorEntry[] {
  if (!selection || isSelectionEmpty(selection)) {
    return [];
  }

  const grid = getActiveLayerProjectedSurfaceFromProject(project);
  return extractColorsFromSelection(grid, selection);
}
