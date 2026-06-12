import { useCallback, useRef } from "react";

interface ColorSelectionPlaneProps {
  x: number;
  y: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  background: string;
  onChange: (x: number, y: number) => void;
}

export function ColorSelectionPlane({
  x,
  y,
  xMin,
  xMax,
  yMin,
  yMax,
  background,
  onChange,
}: ColorSelectionPlaneProps) {
  const planeRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = planeRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratioX = (clientX - rect.left) / rect.width;
      const ratioY = (clientY - rect.top) / rect.height;
      const nextX = xMin + Math.min(1, Math.max(0, ratioX)) * (xMax - xMin);
      const nextY = yMax - Math.min(1, Math.max(0, ratioY)) * (yMax - yMin);
      onChange(nextX, nextY);
    },
    [onChange, xMax, xMin, yMax, yMin],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const markerX = ((x - xMin) / (xMax - xMin)) * 100;
  const markerY = ((yMax - y) / (yMax - yMin)) * 100;

  return (
    <div
      ref={planeRef}
      className="relative h-28 w-full cursor-crosshair overflow-hidden rounded border border-zinc-700 touch-none"
      style={{ background }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{
          left: `${markerX}%`,
          top: `${markerY}%`,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}
