import { formatGridRelativePosition } from "@/domain/grid/GridRelativePosition";
import type { MousePositionOverlayState } from "../hooks/useMousePositionOverlay";

export function CanvasMousePositionHint({ hint }: { hint: MousePositionOverlayState }) {
  return (
    <div
      className="pointer-events-none fixed z-[200] whitespace-nowrap rounded bg-zinc-900/90 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-blue-300 shadow-sm ring-1 ring-blue-500/40"
      style={{
        left: hint.labelX,
        top: hint.labelY,
        transform: "translateY(-100%)",
      }}
    >
      {formatGridRelativePosition(hint.offset)}
    </div>
  );
}
