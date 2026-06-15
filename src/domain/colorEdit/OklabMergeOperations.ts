import { getAlpha, rgba, toRgbComponents, type PixelColor } from "../canvas/PixelColor";
import { pixelColorToOklab } from "../color/ColorConverter";
import type { OklabColor } from "../color/OklabColor";
import {
  buildDiffusionRegionGroups,
  type DiffusionRegionGroups,
} from "./DiffusionRegionGroups";
import { canMergeOklabColors, oklabChroma } from "./OklabMergeDistance";
import type { OklabMergeOptions } from "./OklabMergeOptions";
import {
  DEFAULT_OKLAB_MERGE_OPTIONS,
  normalizeOklabMergeOptions,
} from "./OklabMergeOptions";
import type { OklabReduceAlgorithm } from "./OklabReduceAlgorithm";

interface PaletteEntry {
  color: PixelColor;
  pixelCount: number;
  oklab: OklabColor;
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

function buildPaletteEntries(imageData: ImageData): PaletteEntry[] {
  const counts = new Map<PixelColor, number>();
  const { width, height, data } = imageData;
  const pixelCount = width * height;

  for (let index = 0; index < pixelCount; index += 1) {
    const color = readPixelColor(data, index);
    if (getAlpha(color) === 0) continue;
    counts.set(color, (counts.get(color) ?? 0) + 1);
  }

  return [...counts.entries()].map(([color, count]) => ({
    color,
    pixelCount: count,
    oklab: pixelColorToOklab(color),
  }));
}

function pickModeRepresentative(entries: readonly PaletteEntry[]): PixelColor {
  let best = entries[0];
  for (const entry of entries) {
    if (entry.pixelCount > best.pixelCount) {
      best = entry;
    }
  }
  return best.color;
}

function pickHighChromaRepresentative(entries: readonly PaletteEntry[]): PixelColor {
  let best = entries[0];
  let bestChroma = oklabChroma(best.oklab);
  for (const entry of entries) {
    const chroma = oklabChroma(entry.oklab);
    if (chroma > bestChroma || (chroma === bestChroma && entry.pixelCount > best.pixelCount)) {
      best = entry;
      bestChroma = chroma;
    }
  }
  return best.color;
}

export function reduceOklabClusterColors(
  entries: readonly PaletteEntry[],
  algorithm: OklabReduceAlgorithm,
): PixelColor {
  if (entries.length === 0) return 0;
  switch (algorithm) {
    case "mode":
      return pickModeRepresentative(entries);
    case "highChroma":
      return pickHighChromaRepresentative(entries);
  }
}

function buildClusterRegionPixels(
  palette: readonly PaletteEntry[],
  clusters: Map<number, number[]>,
): PixelColor[][] {
  const regionPixelLists: PixelColor[][] = [];

  for (const memberIndices of clusters.values()) {
    const pixels: PixelColor[] = [];
    for (const index of memberIndices) {
      const entry = palette[index];
      for (let count = 0; count < entry.pixelCount; count += 1) {
        pixels.push(entry.color);
      }
    }
    regionPixelLists.push(pixels);
  }

  return regionPixelLists;
}

export interface OklabMergeResult {
  imageData: ImageData;
  regionGroups: DiffusionRegionGroups;
}

export function applyOklabMerge(
  imageData: ImageData,
  options: OklabMergeOptions = DEFAULT_OKLAB_MERGE_OPTIONS,
): OklabMergeResult {
  const normalized = normalizeOklabMergeOptions(options);
  const palette = buildPaletteEntries(imageData);
  const colorCount = palette.length;

  if (colorCount === 0) {
    return {
      imageData,
      regionGroups: { groupCount: 0, groups: [] },
    };
  }

  const unionFind = new UnionFind(colorCount);
  for (let i = 0; i < colorCount; i += 1) {
    for (let j = i + 1; j < colorCount; j += 1) {
      if (
        canMergeOklabColors(palette[i].oklab, palette[j].oklab, {
          threshold: normalized.threshold,
        })
      ) {
        unionFind.union(i, j);
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
    const clusterEntries = memberIndices.map((index) => palette[index]);
    const representative = reduceOklabClusterColors(
      clusterEntries,
      normalized.reduceAlgorithm,
    );
    for (const entry of clusterEntries) {
      representativeByColor.set(entry.color, representative);
    }
  }

  const { width, height, data } = imageData;
  const pixelCount = width * height;
  const resultData = new Uint8ClampedArray(data);

  for (let index = 0; index < pixelCount; index += 1) {
    const sourceColor = readPixelColor(data, index);
    if (getAlpha(sourceColor) === 0) continue;

    const mergedColor = representativeByColor.get(sourceColor) ?? sourceColor;
    writePixelColor(
      resultData,
      index,
      mergedColor,
      getAlpha(mergedColor) === 255,
      getAlpha(sourceColor),
    );
  }

  const regionPixelLists = buildClusterRegionPixels(palette, clusters);
  return {
    imageData: { width, height, data: resultData } as ImageData,
    regionGroups: buildDiffusionRegionGroups(regionPixelLists),
  };
}
