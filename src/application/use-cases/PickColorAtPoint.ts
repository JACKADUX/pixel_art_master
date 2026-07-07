import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { ReferenceLayer } from "@/domain/layer/Layer";
import type { Point } from "@/domain/tool/ITool";
import {
  findTopReferenceLayerAtBoardPoint,
  isReferenceLayerPixelCacheValid,
  referenceLayerCropKey,
  sampleReferenceLayerPixel,
  toReferenceLayerLocalPoint,
} from "@/domain/layer/ReferenceLayerPalette";
import { canvasPointToBoardPoint } from "@/domain/layer/ReferenceLayerOperations";
import type { Project } from "@/domain/project/Project";
import { getActiveCanvas } from "@/domain/project/Project";
import { getCompositeGrid } from "@/domain/project/Project";
import type { ReferenceLayerPixelData } from "@/infrastructure/canvas/ReferenceLayerPixelCache";

type ReferenceLayerPixelCacheReader = (
  layerId: string,
  cropKey: string,
) => ReferenceLayerPixelData | null;

function sampleReferenceLayerColor(
  layer: ReferenceLayer,
  point: Point,
  cache: ReferenceLayerPixelData | null,
): PixelColor | null {
  const localPoint = toReferenceLayerLocalPoint(layer, point);
  if (!localPoint || !cache || !isReferenceLayerPixelCacheValid(cache, layer)) return null;

  return sampleReferenceLayerPixel(
    cache.pixels,
    cache.width,
    localPoint.x,
    localPoint.y,
  );
}

export function resolveColorAtCanvasPoint(
  project: Project,
  point: Point,
  getPixelCache: ReferenceLayerPixelCacheReader,
): PixelColor {
  const activeCanvas = getActiveCanvas(project);
  const boardPoint = canvasPointToBoardPoint(point, activeCanvas.boardPosition);
  const referenceLayer = findTopReferenceLayerAtBoardPoint(project.referenceLayers, boardPoint);
  if (referenceLayer?.crop && referenceLayer.imageData) {
    const cache = getPixelCache(referenceLayer.id, referenceLayerCropKey(referenceLayer.crop));
    const referenceColor = sampleReferenceLayerColor(referenceLayer, boardPoint, cache);
    if (referenceColor !== null) {
      return referenceColor;
    }
  }

  const composite = getCompositeGrid(project);
  return composite.getPixel(point.x, point.y);
}

export async function resolveColorAtCanvasPointAsync(
  project: Project,
  point: Point,
  getPixelCache: ReferenceLayerPixelCacheReader,
  ensurePixelCache: (layer: ReferenceLayer) => Promise<ReferenceLayerPixelData | null>,
): Promise<PixelColor> {
  const activeCanvas = getActiveCanvas(project);
  const boardPoint = canvasPointToBoardPoint(point, activeCanvas.boardPosition);
  const referenceLayer = findTopReferenceLayerAtBoardPoint(project.referenceLayers, boardPoint);
  if (referenceLayer?.crop && referenceLayer.imageData) {
    const cropKey = referenceLayerCropKey(referenceLayer.crop);
    const cachedColor = sampleReferenceLayerColor(
      referenceLayer,
      boardPoint,
      getPixelCache(referenceLayer.id, cropKey),
    );
    if (cachedColor !== null) {
      return cachedColor;
    }

    const loadedCache = await ensurePixelCache(referenceLayer);
    const loadedColor = sampleReferenceLayerColor(referenceLayer, boardPoint, loadedCache);
    if (loadedColor !== null) {
      return loadedColor;
    }
  }

  const composite = getCompositeGrid(project);
  return composite.getPixel(point.x, point.y);
}
