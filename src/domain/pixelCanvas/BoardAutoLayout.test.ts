import { describe, expect, it } from "vitest";
import { createEmptyProject } from "@/domain/project/Project";
import { addPixelCanvasToBoard } from "@/domain/pixelCanvas/PixelCanvasOperations";
import {
  computeMinimumSquareBoardLayout,
  layoutCanvasesOnBoard,
} from "@/domain/pixelCanvas/BoardAutoLayout";
import { BOARD_CANVAS_GAP } from "@/domain/pixelCanvas/PixelCanvasOperations";

describe("BoardAutoLayout", () => {
  it("uses the shared 16px board gap constant", () => {
    expect(BOARD_CANVAS_GAP).toBe(16);
  });

  it("normalizes layout to origin (0, 0)", () => {
    const positions = computeMinimumSquareBoardLayout(
      [
        { canvasId: "a", width: 64, height: 64 },
        { canvasId: "b", width: 32, height: 32 },
      ],
      16,
    );

    let minX = Infinity;
    let minY = Infinity;
    for (const pos of positions.values()) {
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
    }
    expect(minX).toBe(0);
    expect(minY).toBe(0);
  });

  it("keeps 16px gap between adjacent canvases", () => {
    const positions = computeMinimumSquareBoardLayout(
      [
        { canvasId: "a", width: 64, height: 64 },
        { canvasId: "b", width: 64, height: 64 },
      ],
      16,
    );

    const a = positions.get("a")!;
    const b = positions.get("b")!;
    if (a.y === b.y) {
      const left = a.x < b.x ? a : b;
      const right = a.x < b.x ? b : a;
      expect(right.x - (left.x + 64)).toBe(16);
    } else {
      const top = a.y < b.y ? a : b;
      const bottom = a.y < b.y ? b : a;
      expect(bottom.y - (top.y + 64)).toBe(16);
    }
  });

  it("prefers a tighter square layout for three mixed-size canvases", () => {
    const positions = computeMinimumSquareBoardLayout(
      [
        { canvasId: "a", width: 64, height: 64 },
        { canvasId: "b", width: 64, height: 64 },
        { canvasId: "c", width: 32, height: 32 },
      ],
      16,
    );

    expect(positions.size).toBe(3);
    const xs = [...positions.values()].map((pos) => pos.x);
    const ys = [...positions.values()].map((pos) => pos.y);
    expect(new Set(xs).size).toBeGreaterThan(1);
    expect(Math.min(...ys)).toBe(0);
  });

  it("updates all canvases on board via layoutCanvasesOnBoard", () => {
    const project = createEmptyProject("test");
    let board = addPixelCanvasToBoard(project.board, "画板 2");
    board = addPixelCanvasToBoard(board, "画板 3");
    const nextBoard = layoutCanvasesOnBoard(board);

    expect(nextBoard.canvases).toHaveLength(3);
    for (const canvas of nextBoard.canvases) {
      expect(canvas.boardPosition.x).toBeGreaterThanOrEqual(0);
      expect(canvas.boardPosition.y).toBeGreaterThanOrEqual(0);
    }
  });
});
