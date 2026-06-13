import { useCallback, useEffect, useRef, useState } from "react";
import { rgba, toRgbComponents, type PixelColor } from "@/domain/canvas/PixelColor";
import { oklabPlaneColorAt } from "@/domain/color/ColorConverter";

interface OklabSelectionPlaneProps {
  hue: number;
  markerS: number;
  markerL: number;
  onPickColor: (color: PixelColor) => void;
  onPickEnd: (color: PixelColor) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function OklabSelectionPlane({
  hue,
  markerS,
  markerL,
  onPickColor,
  onPickEnd,
  className = "relative w-full shrink-0 cursor-crosshair overflow-hidden rounded border border-zinc-700 touch-none",
  style,
}: OklabSelectionPlaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);
  const lastPickedRef = useRef<PixelColor | null>(null);
  const [dragMarker, setDragMarker] = useState<{ x: number; y: number } | null>(null);

  const renderPlane = useCallback((renderHue: number, width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = imageData.data;

    for (let py = 0; py < canvas.height; py++) {
      const l = 1 - py / (canvas.height - 1 || 1);
      for (let px = 0; px < canvas.width; px++) {
        const s = (px / (canvas.width - 1 || 1)) * 100;
        const color = oklabPlaneColorAt(renderHue, s, l);
        const { r, g, b } = toRgbComponents(color);
        const i = (py * canvas.width + px) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderPlane(hue, width, height);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [hue, renderPlane]);

  const sampleAt = useCallback(
    (clientX: number, clientY: number): PixelColor | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = Math.min(
        canvas.width - 1,
        Math.max(0, Math.floor(((clientX - rect.left) / rect.width) * canvas.width)),
      );
      const y = Math.min(
        canvas.height - 1,
        Math.max(0, Math.floor(((clientY - rect.top) / rect.height) * canvas.height)),
      );

      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      return rgba(r, g, b);
    },
    [],
  );

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const ratioX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const ratioY = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));

      setDragMarker({ x: ratioX * 100, y: ratioY * 100 });

      const color = sampleAt(clientX, clientY);
      if (color === null) return;

      lastPickedRef.current = color;
      onPickColor(color);
    },
    [onPickColor, sampleAt],
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
    if (!draggingRef.current) return;
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragMarker(null);
    if (lastPickedRef.current !== null) {
      onPickEnd(lastPickedRef.current);
      lastPickedRef.current = null;
    }
  };

  const markerX = dragMarker?.x ?? markerS;
  const markerY = dragMarker?.y ?? (1 - markerL) * 100;

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
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
