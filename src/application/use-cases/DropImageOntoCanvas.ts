import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import type { BoardPosition } from "@/domain/pixelCanvas/PixelCanvas";
import { addPixelCanvasWithDrawingLayerToBoard } from "@/domain/pixelCanvas/PixelCanvasOperations";
import { canvasPointToBoardPoint } from "@/domain/layer/ReferenceLayerOperations";
import {
  resolveProjectCanvas,
  touchProject,
  withBoard,
  type Project,
} from "@/domain/project/Project";
import type { Point } from "@/domain/tool/ITool";
import {
  importImageDataToReferenceLayerAtBoardPosition,
  type ImportToReferenceLayerResult,
} from "./ImportToReferenceLayer";
import { importAssetGridToNewDrawingLayerAtPosition } from "./ImportAssetToProject";

export function createCanvasWithDroppedDrawingLayer(
  project: Project,
  grid: PixelGrid,
  boardPosition: BoardPosition,
  layerName?: string,
): Project {
  const nextBoard = addPixelCanvasWithDrawingLayerToBoard(project.board, grid, boardPosition, {
    layerName,
  });
  return touchProject(withBoard(project, nextBoard));
}
export function dropImageAsDrawingLayerOntoCanvas(
  project: Project,
  grid: PixelGrid,
  canvasId: string,
  canvasPoint: Point,
  layerName?: string,
): Project {
  return importAssetGridToNewDrawingLayerAtPosition(
    project,
    grid,
    canvasId,
    {
      x: Math.floor(canvasPoint.x),
      y: Math.floor(canvasPoint.y),
    },
    layerName,
  );
}

export function dropImageAsReferenceLayerOntoCanvas(
  project: Project,
  imageData: ImageData,
  canvasId: string,
  canvasPoint: Point,
  layerName?: string,
): ImportToReferenceLayerResult {
  const canvas = resolveProjectCanvas(project, canvasId);
  if (!canvas) {
    throw new Error(`Canvas not found: ${canvasId}`);
  }

  const boardPoint = canvasPointToBoardPoint(
    {
      x: Math.floor(canvasPoint.x),
      y: Math.floor(canvasPoint.y),
    },
    canvas.boardPosition,
  );

  return importImageDataToReferenceLayerAtBoardPosition(
    project,
    imageData,
    layerName ?? "导入图片",
    boardPoint,
    canvasId,
  );
}
