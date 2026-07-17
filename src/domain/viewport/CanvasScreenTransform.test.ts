import { describe, expect, it } from "vitest";
import {
  canvasScreenTransformFromViewport,
  canvasStageScreenTransform,
  logicalRectToScreenHeight,
  logicalRectToScreenWidth,
  logicalToScreenX,
  logicalToScreenY,
} from "./CanvasScreenTransform";

describe("CanvasScreenTransform", () => {
  const transform = canvasScreenTransformFromViewport(400, 300, 100, 50, 8);

  it("computes offset from stage position minus scroll", () => {
    expect(transform.offsetX).toBe(300);
    expect(transform.offsetY).toBe(250);
    expect(transform.zoom).toBe(8);
  });

  it("maps logical coordinates to screen CSS pixels", () => {
    expect(logicalToScreenX(10, transform)).toBe(380);
    expect(logicalToScreenY(5, transform)).toBe(290);
  });

  it("maps logical dimensions to screen CSS pixels", () => {
    expect(logicalRectToScreenWidth(16, transform)).toBe(128);
    expect(logicalRectToScreenHeight(32, transform)).toBe(256);
  });

  it("builds stage-local transform for scroll-offset wrapper", () => {
    const stage = canvasStageScreenTransform(400, 300, 8);
    expect(stage).toEqual({ offsetX: 400, offsetY: 300, zoom: 8 });
    expect(logicalToScreenX(10, stage)).toBe(480);
  });
});
