import type { SelectionRect } from "@/domain/selection/SelectionRect";
import type { CanvasScreenTransform } from "@/domain/viewport/CanvasScreenTransform";
import {
  computeBoundsLabelScreenPosition,
  formatPixelDimensions,
} from "@/domain/viewport/OverlayLabelLayout";

export function CanvasBoundsLabel({
  rect,
  transform,
}: {
  rect: SelectionRect;
  transform: CanvasScreenTransform;
}) {
  const { left, top } = computeBoundsLabelScreenPosition(rect, transform);

  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900/90 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-blue-300 shadow-sm ring-1 ring-blue-500/40"
      style={{ left, top }}
    >
      {formatPixelDimensions(rect.width, rect.height)}
    </div>
  );
}
