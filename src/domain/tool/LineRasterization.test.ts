import { describe, expect, it } from "vitest";
import {
  forEachContinuousLinePixel,
  forEachContinuousLinePixelWithBrushFix,
  forEachLineSegmentPixel,
} from "@/domain/tool/LineRasterization";

function collectLinePixels(
  walk: (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    callback: (x: number, y: number) => void,
  ) => void,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): string[] {
  const pixels: string[] = [];
  walk(x0, y0, x1, y1, (x, y) => pixels.push(`${x},${y}`));
  return pixels;
}

function is8Connected(a: string, b: string): boolean {
  const [ax, ay] = a.split(",").map(Number);
  const [bx, by] = b.split(",").map(Number);
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by)) === 1;
}

function assertConnectedPath(pixels: string[]): void {
  for (let i = 1; i < pixels.length; i++) {
    expect(is8Connected(pixels[i - 1], pixels[i])).toBe(true);
  }
}

describe("LineRasterization", () => {
  it("draws a horizontal line without gaps", () => {
    const pixels = collectLinePixels(forEachContinuousLinePixel, 0, 2, 5, 2);
    expect(pixels).toEqual(["0,2", "1,2", "2,2", "3,2", "4,2", "5,2"]);
  });

  it("draws a vertical line without gaps", () => {
    const pixels = collectLinePixels(forEachContinuousLinePixel, 3, 0, 3, 4);
    expect(pixels).toEqual(["3,0", "3,1", "3,2", "3,3", "3,4"]);
  });

  it("draws a diagonal line as an 8-connected path", () => {
    const pixels = collectLinePixels(forEachContinuousLinePixel, 0, 0, 4, 4);
    expect(pixels[0]).toBe("0,0");
    expect(pixels[pixels.length - 1]).toBe("4,4");
    expect(pixels.length).toBe(5);
    assertConnectedPath(pixels);
  });

  it("fills a long jump segment without missing pixels", () => {
    const pixels = collectLinePixels(forEachContinuousLinePixel, 0, 0, 10, 0);
    expect(pixels.length).toBe(11);
    assertConnectedPath(pixels);
  });

  it("skips the start point when walking a segment", () => {
    const pixels: string[] = [];
    forEachLineSegmentPixel(1, 1, 4, 1, false, (x, y) => pixels.push(`${x},${y}`));
    expect(pixels).toEqual(["2,1", "3,1", "4,1"]);
  });

  it("adds corner pixels with brush fix on diagonal steps", () => {
    const normal = collectLinePixels(forEachContinuousLinePixel, 0, 0, 2, 2);
    const fixed = collectLinePixels(forEachContinuousLinePixelWithBrushFix, 0, 0, 2, 2);
    expect(fixed.length).toBeGreaterThanOrEqual(normal.length);
    assertConnectedPath(fixed);
  });
});
