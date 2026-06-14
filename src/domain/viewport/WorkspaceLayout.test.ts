import { describe, expect, it } from "vitest";

import {
  computeFitContainerStageSize,
  computeInitialScrollPosition,
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
