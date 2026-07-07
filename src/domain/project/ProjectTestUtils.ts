import { createEmptyProject, getActiveCanvas, type Project } from "@/domain/project/Project";
import type { Layer } from "@/domain/layer/Layer";
import { updatePixelCanvasOnBoard } from "@/domain/pixelCanvas/PixelCanvasOperations";

export function mutateActiveCanvas(
  project: Project,
  patch: Partial<{
    layers: Layer[];
    activeLayerId: string;
    width: number;
    height: number;
  }>,
): Project {
  const canvas = getActiveCanvas(project);
  return {
    ...project,
    board: updatePixelCanvasOnBoard(project.board, canvas.id, patch),
  };
}

export function createTestProject(name = "test", size = { width: 64, height: 64 }): Project {
  return createEmptyProject(name, size);
}

export { getActiveCanvas };
