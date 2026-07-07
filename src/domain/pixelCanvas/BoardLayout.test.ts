import { describe, expect, it } from "vitest";
import { createEmptyReferenceLayer } from "@/domain/layer/Layer";
import { createEmptyProject } from "@/domain/project/Project";
import { addPixelCanvasToBoard } from "@/domain/pixelCanvas/PixelCanvasOperations";
import {
  boardRenderOrigin,
  canRevealStageRectInViewport,
  computeBoardContentBounds,
  computeBoardLayout,
  computeCanvasCompositeDisplayRect,
  computeBoardStageScrollLimits,
  hitTestBoardCanvas,
  resolveCanvasDropTarget,
  stagePointToBoardPoint,
} from "@/domain/pixelCanvas/BoardLayout";

function referenceWithBounds(
  position: { x: number; y: number },
  size: { width: number; height: number },
) {
  return {
    ...createEmptyReferenceLayer("ref"),
    visible: true,
    imageData: "data:image/png;base64,test",
    imageSize: size,
    crop: { x: 0, y: 0, width: size.width, height: size.height },
    position,
    scale: 1,
  };
}

describe("BoardLayout", () => {
  it("keeps first canvas position stable when adding another canvas", () => {
    const project = createEmptyProject("test");
    const layoutBefore = computeBoardLayout(800, 600, project.board.canvases, 2);
    const firstBefore = layoutBefore.canvases[0];

    const board = addPixelCanvasToBoard(project.board, "画板 2");
    const layoutAfter = computeBoardLayout(800, 600, board.canvases, 2);
    const firstAfter = layoutAfter.canvases.find(
      (layout) => layout.canvasId === firstBefore.canvasId,
    );

    expect(firstAfter?.left).toBe(firstBefore.left);
    expect(firstAfter?.top).toBe(firstBefore.top);
  });

  it("computes layout for multiple canvases with absolute board positions", () => {
    const project = createEmptyProject("test");
    const board = addPixelCanvasToBoard(project.board, "画板 2");
    const layout = computeBoardLayout(800, 600, board.canvases, 2);
    expect(layout.canvases).toHaveLength(2);
    expect(layout.stageWidth).toBeGreaterThanOrEqual(800);
    expect(layout.canvases[1].left).toBeGreaterThan(layout.canvases[0].left);
  });

  it("hit tests canvas under stage point", () => {
    const project = createEmptyProject("test");
    const board = addPixelCanvasToBoard(project.board, "画板 2");
    const layout = computeBoardLayout(800, 600, board.canvases, 1);
    const first = layout.canvases[0];
    const hit = hitTestBoardCanvas(layout, first.left + 4, first.top + 4);
    expect(hit).toBe(first.canvasId);
  });

  it("resolves canvas drop target from stage coordinates", () => {
    const project = createEmptyProject("test");
    const layout = computeBoardLayout(800, 600, project.board.canvases, 2);
    const canvasLayout = layout.canvases[0];
    const zoom = 2;
    const stageX = canvasLayout.left + 5 * zoom;
    const stageY = canvasLayout.top + 7 * zoom;
    const target = resolveCanvasDropTarget(layout, stageX, stageY, zoom);
    expect(target?.canvasId).toBe(canvasLayout.canvasId);
    expect(target?.canvasPoint).toEqual({ x: 5, y: 7 });
  });

  it("returns null when drop is outside all canvases", () => {
    const project = createEmptyProject("test");
    const layout = computeBoardLayout(800, 600, project.board.canvases, 1);
    expect(resolveCanvasDropTarget(layout, -10, -10, 1)).toBeNull();
  });

  it("converts stage coordinates to board coordinates", () => {
    const project = createEmptyProject("test");
    const zoom = 2;
    const layout = computeBoardLayout(800, 600, project.board.canvases, zoom);
    const canvasLayout = layout.canvases[0];
    const boardPoint = stagePointToBoardPoint(
      layout,
      canvasLayout.left + 6 * zoom,
      canvasLayout.top + 4 * zoom,
      zoom,
    );
    expect(boardPoint).toEqual({ x: 6, y: 4 });
  });

  it("computes content bounds covering all canvases", () => {
    const project = createEmptyProject("test");
    const board = addPixelCanvasToBoard(project.board, "画板 2");
    const layout = computeBoardLayout(800, 600, board.canvases, 2);
    const bounds = computeBoardContentBounds(layout);
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
    for (const canvas of layout.canvases) {
      expect(canvas.left).toBeGreaterThanOrEqual(bounds.left);
      expect(canvas.top).toBeGreaterThanOrEqual(bounds.top);
    }
  });

  it("expands stage and content bounds when a reference layer extends beyond canvases", () => {
    const project = createEmptyProject("test");
    const reference = referenceWithBounds({ x: 200, y: 40 }, { width: 80, height: 60 });
    const layoutWithoutRef = computeBoardLayout(800, 600, project.board.canvases, 2);
    const layoutWithRef = computeBoardLayout(
      800,
      600,
      project.board.canvases,
      2,
      [reference],
    );
    const boundsWithoutRef = computeBoardContentBounds(layoutWithoutRef);
    const boundsWithRef = computeBoardContentBounds(layoutWithRef, [reference], 2);

    expect(layoutWithRef.stageWidth).toBeGreaterThan(layoutWithoutRef.stageWidth);
    expect(boundsWithRef.width).toBeGreaterThan(boundsWithoutRef.width);
    expect(boundsWithRef.left + boundsWithRef.width).toBeGreaterThan(
      boundsWithoutRef.left + boundsWithoutRef.width,
    );
  });

  it("keeps canvas composite display rect aspect ratio when reference layers expand content bounds", () => {
    const project = createEmptyProject("test", { width: 64, height: 32 });
    const reference = referenceWithBounds({ x: 200, y: 0 }, { width: 128, height: 128 });
    const zoom = 2;
    const layout = computeBoardLayout(
      800,
      600,
      project.board.canvases,
      zoom,
      [reference],
    );
    const contentBounds = computeBoardContentBounds(layout, [reference], zoom);
    const compositeRect = computeCanvasCompositeDisplayRect(
      layout,
      contentBounds,
      zoom,
    );

    expect(compositeRect.width / compositeRect.height).toBeCloseTo(64 / 32, 5);
    expect(contentBounds.width / contentBounds.height).not.toBeCloseTo(64 / 32, 1);
    expect(compositeRect.x).toBeGreaterThanOrEqual(0);
    expect(compositeRect.y).toBeGreaterThanOrEqual(0);
  });

  it("allows scrolling to fully reveal a reference layer placed beside canvases", () => {
    const project = createEmptyProject("test", { width: 64, height: 64 });
    const reference = referenceWithBounds({ x: 400, y: 0 }, { width: 256, height: 256 });
    const containerWidth = 1200;
    const containerHeight = 800;
    const zoom = 4;
    const layout = computeBoardLayout(
      containerWidth,
      containerHeight,
      project.board.canvases,
      zoom,
      [reference],
    );
    const origin = boardRenderOrigin(layout);
    const refLeft = origin.left + reference.position.x * zoom;
    const refRight = refLeft + reference.crop!.width * zoom;
    const refRect = {
      left: refLeft,
      top: origin.top + reference.position.y * zoom,
      right: refRight,
      bottom: origin.top + reference.position.y * zoom + reference.crop!.height * zoom,
    };

    expect(
      canRevealStageRectInViewport(layout, containerWidth, containerHeight, refRect),
    ).toBe(true);

    const { maxScrollX } = computeBoardStageScrollLimits(
      layout,
      containerWidth,
      containerHeight,
    );
    expect(refRight - containerWidth).toBeLessThanOrEqual(maxScrollX);
    expect(refLeft).toBeGreaterThanOrEqual(0);
  });

  it("shifts content into view when a reference layer uses negative board coordinates", () => {
    const project = createEmptyProject("test", { width: 64, height: 64 });
    const reference = referenceWithBounds({ x: -80, y: -40 }, { width: 128, height: 128 });
    const layout = computeBoardLayout(1200, 800, project.board.canvases, 2, [reference]);
    const origin = boardRenderOrigin(layout);

    expect(layout.contentShiftX).toBeGreaterThan(0);
    expect(layout.contentShiftY).toBeGreaterThan(0);
    expect(origin.left + reference.position.x * 2).toBeGreaterThanOrEqual(layout.originLeft);
    expect(origin.top + reference.position.y * 2).toBeGreaterThanOrEqual(layout.originTop);
  });
});
