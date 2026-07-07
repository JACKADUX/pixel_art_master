export const EDITOR_MIN_ZOOM = 0.05;
export const EDITOR_MAX_ZOOM = 32;
export const EDITOR_WHEEL_ZOOM_RATIO = 1.1;

export function clampEditorZoom(zoom: number): number {
  return Math.max(EDITOR_MIN_ZOOM, Math.min(EDITOR_MAX_ZOOM, zoom));
}

export function applyEditorWheelZoomRatio(currentZoom: number, deltaY: number): number {
  if (deltaY === 0) return currentZoom;
  const factor = Math.pow(EDITOR_WHEEL_ZOOM_RATIO, -deltaY / 100);
  return clampEditorZoom(currentZoom * factor);
}

export function formatEditorZoomLabel(zoom: number): string {
  if (zoom >= 10) return `${zoom.toFixed(1)}×`;
  return `${zoom.toFixed(2)}×`;
}

/** Maps slider position [0, 1] to zoom using log scale. */
export function editorZoomFromSlider(sliderValue: number): number {
  const t = Math.max(0, Math.min(1, sliderValue));
  const logMin = Math.log(EDITOR_MIN_ZOOM);
  const logMax = Math.log(EDITOR_MAX_ZOOM);
  return clampEditorZoom(Math.exp(logMin + t * (logMax - logMin)));
}

/** Maps zoom to slider position [0, 1] using log scale. */
export function editorZoomToSlider(zoom: number): number {
  const clamped = clampEditorZoom(zoom);
  const logMin = Math.log(EDITOR_MIN_ZOOM);
  const logMax = Math.log(EDITOR_MAX_ZOOM);
  return (Math.log(clamped) - logMin) / (logMax - logMin);
}
