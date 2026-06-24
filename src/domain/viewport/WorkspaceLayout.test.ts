import { describe, expect, it } from "vitest";

import {
  WORKSPACE_EDGE_VISIBLE_MIN,
  WORKSPACE_MARGIN_MIN,
  computeFitContainerStageSize,
  computeInitialScrollPosition,
  computePanMargin,
  computeReferenceAwareStageSize,
  computeWorkspaceStageSize,
} from "./WorkspaceLayout";

describe("computeFitContainerStageSize", () => {
  it("centers fitted image in container with zero scroll", () => {
    const containerWidth = 1200;
    const containerHeight = 800;
    const displayWidth = 400;
    const displayHeight = 300;

    const layout = computeFitContainerStageSize(
      containerWidth,
      containerHeight,
      displayWidth,
      displayHeight,
    );

    expect(layout.stageWidth).toBe(containerWidth);
    expect(layout.stageHeight).toBe(containerHeight);
    expect(layout.canvasLeft).toBe(400);
    expect(layout.canvasTop).toBe(250);

    const scroll = computeInitialScrollPosition(
      layout.canvasLeft,
      layout.canvasTop,
      displayWidth,
      displayHeight,
      containerWidth,
      containerHeight,
    );

    expect(scroll.scrollLeft).toBe(0);
    expect(scroll.scrollTop).toBe(0);
  });

  it("expands stage when zoomed image exceeds container", () => {
    const layout = computeFitContainerStageSize(800, 600, 1600, 1200);

    expect(layout.stageWidth).toBe(1600);
    expect(layout.stageHeight).toBe(1200);
    expect(layout.canvasLeft).toBe(0);
    expect(layout.canvasTop).toBe(0);
  });
});

describe("computePanMargin", () => {
  it("keeps the minimum margin for small containers", () => {
    expect(computePanMargin(400)).toBe(WORKSPACE_MARGIN_MIN);
  });

  it("scales with the container so the canvas can reach the edge", () => {
    expect(computePanMargin(2000)).toBe(2000 - WORKSPACE_EDGE_VISIBLE_MIN);
  });
});

describe("computeReferenceAwareStageSize pan range", () => {
  it("still provides pan room when a large window dwarfs a small canvas", () => {
    const containerWidth = 3000;
    const containerHeight = 2000;
    const displayWidth = 200;
    const displayHeight = 150;

    const layout = computeReferenceAwareStageSize(
      containerWidth,
      containerHeight,
      displayWidth,
      displayHeight,
      [],
      1,
    );

    // Stage must exceed the container, otherwise there is zero scroll room.
    expect(layout.stageWidth).toBeGreaterThan(containerWidth);
    expect(layout.stageHeight).toBeGreaterThan(containerHeight);
  });

  it("lets the canvas be dragged until only the minimum sliver stays visible", () => {
    const containerWidth = 3000;
    const containerHeight = 2000;
    const displayWidth = 200;
    const displayHeight = 150;

    const layout = computeReferenceAwareStageSize(
      containerWidth,
      containerHeight,
      displayWidth,
      displayHeight,
      [],
      1,
    );

    // At scrollLeft = 0 the canvas sits canvasLeft from the stage origin, which
    // leaves exactly WORKSPACE_EDGE_VISIBLE_MIN of the canvas visible at the right edge.
    const visibleAtRightEdge = containerWidth - layout.canvasLeft;
    const visibleAtBottomEdge = containerHeight - layout.canvasTop;
    expect(visibleAtRightEdge).toBeCloseTo(WORKSPACE_EDGE_VISIBLE_MIN);
    expect(visibleAtBottomEdge).toBeCloseTo(WORKSPACE_EDGE_VISIBLE_MIN);
  });
});

describe("computeWorkspaceStageSize pan range", () => {
  it("no longer collapses to the container size for large windows", () => {
    const containerWidth = 3000;
    const containerHeight = 2000;

    const layout = computeWorkspaceStageSize(containerWidth, containerHeight, 200, 150);

    expect(layout.stageWidth).toBeGreaterThan(containerWidth);
    expect(layout.stageHeight).toBeGreaterThan(containerHeight);
  });
});
