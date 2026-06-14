import type { RestoreScale } from "./RestoreScale";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface RestoreOutputSize {
  width: number;
  height: number;
}

export function computeRestoreOutputSize(
  source: ImageDimensions,
  scale: RestoreScale,
): RestoreOutputSize {
  return {
    width: Math.floor(source.width / scale.value),
    height: Math.floor(source.height / scale.value),
  };
}

export function canApplyFixedScaleRestore(
  source: ImageDimensions,
  scale: RestoreScale,
): boolean {
  const { width, height } = source;
  if (width <= 0 || height <= 0) return false;
  return width % scale.value === 0 && height % scale.value === 0;
}

export function validateFixedScaleRestore(
  source: ImageDimensions,
  scale: RestoreScale,
): RestoreOutputSize {
  if (!canApplyFixedScaleRestore(source, scale)) {
    throw new Error(
      `Image size ${source.width}×${source.height} is not evenly divisible by scale ${scale.value}`,
    );
  }
  const output = computeRestoreOutputSize(source, scale);
  if (output.width < 1 || output.height < 1) {
    throw new Error("Restore output size must be at least 1×1");
  }
  return output;
}

export function resolveDefaultRestoreScale(
  detectedScale: number,
  source: ImageDimensions,
): number {
  if (detectedScale >= 2 && canApplyFixedScaleRestore(source, { value: detectedScale })) {
    return detectedScale;
  }
  return 2;
}
