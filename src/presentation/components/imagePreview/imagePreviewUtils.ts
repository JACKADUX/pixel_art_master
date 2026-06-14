const MIN_ZOOM = 0.05;
const MAX_ZOOM = 32;
const WHEEL_ZOOM_RATIO = 1.1;

export function computeInitialFitZoom(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): number {
  if (containerWidth <= 0 || containerHeight <= 0) return 1;
  const fit = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight,
  );
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fit));
}

export function applyWheelZoomRatio(currentZoom: number, deltaY: number): number {
  if (deltaY === 0) return currentZoom;
  const factor = Math.pow(WHEEL_ZOOM_RATIO, -deltaY / 100);
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom * factor));
}

export function formatZoomLabel(zoom: number): string {
  if (zoom >= 10) return `${zoom.toFixed(1)}x`;
  return `${zoom.toFixed(2)}x`;
}
