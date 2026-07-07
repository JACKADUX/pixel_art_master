import type { CanvasSize } from "../canvas/CanvasSize";
import { PixelGrid } from "../canvas/PixelGrid";
import type { Layer } from "./Layer";
import { compositeDrawingLayersUpTo } from "./LayerCompositor";
import { isDrawingLayer } from "./LayerTypeGuards";

function computeLayersCompositeFingerprint(
  layers: Layer[],
  endIndexExclusive: number,
  size: CanvasSize,
): string {
  const parts: string[] = [`${size.width}x${size.height}`];
  for (let i = 0; i < endIndexExclusive && i < layers.length; i++) {
    const layer = layers[i];
    if (!layer.visible || !isDrawingLayer(layer)) continue;
    const pixels = layer.pixels;
    parts.push(
      `${layer.id}:${layer.position.x},${layer.position.y}:${layer.opacity}:${pixels.length}:${pixels[0] ?? 0}:${pixels[pixels.length - 1] ?? 0}`,
    );
  }
  return parts.join("|");
}

export class CompositeCache {
  private fingerprint = "";
  private cached: PixelGrid | null = null;

  getBelowActiveLayers(
    layers: Layer[],
    size: CanvasSize,
    activeLayerIndex: number,
  ): PixelGrid {
    const fingerprint = computeLayersCompositeFingerprint(layers, activeLayerIndex, size);
    if (this.cached && this.fingerprint === fingerprint) {
      return this.cached;
    }
    this.cached = compositeDrawingLayersUpTo(layers, size, activeLayerIndex);
    this.fingerprint = fingerprint;
    return this.cached;
  }

  invalidate(): void {
    this.fingerprint = "";
    this.cached = null;
  }
}

export function compositeActiveLayerOverBase(
  base: PixelGrid,
  activeGrid: PixelGrid,
  position: { x: number; y: number },
  opacity: number,
): PixelGrid {
  const result = base.clone();
  activeGrid.compositeOverOnto(result, position.x, position.y, opacity);
  return result;
}
