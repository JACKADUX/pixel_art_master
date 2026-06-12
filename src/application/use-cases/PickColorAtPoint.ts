import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { Point } from "@/domain/tool/ITool";
import {
  findTopReferenceLayerAtCanvasPoint,
  sampleReferenceLayerPixel,
  toReferenceLayerLocalPoint,
} from "@/domain/layer/ReferenceLayerPalette";
import type { Project } from "@/domain/project/Project";
import { getCompositeGrid } from "@/domain/project/Project";
import type { ReferenceLayerPixelData } from "@/infrastructure/canvas/ReferenceLayerPixelCache";

export function resolveColorAtCanvasPoint(
  project: Project,
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

  const composite = getCompositeGrid(project);
  return composite.getPixel(point.x, point.y);
}
