import { DrawingStrokeSession, createDrawingStrokeSession } from "@/domain/drawing/DrawingStrokeSession";
import { getActiveLayerProjectedSurfaceFromProject, syncActiveLayerPixels } from "./LayerUseCases";
import type { Project } from "@/domain/project/Project";

export function beginDrawingStroke(project: Project): DrawingStrokeSession | null {
  const surface = getActiveLayerProjectedSurfaceFromProject(project);
  return createDrawingStrokeSession(surface, project);
}

export function commitDrawingStroke(
  project: Project,
  session: DrawingStrokeSession,
): Project {
  return syncActiveLayerPixels(project, session.surface.underlyingGrid);
}

export type { DrawingStrokeSession };
