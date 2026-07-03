import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  computeInitialScrollPosition,
  computeScrollCompensation,
  computeWorkspaceStageSize,
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
import type { CropRect } from "@/domain/layer/Layer";
import { clampCropRect } from "@/domain/layer/ReferenceLayerOperations";
import {
  hitTestRegionCornerHandle,
  normalizeRegionRect,
  REGION_HANDLE_SIZE_PX,
  resizeRegionFromCornerHandle,
  type RegionCornerHandle,
} from "@/domain/selection/RegionSelectRect";
import type { CanvasDisplayMode } from "@/domain/color/CanvasDisplayMode";
import { OklchDisplayGlRenderer } from "@/infrastructure/canvas/OklchDisplayGlRenderer";
import {
  renderTransparencyCheckerboard,
  type CheckerboardOptions,
} from "@/infrastructure/canvas/CanvasBackgroundRenderer";
import { ensureImageData } from "@/infrastructure/image/ImageDataCodec";
import {
  applyWheelZoomRatio,
  computeInitialFitZoom,
  formatZoomLabel,
} from "./imagePreviewUtils";
import { canvasClientToImage } from "./useImagePreviewViewport";

interface ZoomAnchor {
  logicalPoint: CanvasPoint;
  clientX: number;
  clientY: number;
}

export interface ImagePreviewWorkspaceProps {
  imageData: ImageData | null;
  label?: string;
  emptyLabel?: string;
  pixelated?: boolean;
  showZoomLabel?: boolean;
  className?: string;
  /** Mouse button for drag-pan: 0 = left, 1 = middle (default) */
  panMouseButton?: number;
  displayMode?: CanvasDisplayMode;
  pickMode?: boolean;
  onPickPixel?: (x: number, y: number) => void;
  /** 透明棋盘格底色；传入时在图像下方绘制，便于查看带透明通道的图片。 */
  checkerboard?: CheckerboardOptions | null;
  /**
   * 区域选框模式：开启后左键拖拽创建/调整选框、中键平移视图、右键取消选框。
   * 选框矩形由调用方受控持有（便于方向键微调），本组件负责绘制与鼠标交互。
   */
  selectionMode?: boolean;
  /** 受控的已提交选框（图像像素坐标）。 */
  selection?: CropRect | null;
  /** 选框提交/调整/取消回调；取消时传入 null。 */
  onSelectionChange?: (rect: CropRect | null) => void;
}

const SELECTION_FILL_COLOR = "rgba(56, 189, 248, 0.22)";
const SELECTION_STROKE_COLOR = "#38bdf8";
const HANDLE_FILL_COLOR = "#ffffff";
const HANDLE_STROKE_COLOR = "#38bdf8";

interface SelectionOverlayTransform {
  offX: number;
  offY: number;
  zoom: number;
}

function drawSelectionHandle(
  ctx: CanvasRenderingContext2D,
  t: SelectionOverlayTransform,
  imageX: number,
  imageY: number,
) {
  const cx = t.offX + imageX * t.zoom;
  const cy = t.offY + imageY * t.zoom;
  const size = REGION_HANDLE_SIZE_PX;
  const half = size / 2;
  ctx.fillStyle = HANDLE_FILL_COLOR;
  ctx.fillRect(cx - half, cy - half, size, size);
  ctx.strokeStyle = HANDLE_STROKE_COLOR;
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - half + 0.5, cy - half + 0.5, size - 1, size - 1);
}

function drawSelectionRect(
  ctx: CanvasRenderingContext2D,
  t: SelectionOverlayTransform,
  rect: CropRect,
) {
  const x = t.offX + rect.x * t.zoom;
  const y = t.offY + rect.y * t.zoom;
  const w = rect.width * t.zoom;
  const h = rect.height * t.zoom;

  ctx.fillStyle = SELECTION_FILL_COLOR;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = SELECTION_STROKE_COLOR;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, Math.max(0, w - 2), Math.max(0, h - 2));

  drawSelectionHandle(ctx, t, rect.x, rect.y);
  drawSelectionHandle(ctx, t, rect.x + rect.width, rect.y);
  drawSelectionHandle(ctx, t, rect.x, rect.y + rect.height);
  drawSelectionHandle(ctx, t, rect.x + rect.width, rect.y + rect.height);
}

