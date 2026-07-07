import { describe, expect, it } from "vitest";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { rgba, TRANSPARENT } from "@/domain/canvas/PixelColor";
import { FillTool, fillColorMatches } from "@/domain/tool/FillTool";
import { DEFAULT_TOOL_SETTINGS } from "@/domain/tool/ToolType";
import type { ToolContext } from "@/domain/tool/ITool";
import { DEFAULT_POINTER_MODIFIERS } from "@/domain/tool/ITool";

function makeContext(
  grid: PixelGrid,
  color: number,
  overrides: Partial<ToolContext> = {},
): ToolContext {
  return {
    grid,
    color,
    settings: { ...DEFAULT_TOOL_SETTINGS },
    modifiers: DEFAULT_POINTER_MODIFIERS,
    ...overrides,
  };
}

describe("fillColorMatches", () => {
  it("treats all fully-transparent pixels as equal regardless of residual RGB", () => {
    const transparentBlack = rgba(0, 0, 0, 0);
    const transparentWhite = rgba(255, 255, 255, 0);
    expect(fillColorMatches(transparentBlack, transparentWhite, 0)).toBe(true);
    expect(fillColorMatches(TRANSPARENT, transparentWhite, 0)).toBe(true);
  });

  it("requires exact match for opaque colors when tolerance is 0", () => {
    expect(fillColorMatches(rgba(10, 10, 10), rgba(12, 10, 10), 0)).toBe(false);
    expect(fillColorMatches(rgba(10, 10, 10), rgba(10, 10, 10), 0)).toBe(true);
  });

  it("matches near colors within tolerance", () => {
    expect(fillColorMatches(rgba(10, 10, 10), rgba(12, 11, 10), 5)).toBe(true);
    expect(fillColorMatches(rgba(10, 10, 10), rgba(40, 10, 10), 5)).toBe(false);
  });
});

describe("FillTool", () => {
  const tool = new FillTool();

  it("fills across transparent pixels that carry different residual RGB", () => {
    const grid = PixelGrid.createEmpty(3, 1);
    grid.setPixel(0, 0, rgba(0, 0, 0, 0));
    grid.setPixel(1, 0, rgba(255, 255, 255, 0));
    grid.setPixel(2, 0, rgba(123, 45, 67, 0));

    const red = rgba(255, 0, 0);
    tool.onPointerDown(makeContext(grid, red), { x: 0, y: 0 });

    expect(grid.getPixel(0, 0)).toBe(red);
    expect(grid.getPixel(1, 0)).toBe(red);
    expect(grid.getPixel(2, 0)).toBe(red);
  });

  it("does not fill near-but-different colors when tolerance is 0", () => {
    const grid = PixelGrid.createEmpty(2, 1);
    grid.setPixel(0, 0, rgba(100, 100, 100));
    grid.setPixel(1, 0, rgba(102, 100, 100));

    const red = rgba(255, 0, 0);
    tool.onPointerDown(makeContext(grid, red), { x: 0, y: 0 });

    expect(grid.getPixel(0, 0)).toBe(red);
    expect(grid.getPixel(1, 0)).toBe(rgba(102, 100, 100));
  });

  it("fills near colors when tolerance allows", () => {
    const grid = PixelGrid.createEmpty(3, 1);
    grid.setPixel(0, 0, rgba(100, 100, 100));
    grid.setPixel(1, 0, rgba(102, 100, 100));
    grid.setPixel(2, 0, rgba(200, 100, 100));

    const red = rgba(255, 0, 0);
    tool.onPointerDown(
      makeContext(grid, red, { settings: { ...DEFAULT_TOOL_SETTINGS, fillTolerance: 5 } }),
      { x: 0, y: 0 },
    );

    expect(grid.getPixel(0, 0)).toBe(red);
    expect(grid.getPixel(1, 0)).toBe(red);
    expect(grid.getPixel(2, 0)).toBe(rgba(200, 100, 100));
  });

  it("fills only contiguous pixels when fillContiguous is true", () => {
    const gray = rgba(100, 100, 100);
    const blue = rgba(0, 0, 255);
    const grid = PixelGrid.createEmpty(3, 1);
    grid.setPixel(0, 0, gray);
    grid.setPixel(1, 0, blue);
    grid.setPixel(2, 0, gray);

    const red = rgba(255, 0, 0);
    tool.onPointerDown(
      makeContext(grid, red, { settings: { ...DEFAULT_TOOL_SETTINGS, fillContiguous: true } }),
      { x: 0, y: 0 },
    );

    expect(grid.getPixel(0, 0)).toBe(red);
    expect(grid.getPixel(1, 0)).toBe(blue);
    expect(grid.getPixel(2, 0)).toBe(gray);
  });

  it("fills all matching pixels when fillContiguous is false", () => {
    const gray = rgba(100, 100, 100);
    const blue = rgba(0, 0, 255);
    const grid = PixelGrid.createEmpty(3, 1);
    grid.setPixel(0, 0, gray);
    grid.setPixel(1, 0, blue);
    grid.setPixel(2, 0, gray);

    const red = rgba(255, 0, 0);
    tool.onPointerDown(
      makeContext(grid, red, { settings: { ...DEFAULT_TOOL_SETTINGS, fillContiguous: false } }),
      { x: 0, y: 0 },
    );

    expect(grid.getPixel(0, 0)).toBe(red);
    expect(grid.getPixel(1, 0)).toBe(blue);
    expect(grid.getPixel(2, 0)).toBe(red);
  });
});
