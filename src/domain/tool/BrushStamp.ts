import { collectCircleStampOffsets } from "@/domain/geometry/EllipseFill";
import type { BrushShape } from "./ToolType";
import type { Point } from "./ITool";

const circleStampCache = new Map<number, ReadonlyArray<readonly [number, number]>>();

function forEachCachedCircleStampPixel(
  size: number,
  callback: (dx: number, dy: number) => void,
): void {
  let offsets = circleStampCache.get(size);
  if (!offsets) {
    offsets = collectCircleStampOffsets(size);
    circleStampCache.set(size, offsets);
  }
  for (const [dx, dy] of offsets) {
    callback(dx, dy);
  }
}

export function forEachStampPixel(
  center: Point,
  size: number,
  shape: BrushShape,
  callback: (x: number, y: number) => void,
): void {
  if (shape === "circle") {
    forEachCachedCircleStampPixel(size, (dx, dy) => {
      callback(center.x + dx, center.y + dy);
    });
    return;
  }

  const half = Math.floor(size / 2);
  for (let dy = -half; dy < size - half; dy++) {
    for (let dx = -half; dx < size - half; dx++) {
      callback(center.x + dx, center.y + dy);
    }
  }
}

export interface StampBounds {
  left: number;
  top: number;
  size: number;
}

export function getStampBounds(center: Point, size: number): StampBounds {
  const half = Math.floor(size / 2);
  return {
    left: center.x - half,
    top: center.y - half,
    size,
  };
}

interface GridEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function pixelKey(x: number, y: number): string {
  return `${x},${y}`;
}

function pointKey(x: number, y: number): string {
  return `${x},${y}`;
}

function collectStampPixels(center: Point, size: number, shape: BrushShape): Set<string> {
  const pixels = new Set<string>();
  forEachStampPixel(center, size, shape, (x, y) => pixels.add(pixelKey(x, y)));
  return pixels;
}

function collectBoundaryEdges(pixels: Set<string>): GridEdge[] {
  const edges: GridEdge[] = [];
  for (const key of pixels) {
    const [x, y] = key.split(",").map(Number);
    if (!pixels.has(pixelKey(x, y - 1))) {
      edges.push({ x1: x, y1: y, x2: x + 1, y2: y });
    }
    if (!pixels.has(pixelKey(x + 1, y))) {
      edges.push({ x1: x + 1, y1: y, x2: x + 1, y2: y + 1 });
    }
    if (!pixels.has(pixelKey(x, y + 1))) {
      edges.push({ x1: x + 1, y1: y + 1, x2: x, y2: y + 1 });
    }
    if (!pixels.has(pixelKey(x - 1, y))) {
      edges.push({ x1: x, y1: y + 1, x2: x, y2: y });
    }
  }
  return edges;
}

function edgeDirection(edge: GridEdge): number {
  const dx = edge.x2 - edge.x1;
  const dy = edge.y2 - edge.y1;
  if (dx === 1 && dy === 0) return 0;
  if (dx === 0 && dy === 1) return 1;
  if (dx === -1 && dy === 0) return 2;
  return 3;
}

function pickNextBoundaryEdge(current: GridEdge, candidates: GridEdge[]): GridEdge {
  if (candidates.length === 1) return candidates[0];

  const incoming = edgeDirection(current);
  const preferred = (incoming + 1) % 4;
  const match = candidates.find((edge) => edgeDirection(edge) === preferred);
  return match ?? candidates[0];
}

function chainBoundaryPolygon(edges: GridEdge[]): Point[] {
  if (edges.length === 0) return [];

  const outgoing = new Map<string, GridEdge[]>();
  for (const edge of edges) {
    const key = pointKey(edge.x1, edge.y1);
    const list = outgoing.get(key) ?? [];
    list.push(edge);
    outgoing.set(key, list);
  }

  const used = new Set<GridEdge>();
  const polygon: Point[] = [];
  let current = edges[0];

  while (true) {
    used.add(current);
    polygon.push({ x: current.x1, y: current.y1 });

    const nextCandidates = (outgoing.get(pointKey(current.x2, current.y2)) ?? []).filter(
      (edge) => !used.has(edge),
    );

    if (nextCandidates.length === 0) {
      polygon.push({ x: current.x2, y: current.y2 });
      break;
    }

    current = pickNextBoundaryEdge(current, nextCandidates);

    if (
      polygon.length > 1 &&
      current.x1 === edges[0].x1 &&
      current.y1 === edges[0].y1
    ) {
      break;
    }
  }

  return polygon;
}

export function collectStampBoundaryPolygon(
  center: Point,
  size: number,
  shape: BrushShape,
): Point[] {
  const pixels = collectStampPixels(center, size, shape);
  return chainBoundaryPolygon(collectBoundaryEdges(pixels));
}