import type { BrushSizeHintState } from "../hooks/useBrushSizeHint";

const CURSOR_OFFSET = 8;

export function CanvasBrushSizeHint({ hint }: { hint: BrushSizeHintState }) {
  return (
    <div
      className="pointer-events-none fixed z-[200] whitespace-nowrap rounded bg-zinc-900/90 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-blue-300 shadow-sm ring-1 ring-blue-500/40"
      style={{
        left: hint.clientX,
        top: hint.clientY - CURSOR_OFFSET,
        transform: "translate(-50%, -100%)",
      }}
    >
      {hint.size}
    </div>
  );
}
