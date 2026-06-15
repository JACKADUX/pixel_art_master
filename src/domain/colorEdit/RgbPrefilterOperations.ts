import { getAlpha, rgba, toRgbComponents, type PixelColor } from "../canvas/PixelColor";

export const LARGE_IMAGE_UNIQUE_THRESHOLD = 3000;
export const RGB_PREFILTER_DISTANCE = 6;

function readPixelColor(data: Uint8ClampedArray, index: number): PixelColor {
  const offset = index * 4;
  return rgba(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
}

function writePixelColor(
  data: Uint8ClampedArray,
  index: number,
  color: PixelColor,
  preserveAlpha: boolean,
  sourceAlpha: number,
): void {
  const offset = index * 4;
  const { r, g, b } = toRgbComponents(color);
  const alpha = preserveAlpha ? sourceAlpha : getAlpha(color);
  data[offset] = r;
  data[offset + 1] = g;
  data[offset + 2] = b;
  data[offset + 3] = alpha;
}

function rgbDistance(a: PixelColor, b: PixelColor): number {
  const dr = (a & 0xff) - (b & 0xff);
  const dg = ((a >> 8) & 0xff) - ((b >> 8) & 0xff);
  const db = ((a >> 16) & 0xff) - ((b >> 16) & 0xff);
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function rgbBucket(color: PixelColor, step: number): [number, number, number] {
  return [
    (color & 0xff) / step,
    ((color >> 8) & 0xff) / step,
    ((color >> 16) & 0xff) / step,
  ];
}

class UnionFind {
  private readonly parent: number[];
  private readonly rank: number[];

  constructor(size: number) {
    this.parent = Array.from({ length: size }, (_, index) => index);
    this.rank = new Array(size).fill(0);
  }

  find(index: number): number {
    if (this.parent[index] !== index) {
      this.parent[index] = this.find(this.parent[index]);
    }
    return this.parent[index];
  }

  union(a: number, b: number): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return;
    if (this.rank[rootA] < this.rank[rootB]) {
      this.parent[rootA] = rootB;
      return;
    }
    if (this.rank[rootA] > this.rank[rootB]) {
      this.parent[rootB] = rootA;
      return;
    }
    this.parent[rootB] = rootA;
    this.rank[rootA] += 1;
  }
}

export function shouldApplyRgbPrefilter(uniqueCount: number): boolean {
  return uniqueCount > LARGE_IMAGE_UNIQUE_THRESHOLD;
}

export function applyRgbPrefilter(
  imageData: ImageData,
  uniqueCount: number,
  rgbThreshold = RGB_PREFILTER_DISTANCE,
): ImageData {
  if (!shouldApplyRgbPrefilter(uniqueCount)) {
    return imageData;
  }

  const { width, height, data } = imageData;
  const pixelCount = width * height;
  const counts = new Map<PixelColor, number>();

  for (let index = 0; index < pixelCount; index += 1) {
    const color = readPixelColor(data, index);
    if (getAlpha(color) === 0) continue;
    counts.set(color, (counts.get(color) ?? 0) + 1);
  }

  const palette = [...counts.entries()].map(([color, pixelCount]) => ({
    color,
    pixelCount,
  }));
  const colorCount = palette.length;
  const step = Math.max(1, rgbThreshold);
  const threshold = rgbThreshold;

  const buckets = new Map<string, number[]>();
  const bucketKey = (r: number, g: number, b: number) => `${r},${g},${b}`;

  for (let index = 0; index < colorCount; index += 1) {
    const [r, g, b] = rgbBucket(palette[index].color, step);
    const key = bucketKey(r, g, b);
    const members = buckets.get(key);
    if (members) {
      members.push(index);
    } else {
      buckets.set(key, [index]);
    }
  }

  const unionFind = new UnionFind(colorCount);
  const comparedPairs = new Set<string>();

  for (let index = 0; index < colorCount; index += 1) {
    const [centerR, centerG, centerB] = rgbBucket(palette[index].color, step);
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dg = -1; dg <= 1; dg += 1) {
        for (let db = -1; db <= 1; db += 1) {
          const candidates = buckets.get(bucketKey(centerR + dr, centerG + dg, centerB + db));
          if (!candidates) continue;
          for (const other of candidates) {
            if (other <= index) continue;
            const pairKey = `${index}:${other}`;
            if (comparedPairs.has(pairKey)) continue;
            comparedPairs.add(pairKey);
            if (rgbDistance(palette[index].color, palette[other].color) <= threshold) {
              unionFind.union(index, other);
            }
          }
        }
      }
    }
  }

  const clusters = new Map<number, number[]>();
  for (let index = 0; index < colorCount; index += 1) {
    const root = unionFind.find(index);
    const members = clusters.get(root);
    if (members) {
      members.push(index);
    } else {
      clusters.set(root, [index]);
    }
  }

  const representativeByColor = new Map<PixelColor, PixelColor>();
  for (const memberIndices of clusters.values()) {
    const clusterEntries = memberIndices.map((idx) => palette[idx]);
    const representative = clusterEntries.reduce((best, entry) =>
      entry.pixelCount > best.pixelCount ? entry : best,
    ).color;
    for (const entry of clusterEntries) {
      representativeByColor.set(entry.color, representative);
    }
  }

  const resultData = new Uint8ClampedArray(data);
  for (let index = 0; index < pixelCount; index += 1) {
    const sourceColor = readPixelColor(data, index);
    if (getAlpha(sourceColor) === 0) continue;
    const merged = representativeByColor.get(sourceColor) ?? sourceColor;
    writePixelColor(
      resultData,
      index,
      merged,
      getAlpha(merged) === 255,
      getAlpha(sourceColor),
    );
  }

  return { width, height, data: resultData } as ImageData;
}
