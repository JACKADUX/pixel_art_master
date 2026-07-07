import { layoutCanvasesOnBoard } from "@/domain/pixelCanvas/BoardAutoLayout";
import type { Project } from "@/domain/project/Project";
import { withBoard } from "@/domain/project/Project";

export function autoLayoutBoardCanvases(project: Project): Project {
  return withBoard(project, layoutCanvasesOnBoard(project.board));
}
