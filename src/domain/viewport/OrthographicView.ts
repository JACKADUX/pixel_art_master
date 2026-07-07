export interface OrthographicViewConfig {
  enabled: boolean;
  cameraAngle: number;
}

export const MIN_CAMERA_ANGLE = 1;
export const MAX_CAMERA_ANGLE = 89;
export const DEFAULT_CAMERA_ANGLE = 63.5;

export const DEFAULT_ORTHOGRAPHIC_VIEW: OrthographicViewConfig = {
  enabled: false,
  cameraAngle: DEFAULT_CAMERA_ANGLE,
};

export function clampCameraAngle(angle: number): number {
  const rounded = Math.round(angle * 10) / 10;
  return Math.max(MIN_CAMERA_ANGLE, Math.min(MAX_CAMERA_ANGLE, rounded));
}

export function computeForeshortenedSpan(width: number, angleDegrees: number): number {
  const w = Math.max(1, width);
  return Math.max(1, Math.round(w * Math.sin((angleDegrees * Math.PI) / 180)));
}

/** 子网格 Y 间距：从主网格压缩后的高度按 primary/secondary 比例推导，保持划分一致 */
export function computeForeshortenedSecondarySpan(
  primary: number,
  secondary: number,
  angleDegrees: number,
): number {
  const primarySpan = Math.max(1, primary);
  const secondarySpan = Math.max(1, Math.min(secondary, primarySpan));
  if (secondarySpan >= primarySpan) {
    return computeForeshortenedSpan(primarySpan, angleDegrees);
  }
  const primarySpanY = computeForeshortenedSpan(primarySpan, angleDegrees);
  return Math.max(1, Math.round((primarySpanY * secondarySpan) / primarySpan));
}

export function resolveOrthographicAngle(config: OrthographicViewConfig): number {
  return config.enabled ? config.cameraAngle : 90;
}
