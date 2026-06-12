import { getAlpha, toHexAlpha, type PixelColor } from "../canvas/PixelColor";
import { pixelColorToOklab } from "../color/ColorConverter";
import type { ColorEntry } from "../palette/Palette";
import type { Layer, ReferenceLayer } from "./Layer";

export const REFERENCE_LAYER_PALETTE_MAX_COLORS = 256;

export function referenceLayerCropKey(crop: NonNullable<ReferenceLayer["crop"]>): string {
  return `${crop.x},${crop.y},${crop.width},${crop.height}`;
}

export function isPointInsideReferenceLayer(
  layer: ReferenceLayer,
  point: { x: number; y: number },
): boolean {
  if (!layer.visible || !layer.crop || !layer.imageData) return false;
  const localX = point.x - layer.position.x;
  const localY = point.y - layer.position.y;
  return (
    localX >= 0 &&
    localY >= 0 &&
    localX < layer.crop.width &&
    localY < layer.crop.height
  );
}

export function findTopReferenceLayerAtCanvasPoint(
  layers: Layer[],
  point: { x: number; y: number },
): ReferenceLayer | undefined {
  for (let i = layers.length - 1; i >= 0; i -= 1) {
    const layer = layers[i];
    if (layer.type !== "reference") continue;
    if (!isPointInsideReferenceLayer(layer, point)) continue;
    return layer;
  }
  return undefined;
}

export function toReferenceLayerLocalPoint(
  layer: ReferenceLayer,
  canvasPoint: { x: number; y: number },
): { x: number; y: number } | null {
  if (!layer.crop) return null;
  const x = canvasPoint.x - layer.position.x;
  const y = canvasPoint.y - layer.position.y;
  if (x < 0 || y < 0 || x >= layer.crop.width || y >= layer.crop.height) return null;
  return { x, y };
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
    const lightnessDelta = pixelColorToOklab(a.color).l - pixelColorToOklab(b.color).l;
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
