import { describe, expect, it } from "vitest";
import {
  collectCircleStampOffsets,
  forEachFilledEllipsePixel,
  forEachOutlineEllipsePixel,
} from "@/domain/geometry/EllipseFill";
import { forEachStampPixel } from "@/domain/tool/BrushStamp";

const NEIGHBORS_8: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
];

function collectOutlinePixels(x0: number, y0: number, x1: number, y1: number): Set<string> {
  const pixels = new Set<string>();
  forEachOutlineEllipsePixel(x0, y0, x1, y1, 0, 0, (x, y) => {
    pixels.add(`${x},${y}`);
  });
  return pixels;
}

function collectFilledEllipsePixels(x0: number, y0: number, x1: number, y1: number): Set<string> {
  const pixels = new Set<string>();
  forEachFilledEllipsePixel(x0, y0, x1, y1, 0, 0, (x, y) => {
    pixels.add(`${x},${y}`);
  });
  return pixels;
}

function assert8Connected(pixels: Set<string>): void {
  if (pixels.size <= 1) return;
  for (const key of pixels) {
    const [x, y] = key.split(",").map(Number);
    const hasNeighbor = NEIGHBORS_8.some(([dx, dy]) => pixels.has(`${x + dx},${y + dy}`));
    expect(hasNeighbor).toBe(true);
  }
}

function sortPixels(pixels: string[]): string[] {
  return pixels.sort((a, b) => {
    const [ax, ay] = a.split(",").map(Number);
    const [bx, by] = b.split(",").map(Number);
    return ay - by || ax - bx;
  });
}

function collectRelativeCirclePixels(size: number): string[] {
  const pixels: string[] = [];
  forEachStampPixel({ x: 0, y: 0 }, size, "circle", (x, y) => {
    pixels.push(`${x},${y}`);
  });
  return sortPixels(pixels);
}

function collectAbsoluteCirclePixels(size: number): string[] {
  const half = Math.floor(size / 2);
  const pixels: string[] = [];
  for (const [dx, dy] of collectCircleStampOffsets(size)) {
    pixels.push(`${dx + half},${dy + half}`);
  }
  return sortPixels(pixels);
}

function assertBitmapSymmetric(pixels: Set<string>, size: number): void {
  for (const key of pixels) {
    const [x, y] = key.split(",").map(Number);
    expect(pixels.has(`${size - 1 - x},${y}`)).toBe(true);
    expect(pixels.has(`${x},${size - 1 - y}`)).toBe(true);
    expect(pixels.has(`${size - 1 - x},${size - 1 - y}`)).toBe(true);
  }
}

