import { useCallback, useEffect, useRef, useState } from "react";
import { toRgbComponents, type PixelColor } from "@/domain/canvas/PixelColor";
import { isOklchInSrgbGamut, oklchPlaneColorAt } from "@/domain/color/ColorConverter";
import { OKLCH_MAX_CHROMA } from "@/domain/color/OklchColor";

interface OklchSelectionPlaneProps {
  hue: number;
  markerC: number;
  markerL: number;
  onPickColor: (color: PixelColor) => void;
  onPickEnd: (color: PixelColor) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function OklchSelectionPlane({
  hue,
  markerC,
  markerL,
  onPickColor,
  onPickEnd,
  className = "relative w-full shrink-0 cursor-crosshair overflow-hidden rounded border border-zinc-700 touch-none",
  style,
}: OklchSelectionPlaneProps) {
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
        const c = (px / (canvas.width - 1 || 1)) * OKLCH_MAX_CHROMA;
        const color = oklchPlaneColorAt(renderHue, c, l);
        const { r, g, b } = toRgbComponents(color);
        const opacity = isOklchInSrgbGamut(renderHue, c, l) ? 1 : 0.3;
        const i = (py * canvas.width + px) * 4;
        data[i] = Math.round(r * opacity);
        data[i + 1] = Math.round(g * opacity);
        data[i + 2] = Math.round(b * opacity);
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
      const container = containerRef.current;
      if (!container) return null;

      const rect = container.getBoundingClientRect();
      const ratioX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const ratioY = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
      const c = ratioX * OKLCH_MAX_CHROMA;
      const l = 1 - ratioY;

      return oklchPlaneColorAt(hue, c, l);
    },
    [hue],
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

  const markerX = dragMarker?.x ?? (markerC / OKLCH_MAX_CHROMA) * 100;
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
