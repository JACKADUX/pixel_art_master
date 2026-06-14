import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 32;

interface PixelRestorePreviewProps {
  imageData: ImageData | null;
  label: string;
  pixelated?: boolean;
}

function computeInitialFitZoom(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): number {
  if (containerWidth <= 0 || containerHeight <= 0) return 1;
  const fit = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight,
  );
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fit * 0.95));
}

export function PixelRestorePreview({
  imageData,
  label,
  pixelated = false,
}: PixelRestorePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !imageData) return;

    const observer = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      setZoom(
        computeInitialFitZoom(
          rect.width,
          rect.height,
          imageData.width,
          imageData.height,
        ),
      );
    });
    observer.observe(container);
    const rect = container.getBoundingClientRect();
    setZoom(
      computeInitialFitZoom(
        rect.width,
        rect.height,
        imageData.width,
        imageData.height,
      ),
    );
    return () => observer.disconnect();
  }, [imageData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = !pixelated;
    ctx.putImageData(imageData, 0, 0);
  }, [imageData, pixelated]);

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      const factor = Math.pow(1.1, -event.deltaY / 100);
      setZoom((current) =>
        Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current * factor)),
      );
    },
    [],
  );

  const displayWidth = imageData ? imageData.width * zoom : 0;
  const displayHeight = imageData ? imageData.height * zoom : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
        {label}
        {imageData && (
          <span className="ml-2 text-zinc-600">
            {imageData.width} × {imageData.height}
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-auto bg-zinc-950"
        onWheel={handleWheel}
      >
        {!imageData ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">
            暂无图像
          </div>
        ) : (
          <div className="flex min-h-full min-w-full items-center justify-center p-4">
            <canvas
              ref={canvasRef}
              style={{
                width: displayWidth,
                height: displayHeight,
                imageRendering: pixelated ? "pixelated" : "auto",
              }}
              className="border border-zinc-800 bg-zinc-900"
            />
          </div>
        )}
      </div>
    </div>
  );
}