describe("EllipseFill", () => {
  it("returns a single pixel for size 1", () => {
    expect(collectCircleStampOffsets(1)).toEqual([[0, 0]]);
  });

  it("keeps circle stamps symmetric in bitmap space for sizes 1 through 16", () => {
    for (let size = 1; size <= 16; size++) {
      const pixels = new Set(collectAbsoluteCirclePixels(size));
      assertBitmapSymmetric(pixels, size);
    }
  });

  it("keeps circle stamps within the size bounding box for sizes 1 through 16", () => {
    for (let size = 1; size <= 16; size++) {
      for (const key of collectAbsoluteCirclePixels(size)) {
        const [x, y] = key.split(",").map(Number);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(size);
        expect(y).toBeLessThan(size);
      }
    }
  });

  it("grows monotonically from size 1 through 16", () => {
    let previousCount = 0;
    for (let size = 1; size <= 16; size++) {
      const count = collectCircleStampOffsets(size).length;
      expect(count).toBeGreaterThanOrEqual(previousCount);
      previousCount = count;
    }
  });

  it("matches Aseprite circle brush snapshots for key sizes", () => {
    const snapshots: Record<number, string[]> = {
      1: ["0,0"],
      2: ["-1,-1", "-1,0", "0,-1", "0,0"],
      3: ["-1,0", "0,-1", "0,0", "0,1", "1,0"],
      4: [
        "-1,-1", "-1,-2", "-1,0", "-1,1",
        "-2,-1", "-2,0",
        "0,-1", "0,-2", "0,0", "0,1",
        "1,-1", "1,0",
      ],
      5: [
        "-1,-1", "-1,-2", "-1,0", "-1,1", "-1,2",
        "-2,-1", "-2,0", "-2,1",
        "0,-1", "0,-2", "0,0", "0,1", "0,2",
        "1,-1", "1,-2", "1,0", "1,1", "1,2",
        "2,-1", "2,0", "2,1",
      ],
      6: [
        "-1,-1", "-1,-2", "-1,-3", "-1,0", "-1,1", "-1,2",
        "-2,-1", "-2,-2", "-2,0", "-2,1",
        "-3,-1", "-3,0",
        "0,-1", "0,-2", "0,-3", "0,0", "0,1", "0,2",
        "1,-1", "1,-2", "1,0", "1,1",
        "2,-1", "2,0",
      ],
      8: [
        "-1,-1", "-1,-2", "-1,-3", "-1,-4", "-1,0", "-1,1", "-1,2", "-1,3",
        "-2,-1", "-2,-2", "-2,-3", "-2,-4", "-2,0", "-2,1", "-2,2", "-2,3",
        "-3,-1", "-3,-2", "-3,-3", "-3,0", "-3,1", "-3,2",
        "-4,-1", "-4,-2", "-4,0", "-4,1",
        "0,-1", "0,-2", "0,-3", "0,-4", "0,0", "0,1", "0,2", "0,3",
        "1,-1", "1,-2", "1,-3", "1,-4", "1,0", "1,1", "1,2", "1,3",
        "2,-1", "2,-2", "2,-3", "2,0", "2,1", "2,2",
        "3,-1", "3,-2", "3,0", "3,1",
      ],
      12: [
        "-1,-1", "-1,-2", "-1,-3", "-1,-4", "-1,-5", "-1,-6", "-1,0", "-1,1", "-1,2", "-1,3", "-1,4", "-1,5",
        "-2,-1", "-2,-2", "-2,-3", "-2,-4", "-2,-5", "-2,-6", "-2,0", "-2,1", "-2,2", "-2,3", "-2,4", "-2,5",
        "-3,-1", "-3,-2", "-3,-3", "-3,-4", "-3,-5", "-3,0", "-3,1", "-3,2", "-3,3", "-3,4",
        "-4,-1", "-4,-2", "-4,-3", "-4,-4", "-4,-5", "-4,0", "-4,1", "-4,2", "-4,3", "-4,4",
        "-5,-1", "-5,-2", "-5,-3", "-5,-4", "-5,0", "-5,1", "-5,2", "-5,3",
        "-6,-1", "-6,-2", "-6,0", "-6,1",
        "0,-1", "0,-2", "0,-3", "0,-4", "0,-5", "0,-6", "0,0", "0,1", "0,2", "0,3", "0,4", "0,5",
        "1,-1", "1,-2", "1,-3", "1,-4", "1,-5", "1,-6", "1,0", "1,1", "1,2", "1,3", "1,4", "1,5",
        "2,-1", "2,-2", "2,-3", "2,-4", "2,-5", "2,0", "2,1", "2,2", "2,3", "2,4",
        "3,-1", "3,-2", "3,-3", "3,-4", "3,-5", "3,0", "3,1", "3,2", "3,3", "3,4",
        "4,-1", "4,-2", "4,-3", "4,-4", "4,0", "4,1", "4,2", "4,3",
        "5,-1", "5,-2", "5,0", "5,1",
      ],
      16: [
        "-1,-1", "-1,-2", "-1,-3", "-1,-4", "-1,-5", "-1,-6", "-1,-7", "-1,-8", "-1,0", "-1,1", "-1,2", "-1,3", "-1,4", "-1,5", "-1,6", "-1,7",
        "-2,-1", "-2,-2", "-2,-3", "-2,-4", "-2,-5", "-2,-6", "-2,-7", "-2,-8", "-2,0", "-2,1", "-2,2", "-2,3", "-2,4", "-2,5", "-2,6", "-2,7",
        "-3,-1", "-3,-2", "-3,-3", "-3,-4", "-3,-5", "-3,-6", "-3,-7", "-3,0", "-3,1", "-3,2", "-3,3", "-3,4", "-3,5", "-3,6",
        "-4,-1", "-4,-2", "-4,-3", "-4,-4", "-4,-5", "-4,-6", "-4,-7", "-4,0", "-4,1", "-4,2", "-4,3", "-4,4", "-4,5", "-4,6",
        "-5,-1", "-5,-2", "-5,-3", "-5,-4", "-5,-5", "-5,-6", "-5,0", "-5,1", "-5,2", "-5,3", "-5,4", "-5,5",
        "-6,-1", "-6,-2", "-6,-3", "-6,-4", "-6,-5", "-6,0", "-6,1", "-6,2", "-6,3", "-6,4",
        "-7,-1", "-7,-2", "-7,-3", "-7,-4", "-7,0", "-7,1", "-7,2", "-7,3",
        "-8,-1", "-8,-2", "-8,0", "-8,1",
        "0,-1", "0,-2", "0,-3", "0,-4", "0,-5", "0,-6", "0,-7", "0,-8", "0,0", "0,1", "0,2", "0,3", "0,4", "0,5", "0,6", "0,7",
        "1,-1", "1,-2", "1,-3", "1,-4", "1,-5", "1,-6", "1,-7", "1,-8", "1,0", "1,1", "1,2", "1,3", "1,4", "1,5", "1,6", "1,7",
        "2,-1", "2,-2", "2,-3", "2,-4", "2,-5", "2,-6", "2,-7", "2,0", "2,1", "2,2", "2,3", "2,4", "2,5", "2,6",
        "3,-1", "3,-2", "3,-3", "3,-4", "3,-5", "3,-6", "3,-7", "3,0", "3,1", "3,2", "3,3", "3,4", "3,5", "3,6",
        "4,-1", "4,-2", "4,-3", "4,-4", "4,-5", "4,-6", "4,0", "4,1", "4,2", "4,3", "4,4", "4,5",
        "5,-1", "5,-2", "5,-3", "5,-4", "5,-5", "5,0", "5,1", "5,2", "5,3", "5,4",
        "6,-1", "6,-2", "6,-3", "6,-4", "6,0", "6,1", "6,2", "6,3",
        "7,-1", "7,-2", "7,0", "7,1",
      ],
    };

    for (const [size, expected] of Object.entries(snapshots)) {
      expect(collectRelativeCirclePixels(Number(size))).toEqual(sortPixels([...expected]));
    }
  });

  it("does not change square brush stamps", () => {
    const squarePixels: string[] = [];
    forEachStampPixel({ x: 0, y: 0 }, 3, "square", (x, y) => {
      squarePixels.push(`${x},${y}`);
    });
    expect(sortPixels(squarePixels)).toEqual([
      "-1,-1", "0,-1", "1,-1",
      "-1,0", "0,0", "1,0",
      "-1,1", "0,1", "1,1",
    ]);
  });
});

