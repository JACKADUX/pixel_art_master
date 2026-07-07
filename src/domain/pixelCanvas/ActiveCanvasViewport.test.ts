import { describe, expect, it } from "vitest";

import { createEmptyProject } from "@/domain/project/Project";

import { withActiveCanvasId } from "@/domain/pixelCanvas/CanvasBoard";

import { addPixelCanvasToBoard } from "@/domain/pixelCanvas/PixelCanvasOperations";

import {

  computeActiveCanvasCenterScroll,

  computeFitZoomForActiveCanvas,

  planFitActiveCanvasViewport,

} from "@/domain/pixelCanvas/ActiveCanvasViewport";

import { computeBoardLayout } from "@/domain/pixelCanvas/BoardLayout";

import { EDITOR_MIN_ZOOM } from "@/domain/viewport/EditorZoom";



describe("computeFitZoomForActiveCanvas", () => {

  it("fits canvas inside container with fractional zoom when needed", () => {

    expect(computeFitZoomForActiveCanvas(920, 680, 64, 64)).toBeCloseTo(9.77, 1);

    expect(computeFitZoomForActiveCanvas(200, 200, 64, 64)).toBeCloseTo(2.875, 2);

  });



  it("fits 1024 canvas in typical viewport below 1x", () => {

    const zoom = computeFitZoomForActiveCanvas(800, 600, 1024, 1024);

    expect(zoom).toBeLessThan(1);

    expect(zoom).toBeCloseTo(0.539, 2);

    expect(1024 * zoom).toBeLessThanOrEqual(800 * 0.92);

    expect(1024 * zoom).toBeLessThanOrEqual(600 * 0.92);

  });



  it("clamps to editor minimum zoom when fit is below range", () => {

    expect(computeFitZoomForActiveCanvas(10, 10, 1024, 1024)).toBe(EDITOR_MIN_ZOOM);

  });



  it("allows fractional fit above minimum zoom", () => {

    expect(computeFitZoomForActiveCanvas(40, 40, 256, 256)).toBeCloseTo(0.14375, 4);

  });

});



describe("planFitActiveCanvasViewport", () => {

  it("centers the active canvas after choosing a fit zoom", () => {

    const project = createEmptyProject("test", { width: 64, height: 64 });

    const containerWidth = 960;

    const containerHeight = 720;

    const plan = planFitActiveCanvasViewport(

      containerWidth,

      containerHeight,

      project.board,

      project.referenceLayers,

    );



    expect(plan).not.toBeNull();

    const boardLayout = computeBoardLayout(

      containerWidth,

      containerHeight,

      project.board.canvases,

      plan!.zoom,

      project.referenceLayers,

    );

    const activeLayout = boardLayout.canvases.find(

      (layout) => layout.canvasId === project.board.activeCanvasId,

    );

    expect(activeLayout).toBeDefined();



    const scroll = computeActiveCanvasCenterScroll(

      activeLayout!,

      containerWidth,

      containerHeight,

      boardLayout,

    );

    expect(plan!.scrollLeft).toBe(scroll.scrollLeft);

    expect(plan!.scrollTop).toBe(scroll.scrollTop);

  });



  it("uses the active canvas even when multiple canvases exist", () => {

    const project = createEmptyProject("test", { width: 32, height: 32 });

    const firstCanvasId = project.board.activeCanvasId;

    const boardWithSecond = addPixelCanvasToBoard(project.board, "画板 2");

    const board = withActiveCanvasId(boardWithSecond, firstCanvasId);

    const secondCanvas = board.canvases.find((canvas) => canvas.name === "画板 2");

    expect(secondCanvas).toBeDefined();



    const plan = planFitActiveCanvasViewport(800, 600, board, []);

    expect(plan).not.toBeNull();



    const boardLayout = computeBoardLayout(800, 600, board.canvases, plan!.zoom, []);

    const activeLayout = boardLayout.canvases.find(

      (layout) => layout.canvasId === board.activeCanvasId,

    );

    expect(activeLayout?.canvasId).toBe(firstCanvasId);

    expect(activeLayout?.canvasId).not.toBe(secondCanvas!.id);

  });

});


