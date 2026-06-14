import { describe, expect, it } from "vitest";
import {
  adaptPanelPositionOnResize,
  applyMagneticSnap,
  computePanelVisibleRatio,
  detectEdgeAnchor,
  isPanelMostlyOutsideViewport,
} from "@/domain/viewport/FloatingPanelAnchor";

const panel = { width: 100, height: 80 };
const container = { width: 400, height: 300 };

describe("detectEdgeAnchor", () => {
  it("detects bottom-right corner", () => {
    expect(
      detectEdgeAnchor({ x: 300, y: 220 }, panel, container),
    ).toEqual({ horizontal: "right", vertical: "bottom" });
  });

  it("detects top-left corner", () => {
    expect(detectEdgeAnchor({ x: 0, y: 0 }, panel, container)).toEqual({
      horizontal: "left",
      vertical: "top",
    });
  });

  it("returns none when centered", () => {
    expect(detectEdgeAnchor({ x: 150, y: 110 }, panel, container)).toEqual({
      horizontal: "none",
      vertical: "none",
    });
  });
});

describe("applyMagneticSnap", () => {
  it("snaps to right edge when within threshold", () => {
    const result = applyMagneticSnap({ x: 295, y: 110 }, panel, container);
    expect(result.position).toEqual({ x: 300, y: 110 });
    expect(result.anchor.horizontal).toBe("right");
  });

  it("snaps to left and top edges", () => {
    const result = applyMagneticSnap({ x: 8, y: 5 }, panel, container);
    expect(result.position).toEqual({ x: 0, y: 0 });
    expect(result.anchor).toEqual({ horizontal: "left", vertical: "top" });
  });
});

describe("adaptPanelPositionOnResize", () => {
  it("keeps right-bottom anchor after container shrinks", () => {
    const position = adaptPanelPositionOnResize(
      { x: 300, y: 220 },
      panel,
      { horizontal: "right", vertical: "bottom" },
      { width: 320, height: 200 },
    );
    expect(position).toEqual({ x: 220, y: 120 });
  });

  it("clamps unanchored panel into smaller container", () => {
    const position = adaptPanelPositionOnResize(
      { x: 350, y: 250 },
      panel,
      { horizontal: "none", vertical: "none" },
      { width: 320, height: 200 },
    );
    expect(position).toEqual({ x: 220, y: 120 });
  });
});

describe("computePanelVisibleRatio", () => {
  it("returns 1 when fully inside", () => {
    expect(computePanelVisibleRatio({ x: 50, y: 50 }, panel, container)).toBe(1);
  });

  it("returns 0 when fully outside", () => {
    expect(computePanelVisibleRatio({ x: -200, y: -200 }, panel, container)).toBe(0);
  });

  it("returns 0.5 when exactly half visible horizontally", () => {
    const ratio = computePanelVisibleRatio({ x: -50, y: 50 }, panel, container);
    expect(ratio).toBe(0.5);
  });
});

describe("isPanelMostlyOutsideViewport", () => {
  it("does not trigger when exactly half visible", () => {
    expect(
      isPanelMostlyOutsideViewport({ x: -50, y: 50 }, panel, container),
    ).toBe(false);
  });

  it("triggers when less than half visible", () => {
    expect(
      isPanelMostlyOutsideViewport({ x: -60, y: 50 }, panel, container),
    ).toBe(true);
  });
});