describe("forEachOutlineEllipsePixel", () => {
  it("keeps circle outlines 8-connected for sizes 2 through 24", () => {
    for (let size = 2; size <= 24; size++) {
      assert8Connected(collectOutlinePixels(0, 0, size - 1, size - 1));
    }
  });

  it("keeps circle outlines symmetric in bitmap space for sizes 2 through 24", () => {
    for (let size = 2; size <= 24; size++) {
      assertBitmapSymmetric(collectOutlinePixels(0, 0, size - 1, size - 1), size);
    }
  });

  it("grows circle outline monotonically for sizes 2 through 24", () => {
    let previousCount = 0;
    for (let size = 2; size <= 24; size++) {
      const count = collectOutlinePixels(0, 0, size - 1, size - 1).size;
      expect(count).toBeGreaterThanOrEqual(previousCount);
      previousCount = count;
    }
  });

  it("keeps ellipse outlines 8-connected for varied aspect ratios", () => {
    const cases: ReadonlyArray<readonly [number, number, number, number]> = [
      [0, 0, 7, 3],
      [2, 1, 10, 8],
      [0, 0, 15, 5],
      [3, 3, 3, 10],
    ];
    for (const [x0, y0, x1, y1] of cases) {
      assert8Connected(collectOutlinePixels(x0, y0, x1, y1));
    }
  });
});

describe("forEachFilledEllipsePixel shape tool parity", () => {
  it("matches circle brush stamp pixels for sizes 1 through 16", () => {
    for (let size = 1; size <= 16; size++) {
      const filled = collectFilledEllipsePixels(0, 0, size - 1, size - 1);
      const brush = new Set(collectAbsoluteCirclePixels(size));
      expect(filled).toEqual(brush);
    }
  });
});
