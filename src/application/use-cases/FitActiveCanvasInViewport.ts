import { planFitActiveCanvasViewport } from "@/domain/pixelCanvas/ActiveCanvasViewport";
import type { Project } from "@/domain/project/Project";

export function fitActiveCanvasInViewport(
  project: Project,
  containerWidth: number,
  containerHeight: number,
) {
  return planFitActiveCanvasViewport(
    containerWidth,
    containerHeight,
    project.board,
    project.referenceLayers,
  );
}
