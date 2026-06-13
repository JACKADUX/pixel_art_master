import { useCallback, useRef, type ReactNode } from "react";
import { useAppStore } from "@/presentation/stores/appStore";

const DIVIDER_HEIGHT_PX = 4;

type VerticalSplitPaneProps = {
  top: ReactNode;
  bottom: ReactNode;
  minTopPx?: number;
  minBottomPx?: number;
};

export function VerticalSplitPane({
  top,
  bottom,
  minTopPx = 120,
  minBottomPx = 160,
}: VerticalSplitPaneProps) {
  const topRatio = useAppStore((s) => s.splitPaneRatio);
  const setSplitPaneRatio = useAppStore((s) => s.setSplitPaneRatio);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const clampRatio = useCallback(
    (ratio: number, containerHeight: number) => {
      const available = containerHeight - DIVIDER_HEIGHT_PX;
      if (available <= 0) return topRatio;

      const minTopRatio = minTopPx / available;
      const maxTopRatio = 1 - minBottomPx / available;
      return Math.min(Math.max(ratio, minTopRatio), maxTopRatio);
    },
    [minBottomPx, minTopPx, topRatio],
  );

  const stopDragging = useCallback((target: HTMLElement, pointerId: number) => {
    draggingRef.current = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    target.releasePointerCapture(pointerId);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const available = rect.height - DIVIDER_HEIGHT_PX;
      const ratio = (e.clientY - rect.top) / available;
      setSplitPaneRatio(clampRatio(ratio, rect.height));
    },
    [clampRatio, setSplitPaneRatio],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      stopDragging(e.currentTarget, e.pointerId);
    },
    [stopDragging],
  );

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 flex-col">
      <div
        className="flex min-h-0 min-w-0 flex-col overflow-hidden"
        style={{ flex: topRatio }}
      >
        {top}
      </div>

      <div
        role="separator"
        aria-orientation="horizontal"
        aria-valuenow={Math.round(topRatio * 100)}
        className="h-1 shrink-0 cursor-row-resize border-y border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      <div className="min-h-0 min-w-0 overflow-hidden" style={{ flex: 1 - topRatio }}>
        {bottom}
      </div>
    </div>
  );
}
