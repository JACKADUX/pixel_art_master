import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { WritableCanvasSurface } from "@/domain/canvas/MaskedPixelGrid";
import {
  findTopReferenceLayerAtCanvasPoint,
  isReferenceLayerPixelCacheValid,
  referenceLayerCropKey,
  sampleReferenceLayerPixel,
  toReferenceLayerLocalPoint,
} from "@/domain/layer/ReferenceLayerPalette";
import type { Project } from "@/domain/project/Project";
import type { Point } from "@/domain/tool/ITool";
import type { ReferenceLayerPixelData } from "@/infrastructure/canvas/ReferenceLayerPixelCache";

export function resolveMagicWandTargetColor(
  project: Project,
  grid: WritableCanvasSurface,
  point: Point,
  getPixelCache: (layerId: string, cropKey: string) => ReferenceLayerPixelData | null,
): PixelColor {
  const referenceLayer = findTopReferenceLayerAtCanvasPoint(project.canvas.layers, point);
  if (referenceLayer?.crop && referenceLayer.imageData) {
    const localPoint = toReferenceLayerLocalPoint(referenceLayer, point);
    const cache = getPixelCache(referenceLayer.id, referenceLayerCropKey(referenceLayer.crop));
    if (localPoint && cache && isReferenceLayerPixelCacheValid(cache, referenceLayer)) {
      const referenceColor = sampleReferenceLayerPixel(
        cache.pixels,
        cache.width,
        localPoint.x,
        localPoint.y,
      );
      if (referenceColor !== null) {
        return referenceColor;
      }
    }
  }

  if (grid.inBounds(point.x, point.y)) {
    return grid.getPixel(point.x, point.y);
  }

  return 0;
}
