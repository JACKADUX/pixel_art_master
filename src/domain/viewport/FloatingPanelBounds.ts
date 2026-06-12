export function clampPanelPosition(
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number,
  containerWidth: number | null,
  containerHeight: number | null,
): { x: number; y: number } {
  const maxX =
    containerWidth !== null ? Math.max(0, containerWidth - panelWidth) : x;
  const maxY =
    containerHeight !== null ? Math.max(0, containerHeight - panelHeight) : y;

  return {
    x: Math.max(0, Math.min(maxX, x)),
    y: Math.max(0, Math.min(maxY, y)),
  };
}
