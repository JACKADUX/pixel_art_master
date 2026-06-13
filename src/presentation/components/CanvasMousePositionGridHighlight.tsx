import type { MousePositionOverlayState } from "../hooks/useMousePositionOverlay";

export function CanvasMousePositionGridHighlight({
  hint,
}: {
  hint: MousePositionOverlayState;
}) {
  const { cellBounds } = hint;

  return (
    <div
      className="pointer-events-none fixed z-[199] box-border border border-blue-400/80"
      style={{
        left: cellBounds.left,
        top: cellBounds.top,
        width: cellBounds.width,
        height: cellBounds.height,
      }}
      aria-hidden
    />
  );
}