export function ImagePreviewWorkspace({
  imageData,
  label,
  emptyLabel = "暂无图像",
  pixelated = true,
  showZoomLabel = true,
  className = "",
  panMouseButton = 1,
  displayMode = "normal",
  pickMode = false,
  onPickPixel,
  checkerboard = null,
  selectionMode = false,
  selection = null,
  onSelectionChange,
}: ImagePreviewWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const checkerboardCanvasRef = useRef<HTMLCanvasElement>(null);
  const oklchRendererRef = useRef<OklchDisplayGlRenderer | null>(null);
  const zoomRef = useRef(1);
  const isPanningRef = useRef(false);
  const lastPanRef = useRef({ x: 0, y: 0 });
  const zoomAnchorRef = useRef<ZoomAnchor | null>(null);
  const centeredImageKeyRef = useRef<string | null>(null);
  const didInitialScrollRef = useRef(false);
  const prevImageKeyRef = useRef<string | null>(null);
  const prevStageLayoutRef = useRef<WorkspaceStageLayout | null>(null);
  const stageLayoutRef = useRef<WorkspaceStageLayout | null>(null);

  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [marquee, setMarquee] = useState<CropRect | null>(null);

  // 选框模式下：左键用于选框，平移改用中键，避免与框选冲突。
  const effectivePanButton = selectionMode ? 1 : panMouseButton;

  const selectRef = useRef<{ start: { x: number; y: number } } | null>(null);
  const handleDragRef = useRef<RegionCornerHandle | null>(null);
  const selectionRef = useRef<CropRect | null>(selection);
  selectionRef.current = selection;

  zoomRef.current = zoom;

  const imageKey = imageData
    ? `${imageData.width}x${imageData.height}:${imageData.data.length}`
    : null;
  const imageWidth = imageData?.width ?? 0;
  const imageHeight = imageData?.height ?? 0;
  const displayWidth = imageData ? imageWidth * zoom : 0;
  const displayHeight = imageData ? imageHeight * zoom : 0;

  const layoutContainerWidth =
    containerSize.width > 0 ? containerSize.width : WORKSPACE_CONTAINER_FALLBACK_WIDTH;
  const layoutContainerHeight =
    containerSize.height > 0 ? containerSize.height : WORKSPACE_CONTAINER_FALLBACK_HEIGHT;

  const stageLayout = useMemo(() => {
    if (!imageData || displayWidth <= 0 || displayHeight <= 0) return null;
    return computeWorkspaceStageSize(
      layoutContainerWidth,
      layoutContainerHeight,
      displayWidth,
      displayHeight,
    );
  }, [imageData, layoutContainerWidth, layoutContainerHeight, displayWidth, displayHeight]);

  stageLayoutRef.current = stageLayout;

  useLayoutEffect(() => {
    if (prevImageKeyRef.current === imageKey) return;
    prevImageKeyRef.current = imageKey;
    centeredImageKeyRef.current = null;
    didInitialScrollRef.current = false;
    prevStageLayoutRef.current = null;
    zoomAnchorRef.current = null;
  }, [imageKey]);

  useEffect(() => {
    oklchRendererRef.current = new OklchDisplayGlRenderer();
    return () => {
      oklchRendererRef.current?.dispose();
      oklchRendererRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (displayMode !== "oklchLightness" || !imageData) return;
    oklchRendererRef.current?.setSource(imageData);
  }, [imageData, imageKey, displayMode]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    if (displayMode === "oklchLightness") {
      const renderer = oklchRendererRef.current;
      if (!renderer) return;
      renderer.initCanvas(canvas);
      renderer.render(canvas, displayWidth, displayHeight, "oklchLightness");
      return;
    }

    canvas.width = imageWidth;
    canvas.height = imageHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.putImageData(ensureImageData(imageData), 0, 0);
  }, [imageData, imageWidth, imageHeight, displayWidth, displayHeight, displayMode]);

  useLayoutEffect(() => {
    const canvas = checkerboardCanvasRef.current;
    if (!canvas || !imageData || !checkerboard) return;

    // 以逻辑分辨率绘制棋盘格，再交由 CSS 像素化缩放，使格子随缩放一致放大。
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, imageWidth, imageHeight);
    renderTransparencyCheckerboard(ctx, imageWidth, imageHeight, 1, checkerboard);
  }, [imageData, imageWidth, imageHeight, displayWidth, displayHeight, checkerboard]);

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
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !imageData || !imageKey) return;
    if (centeredImageKeyRef.current === imageKey) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    if (containerWidth <= 0 || containerHeight <= 0) return;

    const fitZoom = computeInitialFitZoom(
      containerWidth,
      containerHeight,
      imageWidth,
      imageHeight,
    );
    const fittedDisplayWidth = imageWidth * fitZoom;
    const fittedDisplayHeight = imageHeight * fitZoom;
    const layout = computeWorkspaceStageSize(
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
    centeredImageKeyRef.current = imageKey;

    requestAnimationFrame(() => {
      const currentContainer = containerRef.current;
      if (!currentContainer || centeredImageKeyRef.current !== imageKey) return;
      currentContainer.scrollLeft = scrollLeft;
      currentContainer.scrollTop = scrollTop;
      prevStageLayoutRef.current = layout;
      didInitialScrollRef.current = true;
    });
  }, [imageData, imageKey, imageWidth, imageHeight, containerSize.width, containerSize.height]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !stageLayout || !imageData || !imageKey) return;
    if (centeredImageKeyRef.current !== imageKey) return;
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
    stageLayout,
    displayWidth,
    displayHeight,
    layoutContainerWidth,
    layoutContainerHeight,
    imageData,
    imageKey,
    zoom,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const prev = prevStageLayoutRef.current;
    if (!container || !stageLayout || !prev) return;
    if (centeredImageKeyRef.current !== imageKey) return;
    if (isSameWorkspaceStageLayout(prev, stageLayout)) return;
    if (zoomAnchorRef.current) return;

    const { scrollLeft, scrollTop } = computeScrollCompensation(prev, stageLayout);
    container.scrollLeft += scrollLeft;
    container.scrollTop += scrollTop;
    prevStageLayoutRef.current = stageLayout;
  }, [imageKey, stageLayout]);

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

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !imageData) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const currentStageLayout = stageLayoutRef.current;
      if (!currentStageLayout) return;

      const currentZoom = zoomRef.current;
      const newZoom = applyWheelZoomRatio(currentZoom, event.deltaY);
      if (Math.abs(newZoom - currentZoom) < 0.0001) return;

      const containerRect = container.getBoundingClientRect();
      const stageX = container.scrollLeft + (event.clientX - containerRect.left);
      const stageY = container.scrollTop + (event.clientY - containerRect.top);

      zoomAnchorRef.current = {
        logicalPoint: resolveCanvasPointAtStagePosition(
          stageX,
          stageY,
          currentStageLayout.canvasLeft,
          currentStageLayout.canvasTop,
          currentZoom,
        ),
        clientX: event.clientX,
        clientY: event.clientY,
      };
      setZoom(newZoom);
    };

    container.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => container.removeEventListener("wheel", handleWheel, { capture: true });
  }, [imageData]);

  useEffect(() => {
    if (!isPanning) return;

    const isPanButtonPressed = (buttons: number) => {
      if (effectivePanButton === 0) return (buttons & 1) !== 0;
      if (effectivePanButton === 1) return (buttons & 4) !== 0;
      if (effectivePanButton === 2) return (buttons & 2) !== 0;
      return false;
    };

    const handleDocumentMouseMove = (event: MouseEvent) => {
      if (!isPanningRef.current) return;
      if (!isPanButtonPressed(event.buttons)) {
        stopPanning();
        return;
      }
      applyPanMove(event.clientX, event.clientY);
    };

    const handleDocumentMouseUp = (event: MouseEvent) => {
      if (event.button === effectivePanButton) {
        stopPanning();
      }
    };

    document.addEventListener("mousemove", handleDocumentMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleDocumentMouseMove);
      document.removeEventListener("mouseup", handleDocumentMouseUp);
    };
  }, [isPanning, applyPanMove, stopPanning, effectivePanButton]);

  const handleContainerMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== effectivePanButton) return;
    event.preventDefault();
    startPanning(event.clientX, event.clientY);
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button === effectivePanButton) {
      event.preventDefault();
      startPanning(event.clientX, event.clientY);
      return;
    }
    if (!pickMode || event.button !== 0 || !imageData || !canvasRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    const { x, y } = canvasClientToImage(
      event.clientX,
      event.clientY,
      canvasRef.current,
      zoomRef.current,
    );
    if (x < 0 || y < 0 || x >= imageWidth || y >= imageHeight) return;
    onPickPixel?.(x, y);
  };

  const handleAuxClick = (event: React.MouseEvent) => {
    if (isMiddleMouseButton(event.button)) {
      event.preventDefault();
    }
  };

  // ---- 区域选框 ----

  /** client 坐标 → 图像像素坐标（基于滚动容器，与 overlay 平移无关）。 */
  const clientToImage = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      const layout = stageLayoutRef.current;
      if (!container || !layout) return { x: 0, y: 0 };
      const rect = container.getBoundingClientRect();
      const z = zoomRef.current || 1;
      return {
        x: Math.floor((clientX - rect.left + container.scrollLeft - layout.canvasLeft) / z),
        y: Math.floor((clientY - rect.top + container.scrollTop - layout.canvasTop) / z),
      };
    },
    [],
  );

  const drawSelectionOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const viewportW = container.clientWidth;
    const viewportH = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    const backingW = Math.max(1, Math.round(viewportW * dpr));
    const backingH = Math.max(1, Math.round(viewportH * dpr));

    if (canvas.width !== backingW) canvas.width = backingW;
    if (canvas.height !== backingH) canvas.height = backingH;
    canvas.style.width = `${viewportW}px`;
    canvas.style.height = `${viewportH}px`;
    canvas.style.left = `${container.scrollLeft}px`;
    canvas.style.top = `${container.scrollTop}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewportW, viewportH);

    const layout = stageLayoutRef.current;
    if (!selectionMode || !imageData || !layout) return;

    const activeRect = marquee ?? selection;
    if (!activeRect) return;

    drawSelectionRect(
      ctx,
      {
        offX: layout.canvasLeft - container.scrollLeft,
        offY: layout.canvasTop - container.scrollTop,
        zoom,
      },
      activeRect,
    );
  }, [selectionMode, imageData, marquee, selection, zoom, stageLayout]);

  const drawSelectionOverlayRef = useRef(drawSelectionOverlay);
  drawSelectionOverlayRef.current = drawSelectionOverlay;

  const redrawRafRef = useRef<number | null>(null);
  const scheduleSelectionRedraw = useCallback(() => {
    if (redrawRafRef.current !== null) return;
    redrawRafRef.current = requestAnimationFrame(() => {
      redrawRafRef.current = null;
      drawSelectionOverlayRef.current();
    });
  }, []);

  useLayoutEffect(() => {
    drawSelectionOverlay();
  }, [drawSelectionOverlay]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !selectionMode) return;
    const handleScroll = () => scheduleSelectionRedraw();
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (redrawRafRef.current !== null) {
        cancelAnimationFrame(redrawRafRef.current);
        redrawRafRef.current = null;
      }
    };
  }, [selectionMode, scheduleSelectionRedraw]);

  // 选框拖拽创建 / 角点缩放的全局指针跟踪。
  useEffect(() => {
    if (!selectionMode || !imageData) return;
    const imageSize = { width: imageData.width, height: imageData.height };

    const handleMouseMove = (event: MouseEvent) => {
      if (isMiddleMousePressed(event.buttons)) return;

      const handle = handleDragRef.current;
      if (handle) {
        const current = selectionRef.current;
        if (!current) return;
        const point = clientToImage(event.clientX, event.clientY);
        onSelectionChange?.(resizeRegionFromCornerHandle(current, handle, point, imageSize));
        return;
      }

      const selecting = selectRef.current;
      if (!selecting) return;
      const current = clientToImage(event.clientX, event.clientY);
      setMarquee(clampCropRect(normalizeRegionRect(selecting.start, current), imageSize));
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button !== 0) return;

      if (handleDragRef.current) {
        handleDragRef.current = null;
        return;
      }

      const selecting = selectRef.current;
      if (!selecting) return;
      selectRef.current = null;

      const current = clientToImage(event.clientX, event.clientY);
      onSelectionChange?.(
        clampCropRect(normalizeRegionRect(selecting.start, current), imageSize),
      );
      setMarquee(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [selectionMode, imageData, clientToImage, onSelectionChange]);

  const handleOverlayMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMiddleMouseButton(event.button)) {
      event.preventDefault();
      startPanning(event.clientX, event.clientY);
      return;
    }
    if (event.button === 2) {
      event.preventDefault();
      selectRef.current = null;
      handleDragRef.current = null;
      setMarquee(null);
      onSelectionChange?.(null);
      return;
    }
    if (event.button !== 0 || !imageData) return;

    event.preventDefault();

    if (selection) {
      const point = clientToImage(event.clientX, event.clientY);
      const handle = hitTestRegionCornerHandle(point, selection, zoomRef.current || 1);
      if (handle) {
        handleDragRef.current = handle;
        return;
      }
    }

    const start = clientToImage(event.clientX, event.clientY);
    selectRef.current = { start };
    setMarquee(
      clampCropRect(normalizeRegionRect(start, start), {
        width: imageData.width,
        height: imageData.height,
      }),
    );
  };

  const handleOverlayContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  return (
    <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${className}`}>
      {label && (
        <div className="flex items-center border-b border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
          <span>{label}</span>
          {imageData && (
            <span className="ml-2 text-zinc-600">
              {imageWidth} × {imageHeight}
            </span>
          )}
          {showZoomLabel && imageData && (
            <span className="ml-auto text-zinc-600">{formatZoomLabel(zoom)}</span>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className={`relative min-h-0 flex-1 overflow-auto overscroll-none bg-zinc-950${
          isPanning
            ? " cursor-grabbing"
            : pickMode || selectionMode
              ? " cursor-crosshair"
              : ""
        }`}
        onMouseDown={handleContainerMouseDown}
        onAuxClick={handleAuxClick}
        onMouseUp={stopPanning}
        onMouseLeave={stopPanning}
        onContextMenu={(event) => event.preventDefault()}
      >
        {!imageData ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">
            {emptyLabel}
          </div>
        ) : (
          stageLayout && (
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
                  imageRendering: pixelated ? "pixelated" : "auto",
                }}
              >
                {checkerboard && (
                  <canvas
                    ref={checkerboardCanvasRef}
                    className="pointer-events-none absolute left-0 top-0 block border border-transparent"
                    style={{ imageRendering: "pixelated" }}
                    aria-hidden
                  />
                )}
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  className={`relative block touch-none select-none border border-zinc-800${
                    checkerboard ? "" : " bg-zinc-900"
                  }${
                    isPanning
                      ? " cursor-grabbing"
                      : pickMode
                        ? " cursor-crosshair"
                        : " cursor-grab"
                  }`}
                  style={{ imageRendering: pixelated ? "pixelated" : "auto" }}
                  draggable={false}
                />
              </div>
            </div>
          )
        )}

        {selectionMode && imageData && stageLayout && (
          <canvas
            ref={overlayCanvasRef}
            className={`absolute z-10 block touch-none select-none${
              isPanning ? " cursor-grabbing" : " cursor-crosshair"
            }`}
            draggable={false}
            onMouseDown={handleOverlayMouseDown}
            onAuxClick={handleAuxClick}
            onContextMenu={handleOverlayContextMenu}
          />
        )}
      </div>
    </div>
  );
}
