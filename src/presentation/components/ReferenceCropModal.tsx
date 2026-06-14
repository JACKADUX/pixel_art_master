import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CropRect } from "@/domain/layer/Layer";
import { clampCropRect, fullImageCrop } from "@/domain/layer/ReferenceLayerOperations";
import {
  computeFitContainerStageSize,
  computeInitialScrollPosition,
  computeScrollCompensation,
  isSameWorkspaceStageLayout,
  WORKSPACE_CONTAINER_FALLBACK_HEIGHT,
  WORKSPACE_CONTAINER_FALLBACK_WIDTH,
  type WorkspaceStageLayout,
} from "@/domain/viewport/WorkspaceLayout";
import {
  computeScrollPositionForZoomAtPoint,
  resolveCanvasPointAtStagePosition,
  type CanvasPoint,
} from "@/domain/viewport/ZoomAtPoint";
import {
  computePanScrollDelta,
  isMiddleMouseButton,
  isMiddleMousePressed,
} from "@/domain/viewport/ViewportPan";
import { getReferenceImage } from "@/infrastructure/canvas/ReferenceImageCache";
import {
  DEFAULT_APP_SETTINGS,
  gridColorRgbString,
} from "@/domain/appSettings/AppSettings";
import { renderCanvasGrid } from "@/infrastructure/canvas/CanvasGridRenderer";
import {
  blitWithDisplayMode,
  OklabDisplayGlRenderer,
} from "@/infrastructure/canvas/OklabDisplayGlRenderer";
import { useAppStore } from "../stores/appStore";

const MIN_CROP = 1;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 32;
/** 每次滚轮缩放倍率（放大 ×1.1，缩小 ÷1.1） */
const WHEEL_ZOOM_RATIO = 1.1;

type ImagePoint = { x: number; y: number };

interface ZoomAnchor {
  logicalPoint: CanvasPoint;
  clientX: number;
  clientY: number;
}

function snapCropRect(rect: CropRect): CropRect {
  return {
    x: Math.floor(rect.x),
    y: Math.floor(rect.y),
    width: Math.max(MIN_CROP, Math.floor(rect.width)),
    height: Math.max(MIN_CROP, Math.floor(rect.height)),
  };
}

function normalizeRect(a: ImagePoint, b: ImagePoint): CropRect {
  const x = Math.min(Math.floor(a.x), Math.floor(b.x));
  const y = Math.min(Math.floor(a.y), Math.floor(b.y));
  const width = Math.max(MIN_CROP, Math.abs(Math.floor(b.x) - Math.floor(a.x)));
  const height = Math.max(MIN_CROP, Math.abs(Math.floor(b.y) - Math.floor(a.y)));
  return { x, y, width, height };
}

function canvasClientToImage(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  zoom: number,
): ImagePoint {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor((clientX - rect.left) / zoom),
    y: Math.floor((clientY - rect.top) / zoom),
  };
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
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fit));
}

function applyWheelZoomRatio(currentZoom: number, deltaY: number): number {
  if (deltaY === 0) return currentZoom;
  const factor = Math.pow(WHEEL_ZOOM_RATIO, -deltaY / 100);
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom * factor));
}

function formatZoomLabel(zoom: number): string {
  if (zoom >= 10) return `${zoom.toFixed(1)}x`;
  if (zoom >= 1) return `${zoom.toFixed(2)}x`;
  return `${zoom.toFixed(2)}x`;
}

function adjustTopLeftCorner(current: CropRect, dx: number, dy: number): CropRect {
  const bottomRightX = current.x + current.width;
  const bottomRightY = current.y + current.height;
  let x = current.x + dx;
  let y = current.y + dy;
  x = Math.min(x, bottomRightX - MIN_CROP);
  y = Math.min(y, bottomRightY - MIN_CROP);
  return {
    x,
    y,
    width: bottomRightX - x,
    height: bottomRightY - y,
  };
}

