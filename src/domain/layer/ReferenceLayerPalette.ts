import { getAlpha, toHexAlpha, type PixelColor } from "../canvas/PixelColor";
import { pixelColorToOklch } from "../color/ColorConverter";
import type { ColorEntry } from "../palette/Palette";
import type { Layer, ReferenceLayer } from "./Layer";
import { clampReferenceScale } from "./ReferenceLayerOperations";

export const REFERENCE_LAYER_PALETTE_MAX_COLORS = 256;

export function referenceLayerCropKey(crop: NonNullable<ReferenceLayer["crop"]>): string {
  return `${crop.x},${crop.y},${crop.width},${crop.height}`;
}

export function isReferenceLayerPixelCacheValid(
  cache: {
    base64: string;
    cropKey: string;
    width: number;
    height: number;
  },
  layer: ReferenceLayer,
): boolean {
  if (!layer.imageData || !layer.crop) return false;
  return (
    cache.base64 === layer.imageData &&
    cache.cropKey === referenceLayerCropKey(layer.crop) &&
    cache.width === layer.crop.width &&
    cache.height === layer.crop.height
  );
}

export function isPointInsideReferenceLayer(
  layer: ReferenceLayer,
  point: { x: number; y: number },
): boolean {
  if (!layer.visible || !layer.crop || !layer.imageData) return false;
  const scale = clampReferenceScale(layer.scale);
  const localX = point.x - layer.position.x;
  const localY = point.y - layer.position.y;
  return (
    localX >= 0 &&
    localY >= 0 &&
    localX < layer.crop.width * scale &&
    localY < layer.crop.height * scale
  );
}

export function findTopReferenceLayerAtBoardPoint(
  layers: Layer[],
  boardPoint: { x: number; y: number },
): ReferenceLayer | undefined {
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    const layer = layers[i];
    if (layer.type !== "reference") continue;
    if (!isPointInsideReferenceLayer(layer, boardPoint)) continue;
    return layer;
  }
  return undefined;
}

/** @deprecated 使用 findTopReferenceLayerAtBoardPoint；传入点须为工作区绝对坐标 */
export const findTopReferenceLayerAtCanvasPoint = findTopReferenceLayerAtBoardPoint;

export function toReferenceLayerLocalPoint(
  layer: ReferenceLayer,
  boardPoint: { x: number; y: number },
): { x: number; y: number } | null {
  if (!layer.crop) return null;
  const scale = clampReferenceScale(layer.scale);
  const displayX = boardPoint.x - layer.position.x;
  const displayY = boardPoint.y - layer.position.y;
  if (
    displayX < 0 ||
    displayY < 0 ||
    displayX >= layer.crop.width * scale ||
    displayY >= layer.crop.height * scale
  ) {
    return null;
  }
  return { x: displayX / scale, y: displayY / scale };
}

export function sampleReferenceLayerPixel(
  pixels: Uint32Array,
  cropWidth: number,
  localX: number,
  localY: number,
): PixelColor | null {
  const x = Math.floor(localX);
  const y = Math.floor(localY);
  if (x < 0 || y < 0) return null;
  const index = y * cropWidth + x;
  if (index < 0 || index >= pixels.length) return null;
  const color = pixels[index];
  if (getAlpha(color) === 0) return null;
  return color;
}

export function buildReferenceColorPalette(
  pixels: Uint32Array,
  maxColors = REFERENCE_LAYER_PALETTE_MAX_COLORS,
): ColorEntry[] {
  const seen = new Set<string>();
  const entries: ColorEntry[] = [];

  for (const color of pixels) {
    if (getAlpha(color) === 0) continue;
    const hex = toHexAlpha(color);
    if (seen.has(hex)) continue;
    seen.add(hex);
    entries.push({ color, hex });
  }

  entries.sort((a, b) => {
    const lightnessDelta = pixelColorToOklch(a.color).l - pixelColorToOklch(b.color).l;
    if (lightnessDelta !== 0) return lightnessDelta;
    return a.hex.localeCompare(b.hex);
  });

  return entries.slice(0, maxColors);
}

export function extractUniqueColorsFromPixels(pixels: Uint32Array): PixelColor[] {
  return buildReferenceColorPalette(pixels, Number.MAX_SAFE_INTEGER).map(
    (entry) => entry.color,
  );
}
