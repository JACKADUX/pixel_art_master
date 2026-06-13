import { describe, expect, it } from "vitest";
import {
  computeResizeRectFromHandle,
  type CanvasRect,
} from "@/domain/selection/ResizeTransform";

const initial: CanvasRect = { x: 10, y: 20, width: 40, height: 20 };

describe("computeResizeRectFromHandle", () => {
  it("keeps the left edge fixed when dragging the right handle", () => {
    const result = computeResizeRectFromHandle("right", initial, { x: 59, y: 25 }, {
      shiftKey: false,
      altKey: false,
    });
    expect(result.x).toBe(10);
    expect(result.y).toBe(20);
    expect(result.height).toBe(20);
    expect(result.width).toBe(50);
  });

  it("keeps the right edge fixed when dragging the left handle", () => {
    const result = computeResizeRectFromHandle("left", initial, { x: 15, y: 25 }, {
      shiftKey: false,
      altKey: false,
    });
    expect(result.x).toBe(15);
    expect(result.width).toBe(35);
    expect(result.y).toBe(20);
    expect(result.height).toBe(20);
    expect(result.x + result.width - 1).toBe(49);
  });

  it("keeps the bottom-left corner fixed when dragging the top-right handle", () => {
    const result = computeResizeRectFromHandle("topRight", initial, { x: 55, y: 15 }, {
      shiftKey: false,
      altKey: false,
    });
    expect(result.x).toBe(10);
    expect(result.y).toBe(15);
    expect(result.width).toBe(46);
    expect(result.height).toBe(25);
    expect(result.y + result.height - 1).toBe(39);
  });

  it("preserves aspect ratio from the top-left corner when shift-dragging bottom-right", () => {
    const result = computeResizeRectFromHandle(
      "bottomRight",
      initial,
      { x: 70, y: 50 },
      { shiftKey: true, altKey: false },
    );
    expect(result.x).toBe(10);
    expect(result.y).toBe(20);
    expect(result.width / result.height).toBeCloseTo(initial.width / initial.height, 5);
  });

  it("expands symmetrically from the center when alt-dragging the right handle", () => {
    const centerX = initial.x + initial.width / 2;
    const result = computeResizeRectFromHandle("right", initial, { x: 59, y: 25 }, {
      shiftKey: false,
      altKey: true,
    });
    expect(result.x + result.width / 2).toBeCloseTo(centerX, 5);
    expect(result.y).toBe(initial.y);
    expect(result.height).toBe(initial.height);
    expect(result.width).toBeGreaterThan(initial.width);
  });
});
