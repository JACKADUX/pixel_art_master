import { useCallback, useRef, type ReactNode } from "react";
import { useAppStore } from "@/presentation/stores/appStore";

const DIVIDER_WIDTH_PX = 4;

type ResizableSidebarProps = {
  children: ReactNode;
  minWidth?: number;
  maxWidth?: number;
};

export function ResizableSidebar({
  children,
  minWidth = 180,
  maxWidth = 400,
}: ResizableSidebarProps) {
  const width = useAppStore((s) => s.sidebarWidth);
  const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(width);

  const clampWidth = useCallback(
    (nextWidth: number) => {
      const viewportMax = Math.floor(window.innerWidth * 0.45);
      const upper = Math.min(maxWidth, viewportMax);
      return Math.min(Math.max(nextWidth, minWidth), upper);
    },
    [maxWidth, minWidth],
  );

  const stopDragging = useCallback((target: HTMLElement, pointerId: number) => {
    draggingRef.current = false;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    target.releasePointerCapture(pointerId);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      draggingRef.current = true;
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      e.currentTarget.setPointerCapture(e.pointerId);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    },
    [width],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;

      const delta = startXRef.current - e.clientX;
      setSidebarWidth(clampWidth(startWidthRef.current + delta));
    },
    [clampWidth, setSidebarWidth],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      stopDragging(e.currentTarget, e.pointerId);
    },
    [stopDragging],
  );

  return (
    <div
      className="relative z-10 flex min-h-0 shrink-0 self-stretch"
      style={{ width: width + DIVIDER_WIDTH_PX }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={width}
        className="w-1 shrink-0 cursor-col-resize border-l border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
