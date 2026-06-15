import { getAlpha, rgba, toRgbComponents, type PixelColor } from "../canvas/PixelColor";
import { pixelColorToOklab } from "../color/ColorConverter";
import { canMergeOklabColors } from "./OklabMergeDistance";
import type { ManualMergeAnchor } from "./ManualMergeAnchor";
import { normalizeManualMergeAnchor } from "./ManualMergeAnchor";

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

export function applyManualMergeOverlays(
  sourceImageData: ImageData,
  mergedImageData: ImageData,
  anchors: readonly ManualMergeAnchor[],
): ImageData {
  if (anchors.length === 0) {
    return mergedImageData;
  }

  const { width, height, data: sourceData } = sourceImageData;
  const resultData = new Uint8ClampedArray(mergedImageData.data);
  const pixelCount = width * height;

  const normalizedAnchors = anchors.map(normalizeManualMergeAnchor);
  const anchorOklabs = normalizedAnchors.map((anchor) => ({
    anchor,
    oklab: pixelColorToOklab(anchor.color),
  }));

  for (let index = 0; index < pixelCount; index += 1) {
    const sourceColor = readPixelColor(sourceData, index);
    if (getAlpha(sourceColor) === 0) continue;

    const sourceOklab = pixelColorToOklab(sourceColor);

    for (const { anchor, oklab } of anchorOklabs) {
      if (
        canMergeOklabColors(sourceOklab, oklab, {
          threshold: anchor.threshold,
        })
      ) {
        writePixelColor(
          resultData,
          index,
          anchor.color,
          getAlpha(anchor.color) === 255,
          getAlpha(sourceColor),
        );
      }
    }
  }

  return { width, height, data: resultData } as ImageData;
}
