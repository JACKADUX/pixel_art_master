import { describe, expect, it } from "vitest";
import {
  computeRotationAngleDelta,
  getTransformHandleCursor,
  hitTestTransformHandleAtBounds,
  ROTATION_SNAP_DEG,
} from "@/domain/selection/TransformHandleInteraction";

const bounds = { x: 10, y: 20, width: 40, height: 30 };

describe("hitTestTransformHandleAtBounds", () => {
  it("prioritizes corners over edge segments", () => {
    expect(hitTestTransformHandleAtBounds({ x: 10, y: 20 }, bounds, 1)).toBe(
      "topLeft",
    );
  });

  it("hits the full top edge away from the center handle", () => {
    expect(hitTestTransformHandleAtBounds({ x: 18, y: 20 }, bounds, 1)).toBe(
      "top",
    );
  });

  it("hits the full right edge away from the center handle", () => {
    expect(hitTestTransformHandleAtBounds({ x: 50, y: 28 }, bounds, 1)).toBe(
      "right",
    );
  });

  it("returns move inside the transform bounds", () => {
    expect(hitTestTransformHandleAtBounds({ x: 25, y: 30 }, bounds, 1)).toBe(
      "move",
    );
  });
});

describe("getTransformHandleCursor", () => {
  it("maps transform handles to matching CSS cursors", () => {
    expect(getTransformHandleCursor("topLeft")).toBe("nwse-resize");
    expect(getTransformHandleCursor("topRight")).toBe("nesw-resize");
    expect(getTransformHandleCursor("top")).toBe("ns-resize");
    expect(getTransformHandleCursor("right")).toBe("ew-resize");
    expect(getTransformHandleCursor("rotate")).toBe("grab");
    expect(getTransformHandleCursor("move")).toBe("move");
  });
});

describe("computeRotationAngleDelta", () => {
  it("snaps rotation deltas to five degrees while shift is held", () => {
    const delta = computeRotationAngleDelta(
      { x: 0, y: 0 },
      0,
      { x: 10, y: 1 },
      true,
    );

    expect(ROTATION_SNAP_DEG).toBe(5);
    expect(delta).toBe(5);
  });

  it("keeps free rotation when shift is not held", () => {
    const delta = computeRotationAngleDelta(
      { x: 0, y: 0 },
      0,
      { x: 10, y: 1 },
      false,
    );

    expect(delta).toBeCloseTo((Math.atan2(1, 10) * 180) / Math.PI, 5);
  });
});
