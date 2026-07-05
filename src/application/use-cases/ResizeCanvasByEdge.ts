import type { CanvasResizeEdge } from "@/domain/canvas/CanvasEdgeResizeOperations";
import { resizeCanvasFromEdge } from "@/domain/canvas/CanvasEdgeResizeOperations";
import {
  getCanvasSize,
  type Project,
} from "@/domain/project/Project";

import { resizeCanvas } from "./ResizeCanvas";

export function resizeCanvasByEdge(
  project: Project,
  edge: CanvasResizeEdge,
  delta: number,
  anchorSize?: { width: number; height: number },
): Project {
  const baseSize = anchorSize ?? getCanvasSize(project);
  const newSize = resizeCanvasFromEdge(baseSize, edge, delta);
  return resizeCanvas(project, newSize.width, newSize.height);
}