function adjustBottomRightCorner(current: CropRect, dx: number, dy: number): CropRect {
  return {
    x: current.x,
    y: current.y,
    width: Math.max(MIN_CROP, current.width + dx),
    height: Math.max(MIN_CROP, current.height + dy),
  };
}

export function ReferenceCropModal() {
  const cropEditorLayerId = useAppStore((s) => s.cropEditorLayerId);
  const project = useAppStore((s) => s.project);
  const closeCropEditor = useAppStore((s) => s.closeCropEditor);
  const setReferenceCrop = useAppStore((s) => s.setReferenceCrop);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const rendererRef = useRef<OklabDisplayGlRenderer | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const zoomRef = useRef(1);
  const isPanningRef = useRef(false);
  const lastPanRef = useRef({ x: 0, y: 0 });
  const zoomAnchorRef = useRef<ZoomAnchor | null>(null);
  const centeredSessionRef = useRef<string | null>(null);
  const didInitialScrollRef = useRef(false);
  const prevStageLayoutRef = useRef<WorkspaceStageLayout | null>(null);
  const stageLayoutRef = useRef<WorkspaceStageLayout | null>(null);
  const selectRef = useRef<{ start: ImagePoint; current: ImagePoint } | null>(null);

  const layer = project?.canvas.layers.find(
    (l) => l.id === cropEditorLayerId && l.type === "reference",
  );
  const refLayer = layer?.type === "reference" ? layer : null;

  const defaultCrop = useMemo((): CropRect | null => {
    if (!refLayer?.imageSize) return null;
    return snapCropRect(
      clampCropRect(refLayer.crop ?? fullImageCrop(refLayer.imageSize), refLayer.imageSize),
    );
  }, [refLayer?.id, refLayer?.imageData, refLayer?.imageSize, refLayer?.crop]);

  const [crop, setCrop] = useState<CropRect | null>(null);
  const [zoom, setZoom] = useState(1);
  const [marquee, setMarquee] = useState<CropRect | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showPixelGrid, setShowPixelGrid] = useState(false);
  const [showOklabLightness, setShowOklabLightness] = useState(false);

  zoomRef.current = zoom;

  const imageSize = refLayer?.imageSize;
  const displayWidth = imageSize ? imageSize.width * zoom : 0;
  const displayHeight = imageSize ? imageSize.height * zoom : 0;

  const layoutContainerWidth =
    containerSize.width > 0 ? containerSize.width : WORKSPACE_CONTAINER_FALLBACK_WIDTH;
  const layoutContainerHeight =
    containerSize.height > 0 ? containerSize.height : WORKSPACE_CONTAINER_FALLBACK_HEIGHT;

  const stageLayout = useMemo(() => {
    if (!imageSize || displayWidth <= 0 || displayHeight <= 0) return null;
    return computeFitContainerStageSize(
      layoutContainerWidth,
      layoutContainerHeight,
      displayWidth,
      displayHeight,
    );
  }, [imageSize, layoutContainerWidth, layoutContainerHeight, displayWidth, displayHeight]);

  stageLayoutRef.current = stageLayout;

  const resolvedCrop = crop ?? defaultCrop;

  useEffect(() => {
    centeredSessionRef.current = null;
    didInitialScrollRef.current = false;
    prevStageLayoutRef.current = null;
    imageRef.current = null;
    setImageReady(false);
    setZoom(1);
    setShowPixelGrid(false);
    setShowOklabLightness(false);
    setCrop(null);
    setMarquee(null);
  }, [refLayer?.id, refLayer?.imageData, refLayer?.imageSize, refLayer?.crop]);

  useEffect(() => {
    if (!refLayer?.imageData) return;
    let cancelled = false;
    void getReferenceImage(refLayer.id, refLayer.imageData).then((img) => {
      if (cancelled) return;
      imageRef.current = img;
      setImageReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [refLayer?.id, refLayer?.imageData]);

  const displayCrop = marquee ?? resolvedCrop;

  useEffect(() => {
    rendererRef.current = new OklabDisplayGlRenderer();
    glCanvasRef.current = document.createElement("canvas");
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
      glCanvasRef.current = null;
    };
  }, [cropEditorLayerId]);

  const drawImageLayer = useCallback(() => {
    const canvas = imageCanvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !imageSize) return;

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    if (showOklabLightness) {
      const renderer = rendererRef.current;
      const glCanvas = glCanvasRef.current;
      if (renderer && glCanvas) {
        blitWithDisplayMode(
          renderer,
          glCanvas,
          image,
          displayWidth,
          displayHeight,
          "oklabLightness",
        );
        ctx.drawImage(glCanvas, 0, 0, displayWidth, displayHeight);
      }
      return;
    }

    ctx.drawImage(image, 0, 0, displayWidth, displayHeight);
  }, [imageSize, displayWidth, displayHeight, showOklabLightness]);

  const drawCropOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !imageSize || !displayCrop) return;

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const cropX = displayCrop.x * zoom;
    const cropY = displayCrop.y * zoom;
    const cropW = displayCrop.width * zoom;
    const cropH = displayCrop.height * zoom;

    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, displayWidth, cropY);
    ctx.fillRect(0, cropY + cropH, displayWidth, displayHeight - cropY - cropH);
    ctx.fillRect(0, cropY, cropX, cropH);
    ctx.fillRect(cropX + cropW, cropY, displayWidth - cropX - cropW, cropH);

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX + 0.5, cropY + 0.5, Math.max(0, cropW - 1), Math.max(0, cropH - 1));

    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(cropX + 0.5, cropY + 0.5, Math.max(0, cropW - 1), Math.max(0, cropH - 1));
    ctx.setLineDash([]);
  }, [imageSize, displayCrop, displayWidth, displayHeight, zoom]);

  const drawGridOverlay = useCallback(() => {
    const gridCanvas = gridCanvasRef.current;
    if (!gridCanvas || !imageSize) return;

    gridCanvas.width = displayWidth;
    gridCanvas.height = displayHeight;
    gridCanvas.style.width = `${displayWidth}px`;
    gridCanvas.style.height = `${displayHeight}px`;

    const ctx = gridCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    if (!showPixelGrid) return;

    renderCanvasGrid(ctx, imageSize.width, imageSize.height, zoom, {
      primary: 1,
      secondary: 1,
      colorRgb: gridColorRgbString(DEFAULT_APP_SETTINGS.gridColorHex),
      lineWidth: DEFAULT_APP_SETTINGS.gridLineWidth,
      subGridEnabled: false,
    });
  }, [imageSize, displayWidth, displayHeight, zoom, showPixelGrid]);

  useLayoutEffect(() => {
    drawImageLayer();
    drawCropOverlay();
    drawGridOverlay();
  }, [drawImageLayer, drawCropOverlay, drawGridOverlay, imageReady, zoom]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });
    observer.observe(container);
    setContainerSize({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    return () => observer.disconnect();
  }, [cropEditorLayerId]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !cropEditorLayerId || !imageSize || !imageReady) return;
    if (centeredSessionRef.current === cropEditorLayerId) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    if (containerWidth <= 0 || containerHeight <= 0) return;

    const fitZoom = computeInitialFitZoom(
      containerWidth,
      containerHeight,
      imageSize.width,
      imageSize.height,
    );
    const fittedDisplayWidth = imageSize.width * fitZoom;
    const fittedDisplayHeight = imageSize.height * fitZoom;
    const layout = computeFitContainerStageSize(
      containerWidth,
      containerHeight,
      fittedDisplayWidth,
      fittedDisplayHeight,
    );
    const { scrollLeft, scrollTop } = computeInitialScrollPosition(
      layout.canvasLeft,
      layout.canvasTop,
      fittedDisplayWidth,
      fittedDisplayHeight,
      containerWidth,
      containerHeight,
    );

    didInitialScrollRef.current = false;
    prevStageLayoutRef.current = null;
    zoomAnchorRef.current = null;
    setZoom(fitZoom);
    centeredSessionRef.current = cropEditorLayerId;

    requestAnimationFrame(() => {
      const currentContainer = containerRef.current;
      if (!currentContainer || centeredSessionRef.current !== cropEditorLayerId) return;
      currentContainer.scrollLeft = scrollLeft;
      currentContainer.scrollTop = scrollTop;
      prevStageLayoutRef.current = layout;
      didInitialScrollRef.current = true;
    });
  }, [cropEditorLayerId, imageSize, imageReady, containerSize.width, containerSize.height]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !stageLayout || !imageReady || !cropEditorLayerId) return;
    if (centeredSessionRef.current !== cropEditorLayerId) return;
    if (didInitialScrollRef.current) return;

    const { scrollLeft, scrollTop } = computeInitialScrollPosition(
      stageLayout.canvasLeft,
      stageLayout.canvasTop,
      displayWidth,
      displayHeight,
      layoutContainerWidth,
      layoutContainerHeight,
    );
    container.scrollLeft = scrollLeft;
    container.scrollTop = scrollTop;
    prevStageLayoutRef.current = stageLayout;
    didInitialScrollRef.current = true;
  }, [
    cropEditorLayerId,
    stageLayout,
    displayWidth,
    displayHeight,
    layoutContainerWidth,
    layoutContainerHeight,
    imageReady,
    zoom,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const prev = prevStageLayoutRef.current;
    if (!container || !stageLayout) return;
    if (centeredSessionRef.current !== cropEditorLayerId) return;
    if (zoomAnchorRef.current) return;

    if (!prev) {
      prevStageLayoutRef.current = stageLayout;
      return;
    }
    if (isSameWorkspaceStageLayout(prev, stageLayout)) return;

    const { scrollLeft, scrollTop } = computeScrollCompensation(prev, stageLayout);
    container.scrollLeft += scrollLeft;
    container.scrollTop += scrollTop;
    prevStageLayoutRef.current = stageLayout;
  }, [cropEditorLayerId, stageLayout]);

  useLayoutEffect(() => {
    const anchor = zoomAnchorRef.current;
    const container = containerRef.current;
    if (!anchor || !container || !stageLayout) return;

    zoomAnchorRef.current = null;

    const containerRect = container.getBoundingClientRect();
    const { scrollLeft, scrollTop } = computeScrollPositionForZoomAtPoint(
      anchor.logicalPoint,
      zoom,
      stageLayout,
      containerRect.left,
      containerRect.top,
      anchor.clientX,
      anchor.clientY,
    );
    container.scrollLeft = scrollLeft;
    container.scrollTop = scrollTop;
    prevStageLayoutRef.current = stageLayout;
  }, [zoom, stageLayout]);

  const applyCropUpdate = useCallback(
    (updater: (current: CropRect) => CropRect) => {
      if (!imageSize || !resolvedCrop) return;
      setCrop(snapCropRect(clampCropRect(updater(resolvedCrop), imageSize)));
      setMarquee(null);
    },
    [resolvedCrop, imageSize],
  );

  const resetCropToFullImage = useCallback(() => {
    if (!imageSize) return;
    selectRef.current = null;
    setIsSelecting(false);
    setMarquee(null);
    setCrop(snapCropRect(clampCropRect(fullImageCrop(imageSize), imageSize)));
  }, [imageSize]);

  const startPanning = useCallback((clientX: number, clientY: number) => {
    isPanningRef.current = true;
    setIsPanning(true);
    lastPanRef.current = { x: clientX, y: clientY };
  }, []);

  const stopPanning = useCallback(() => {
    isPanningRef.current = false;
    setIsPanning(false);
  }, []);

  const applyPanMove = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const { deltaX, deltaY } = computePanScrollDelta(lastPanRef.current, {
      x: clientX,
      y: clientY,
    });
    container.scrollLeft += deltaX;
    container.scrollTop += deltaY;
    lastPanRef.current = { x: clientX, y: clientY };
  }, []);

  useEffect(() => {
    if (!cropEditorLayerId || !imageSize) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!arrowKeys.includes(e.key)) return;
      e.preventDefault();

      const dx = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
      const dy = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;

      if (e.shiftKey) {
        applyCropUpdate((current) => adjustBottomRightCorner(current, dx, dy));
      } else {
        applyCropUpdate((current) => adjustTopLeftCorner(current, dx, dy));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cropEditorLayerId, imageSize, applyCropUpdate]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !cropEditorLayerId || !imageSize || !resolvedCrop || !imageReady) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const currentStageLayout = stageLayoutRef.current;
      if (!currentStageLayout) return;

      const currentZoom = zoomRef.current;
      const newZoom = applyWheelZoomRatio(currentZoom, e.deltaY);
      if (Math.abs(newZoom - currentZoom) < 0.0001) return;

      const containerRect = container.getBoundingClientRect();
      const stageX = container.scrollLeft + (e.clientX - containerRect.left);
      const stageY = container.scrollTop + (e.clientY - containerRect.top);

      zoomAnchorRef.current = {
        logicalPoint: resolveCanvasPointAtStagePosition(
          stageX,
          stageY,
          currentStageLayout.canvasLeft,
          currentStageLayout.canvasTop,
          currentZoom,
        ),
        clientX: e.clientX,
        clientY: e.clientY,
      };
      setZoom(newZoom);
    };

    container.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => container.removeEventListener("wheel", handleWheel, { capture: true });
  }, [cropEditorLayerId, imageSize, resolvedCrop, imageReady]);

  useEffect(() => {
    if (!cropEditorLayerId || !imageSize) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanningRef.current) {
        if (!isMiddleMousePressed(e.buttons)) {
          stopPanning();
          return;
        }
        applyPanMove(e.clientX, e.clientY);
        return;
      }

      const selection = selectRef.current;
      const canvas = overlayCanvasRef.current;
      if (!selection || !canvas) return;

      const current = canvasClientToImage(e.clientX, e.clientY, canvas, zoomRef.current);
      selection.current = current;
      setMarquee(clampCropRect(normalizeRect(selection.start, current), imageSize));
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isPanningRef.current) {
        stopPanning();
        return;
      }

      const selection = selectRef.current;
      const canvas = overlayCanvasRef.current;
      if (!selection || !canvas) return;

      selectRef.current = null;
      setIsSelecting(false);

      if (e.button !== 0) return;

      const current = canvasClientToImage(e.clientX, e.clientY, canvas, zoomRef.current);
      setCrop(clampCropRect(normalizeRect(selection.start, current), imageSize));
      setMarquee(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [cropEditorLayerId, imageSize, applyPanMove, stopPanning]);

  useEffect(() => {
    if (!isPanning) return;

    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (!isPanningRef.current) return;
      if (!isMiddleMousePressed(e.buttons)) {
        stopPanning();
        return;
      }
      applyPanMove(e.clientX, e.clientY);
    };

    const handleDocumentMouseUp = (e: MouseEvent) => {
      if (isMiddleMouseButton(e.button)) {
        stopPanning();
      }
    };

    document.addEventListener("mousemove", handleDocumentMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleDocumentMouseMove);
      document.removeEventListener("mouseup", handleDocumentMouseUp);
    };
  }, [isPanning, applyPanMove, stopPanning]);

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMiddleMouseButton(e.button)) return;
    e.preventDefault();
    startPanning(e.clientX, e.clientY);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMiddleMouseButton(e.button)) {
      e.preventDefault();
      startPanning(e.clientX, e.clientY);
      return;
    }
    if (e.button !== 0) return;

    const canvas = overlayCanvasRef.current;
    if (!canvas || !imageSize) return;

    e.preventDefault();
    const start = canvasClientToImage(e.clientX, e.clientY, canvas, zoom);
    selectRef.current = { start, current: start };
    setIsSelecting(true);
    setMarquee(clampCropRect(normalizeRect(start, start), imageSize));
  };

  const handleAuxClick = (e: React.MouseEvent) => {
    if (isMiddleMouseButton(e.button)) {
      e.preventDefault();
    }
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    resetCropToFullImage();
  };

  if (!cropEditorLayerId || !refLayer?.imageData || !imageSize || !resolvedCrop) {
    return null;
  }

  const activeCrop = marquee ?? resolvedCrop;
  const cropLabelLeft = activeCrop.x * zoom + (activeCrop.width * zoom) / 2;
  const cropLabelTop = activeCrop.y * zoom + activeCrop.height * zoom + 6;

  const handleConfirm = () => {
    setReferenceCrop(cropEditorLayerId, snapCropRect(resolvedCrop));
    closeCropEditor();
  };

  const modal = (
    <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950">
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-2.5">
        <div>
          <h2 className="text-sm font-medium text-zinc-100">裁剪参考层 — {refLayer.name}</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            滚轮缩放 · 中键平移 · 左键框选 · 右键全图选区 · 方向键调整左上角 · Shift+方向键调整右下角 · 缩放 {formatZoomLabel(zoom)} · Oklab 明度 / 像素网格可开关
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowOklabLightness((v) => !v)}
            className={`rounded border px-2.5 py-1 text-xs font-medium transition ${
              showOklabLightness
                ? "border-blue-500 bg-blue-500/15 text-blue-300"
                : "border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            Oklab 明度
          </button>
          <button
            type="button"
            onClick={() => setShowPixelGrid((v) => !v)}
            className={`rounded border px-2.5 py-1 text-xs font-medium transition ${
              showPixelGrid
                ? "border-blue-500 bg-blue-500/15 text-blue-300"
                : "border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            }`}
          >
            像素网格
          </button>
          <p className="text-xs text-zinc-400">
            选区 ({activeCrop.x}, {activeCrop.y})
          </p>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`relative min-h-0 flex-1 overflow-auto overscroll-none bg-zinc-800${
          isPanning ? " cursor-grabbing" : ""
        }`}
        onMouseDown={handleContainerMouseDown}
        onAuxClick={handleAuxClick}
        onMouseUp={stopPanning}
        onMouseLeave={stopPanning}
        onContextMenu={(e) => e.preventDefault()}
      >
        {stageLayout && (
          <div
            className="relative shrink-0"
            style={{
              width: stageLayout.stageWidth,
              height: stageLayout.stageHeight,
            }}
          >
            <div
              className="absolute"
              style={{
                left: stageLayout.canvasLeft,
                top: stageLayout.canvasTop,
                imageRendering: "pixelated",
              }}
            >
              <canvas
                ref={imageCanvasRef}
                className="pointer-events-none block touch-none select-none"
                style={{ imageRendering: "pixelated" }}
                draggable={false}
              />
              <canvas
                ref={overlayCanvasRef}
                className={`absolute left-0 top-0 block touch-none select-none${
                  isSelecting ? " cursor-crosshair" : isPanning ? " cursor-grabbing" : " cursor-crosshair"
                }`}
                style={{ imageRendering: "pixelated" }}
                draggable={false}
                onMouseDown={handleCanvasMouseDown}
                onAuxClick={handleAuxClick}
                onContextMenu={handleCanvasContextMenu}
              />
              <canvas
                ref={gridCanvasRef}
                className="pointer-events-none absolute left-0 top-0"
                style={{ imageRendering: "pixelated" }}
              />
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900/90 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-blue-300 shadow-sm ring-1 ring-blue-500/40"
                style={{
                  left: cropLabelLeft,
                  top: cropLabelTop,
                }}
              >
                {activeCrop.width} × {activeCrop.height}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t border-zinc-800 px-4 py-2.5">
        <button
          type="button"
          className="rounded px-4 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
          onClick={closeCropEditor}
        >
          取消
        </button>
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-500"
          onClick={handleConfirm}
        >
          确认
        </button>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
