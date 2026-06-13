import type { ReferenceLayer } from "@/domain/layer/Layer";
import {
  findTopReferenceLayerAtCanvasPoint,
  toReferenceLayerLocalPoint,
} from "@/domain/layer/ReferenceLayerPalette";
import type { Point } from "@/domain/tool/ITool";
import {
  computeSecondaryGridCellOrigin,
  type GridCellOrigin,
} from "./GridRelativePosition";

export interface CanvasMousePositionOverlayTarget {
  kind: "canvas";
  pixelX: number;
  pixelY: number;
  secondarySize: number;
  canvasCellOrigin: GridCellOrigin;
}

export interface ReferenceMousePositionOverlayTarget {
  kind: "reference";
  localX: number;
  localY: number;
  secondarySize: number;
  canvasCellOrigin: GridCellOrigin;
}

export type MousePositionOverlayTarget =
  | CanvasMousePositionOverlayTarget
  | ReferenceMousePositionOverlayTarget;

export function resolveMousePositionOverlayTarget(
  canvasPoint: Point,
  referenceLayers: ReferenceLayer[],
  projectSecondarySize: number,
  composite: { width: number; height: number } | null,
): MousePositionOverlayTarget | null {
  const referenceLayer = findTopReferenceLayerAtCanvasPoint(referenceLayers, canvasPoint);
  if (referenceLayer) {
    const localPoint = toReferenceLayerLocalPoint(referenceLayer, canvasPoint);
    if (!localPoint) return null;

    const secondarySize = referenceLayer.grid.secondary;
    const cellOrigin = computeSecondaryGridCellOrigin(
      localPoint.x,
      localPoint.y,
      secondarySize,
    );

    return {
      kind: "reference",
      localX: localPoint.x,
      localY: localPoint.y,
      secondarySize,
      canvasCellOrigin: {
        x: referenceLayer.position.x + cellOrigin.x,
        y: referenceLayer.position.y + cellOrigin.y,
      },
    };
  }

  if (!composite) return null;
  if (
    canvasPoint.x < 0 ||
    canvasPoint.y < 0 ||
    canvasPoint.x >= composite.width ||
    canvasPoint.y >= composite.height
  ) {
    return null;
  }

  const secondarySize = projectSecondarySize;
  return {
    kind: "canvas",
    pixelX: canvasPoint.x,
    pixelY: canvasPoint.y,
    secondarySize,
    canvasCellOrigin: computeSecondaryGridCellOrigin(
      canvasPoint.x,
      canvasPoint.y,
      secondarySize,
    ),
  };
}

export function getOverlayPixelCoordinates(target: MousePositionOverlayTarget): {
  x: number;
  y: number;
} {
  if (target.kind === "reference") {
    return { x: target.localX, y: target.localY };
  }
  return { x: target.pixelX, y: target.pixelY };
}
