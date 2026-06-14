import { useCallback, useRef, type ReactNode } from "react";

const DIVIDER_WIDTH_PX = 4;

type ResizablePanelColumnProps = {
  width: number;
  onWidthChange: (width: number) => void;
  children: ReactNode;
  minWidth?: number;
  maxWidth?: number;
  className?: string;
};

export function ResizablePanelColumn({
  width,
  onWidthChange,
  children,
  minWidth = 120,
  maxWidth = 400,
  className = "",
}: ResizablePanelColumnProps) {
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

      const delta = e.clientX - startXRef.current;
      onWidthChange(clampWidth(startWidthRef.current + delta));
    },
    [clampWidth, onWidthChange],
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
      className={`relative flex min-h-0 shrink-0 self-stretch ${className}`}
      style={{ width: width + DIVIDER_WIDTH_PX }}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={width}
        className="w-1 shrink-0 cursor-col-resize border-r border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
