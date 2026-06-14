import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import {
  findTopReferenceLayerAtCanvasPoint,
  sampleReferenceLayerPixel,
  toReferenceLayerLocalPoint,
} from "@/domain/layer/ReferenceLayerPalette";
import type { Project } from "@/domain/project/Project";
import type { Point } from "@/domain/tool/ITool";
import type { ReferenceLayerPixelData } from "@/infrastructure/canvas/ReferenceLayerPixelCache";

export function resolveMagicWandTargetColor(
  project: Project,
  grid: PixelGrid,
  point: Point,
  getPixelCache: (layerId: string) => ReferenceLayerPixelData | null,
): PixelColor {
  const referenceLayer = findTopReferenceLayerAtCanvasPoint(project.canvas.layers, point);
  if (referenceLayer?.crop && referenceLayer.imageData) {
    const localPoint = toReferenceLayerLocalPoint(referenceLayer, point);
    const cache = getPixelCache(referenceLayer.id);
    if (localPoint && cache && cache.base64 === referenceLayer.imageData) {
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
