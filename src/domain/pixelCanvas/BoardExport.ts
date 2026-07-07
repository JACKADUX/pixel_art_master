import { PixelGrid } from "../canvas/PixelGrid";
import { compositeDrawingLayers } from "../layer/LayerCompositor";
import type { Project } from "../project/Project";

/** 将工作区内所有画板按 boardPosition 合成到一张大图 */
export function compositeBoardPixelGrid(project: Project): PixelGrid {
  const { canvases } = project.board;
  if (canvases.length === 0) {
    return PixelGrid.createEmpty(1, 1);
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const canvas of canvases) {
    minX = Math.min(minX, canvas.boardPosition.x);
    minY = Math.min(minY, canvas.boardPosition.y);
    maxX = Math.max(maxX, canvas.boardPosition.x + canvas.width);
    maxY = Math.max(maxY, canvas.boardPosition.y + canvas.height);
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const board = PixelGrid.createEmpty(width, height);

  for (const canvas of canvases) {
    const composite = compositeDrawingLayers(canvas.layers, {
      width: canvas.width,
      height: canvas.height,
    });
    const offsetX = canvas.boardPosition.x - minX;
    const offsetY = canvas.boardPosition.y - minY;
    composite.compositeOverOnto(board, offsetX, offsetY, 255);
  }

  return board;
}

export function listExportableCanvasIds(project: Project): string[] {
  return project.board.canvases.map((canvas) => canvas.id);
}
