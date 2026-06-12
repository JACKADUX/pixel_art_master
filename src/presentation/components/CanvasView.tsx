import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  computeScrollPositionForZoomAtPoint,
  resolveCanvasPointAtStagePosition,
  type CanvasPoint,
} from "@/domain/viewport/ZoomAtPoint";
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
  computePanScrollDelta,
  isMiddleMouseButton,
  isMiddleMousePressed,
} from "@/domain/viewport/ViewportPan";
import { renderPixelGrid1x } from "@/infrastructure/canvas/PixelGridCanvasRenderer";
import { renderBrushStampPreview } from "@/infrastructure/canvas/BrushStampPreviewRenderer";
import { clampStampSize } from "@/domain/tool/ToolType";
import { useAppStore, type ColorSlot, type DrawingButton } from "../stores/appStore";
import { FloatingColorPickerPanel } from "./color-picker/FloatingColorPickerPanel";
import { NavigatorPanel } from "./NavigatorPanel";

interface ZoomAnchor {
  logicalPoint: CanvasPoint;
  clientX: number;
  clientY: number;
}

function buttonFromMouseButton(button: number): DrawingButton | null {
  if (button === 0) return "primary";
  if (button === 2) return "secondary";
  return null;
}

function colorSlotFromDrawingButton(button: DrawingButton): ColorSlot {
  return button === "primary" ? "foreground" : "background";
}

function isDrawingButtonPressed(buttons: number, button: DrawingButton): boolean {
  return button === "primary" ? (buttons & 1) !== 0 : (buttons & 2) !== 0;
}

export function CanvasView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanningRef = useRef(false);
  const lastPanRef = useRef({ x: 0, y: 0 });
  const zoomAnchorRef = useRef<ZoomAnchor | null>(null);
  const centeredProjectIdRef = useRef<string | null>(null);
  const prevStageLayoutRef = useRef<WorkspaceStageLayout | null>(null);
  const stageLayoutRef = useRef<WorkspaceStageLayout | null>(null);

  const project = useAppStore((s) => s.project);
  const zoom = useAppStore((s) => s.zoom);
  const zoomRef = useRef(zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const setToolSettings = useAppStore((s) => s.setToolSettings);
  const activeTool = useAppStore((s) => s.activeTool);
  const toolSettings = useAppStore((s) => s.toolSettings);
  const pointerDown = useAppStore((s) => s.pointerDown);
  const pointerMove = useAppStore((s) => s.pointerMove);
  const pointerUp = useAppStore((s) => s.pointerUp);
  const pickColorAt = useAppStore((s) => s.pickColorAt);
  const drawingButton = useAppStore((s) => s.drawingButton);
  const getCompositeGrid = useAppStore((s) => s.getCompositeGrid);
  const isCapturing = useAppStore((s) => s.isCapturing);
  const setViewportContainer = useAppStore((s) => s.setViewportContainer);
  const syncViewportSnapshot = useAppStore((s) => s.syncViewportSnapshot);

  const [isPanning, setIsPanning] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hoverPoint, setHoverPoint] = useState<CanvasPoint | null>(null);

  const composite = useMemo(() => {
    if (!project) return null;
    return getCompositeGrid();
  }, [project, getCompositeGrid]);

  const displayWidth = composite ? composite.width * zoom : 0;
  const displayHeight = composite ? composite.height * zoom : 0;

  const layoutContainerWidth =
    containerSize.width > 0
      ? containerSize.width
      : WORKSPACE_CONTAINER_FALLBACK_WIDTH;
  const layoutContainerHeight =
    containerSize.height > 0
      ? containerSize.height
      : WORKSPACE_CONTAINER_FALLBACK_HEIGHT;

  const stageLayout = useMemo(() => {
    if (displayWidth <= 0 || displayHeight <= 0) {
      return null;
    }

    return computeWorkspaceStageSize(
      layoutContainerWidth,
      layoutContainerHeight,
      displayWidth,
      displayHeight,
    );
  }, [layoutContainerWidth, layoutContainerHeight, displayWidth, displayHeight]);

  stageLayoutRef.current = stageLayout;

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const gridCanvas = gridRef.current;
    if (!canvas || !project || !composite) return;

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const offscreen = document.createElement("canvas");
    offscreen.width = composite.width;
    offscreen.height = composite.height;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;
    renderPixelGrid1x(offCtx, composite);
    ctx.drawImage(offscreen, 0, 0, displayWidth, displayHeight);

    if (gridCanvas && project.grid.visible) {
      gridCanvas.width = displayWidth;
      gridCanvas.height = displayHeight;
      gridCanvas.style.width = `${displayWidth}px`;
      gridCanvas.style.height = `${displayHeight}px`;
      const gridCtx = gridCanvas.getContext("2d");
      if (gridCtx) {
        gridCtx.clearRect(0, 0, displayWidth, displayHeight);
        const { primary, secondary } = project.grid;

        gridCtx.strokeStyle = "rgba(255,255,255,0.15)";
        gridCtx.lineWidth = 1;
        for (let x = 0; x <= composite.width; x += secondary) {
          if (x % primary !== 0) {
            gridCtx.beginPath();
            gridCtx.moveTo(x * zoom + 0.5, 0);
            gridCtx.lineTo(x * zoom + 0.5, displayHeight);
            gridCtx.stroke();
          }
        }
        for (let y = 0; y <= composite.height; y += secondary) {
          if (y % primary !== 0) {
            gridCtx.beginPath();
            gridCtx.moveTo(0, y * zoom + 0.5);
            gridCtx.lineTo(displayWidth, y * zoom + 0.5);
            gridCtx.stroke();
          }
        }

        gridCtx.strokeStyle = "rgba(0,0,0,0.4)";
        for (let x = 0; x <= composite.width; x += primary) {
          gridCtx.beginPath();
          gridCtx.moveTo(x * zoom + 0.5, 0);
          gridCtx.lineTo(x * zoom + 0.5, displayHeight);
          gridCtx.stroke();
        }
        for (let y = 0; y <= composite.height; y += primary) {
          gridCtx.beginPath();
          gridCtx.moveTo(0, y * zoom + 0.5);
          gridCtx.lineTo(displayWidth, y * zoom + 0.5);
          gridCtx.stroke();
        }
      }
    } else if (gridCanvas) {
      const gridCtx = gridCanvas.getContext("2d");
      gridCtx?.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    }
  }, [project, composite, displayWidth, displayHeight, zoom]);

  const brushPreview = useMemo(() => {
    if (activeTool !== "brush" && activeTool !== "eraser") return null;
    if (activeTool === "brush") {
      return {
        size: toolSettings.brushSize,
        shape: toolSettings.brushShape,
      };
    }
    return {
      size: toolSettings.eraserSize,
      shape: toolSettings.eraserShape,
    };
  }, [activeTool, toolSettings]);

  const renderBrushPreview = useCallback(() => {
    const previewCanvas = previewRef.current;
    if (!previewCanvas || !composite) return;

    previewCanvas.width = displayWidth;
    previewCanvas.height = displayHeight;
    previewCanvas.style.width = `${displayWidth}px`;
    previewCanvas.style.height = `${displayHeight}px`;

    const ctx = previewCanvas.getContext("2d");
    if (!ctx) return;

    if (!brushPreview || !hoverPoint || isPanning) {
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      return;
    }

    renderBrushStampPreview(
      ctx,
      hoverPoint,
      brushPreview.size,
      brushPreview.shape,
      zoom,
      { width: composite.width, height: composite.height },
    );
  }, [brushPreview, composite, displayWidth, displayHeight, hoverPoint, isPanning, zoom]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useLayoutEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  useLayoutEffect(() => {
    renderBrushPreview();
  }, [renderBrushPreview]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setViewportContainer(container);
    setContainerSize({
      width: container.clientWidth,
      height: container.clientHeight,
    });

    const handleScroll = () => {
      syncViewportSnapshot(canvasRef.current);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
      syncViewportSnapshot(canvasRef.current);
    });

    container.addEventListener("scroll", handleScroll, { passive: true });
    resizeObserver.observe(container);
    syncViewportSnapshot(canvasRef.current);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      setViewportContainer(null);
    };
  }, [project, setViewportContainer, syncViewportSnapshot]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !project || !stageLayout) return;
    if (centeredProjectIdRef.current === project.id) return;

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
    centeredProjectIdRef.current = project.id;
    prevStageLayoutRef.current = stageLayout;
    syncViewportSnapshot(canvasRef.current);
  }, [
    project?.id,
    stageLayout,
    displayWidth,
    displayHeight,
    layoutContainerWidth,
    layoutContainerHeight,
    syncViewportSnapshot,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const prev = prevStageLayoutRef.current;
    if (!container || !project || !stageLayout || !prev) return;
    if (centeredProjectIdRef.current !== project.id) return;
    if (isSameWorkspaceStageLayout(prev, stageLayout)) return;
    if (zoomAnchorRef.current) return;

    const { scrollLeft, scrollTop } = computeScrollCompensation(prev, stageLayout);
    container.scrollLeft += scrollLeft;
    container.scrollTop += scrollTop;
    prevStageLayoutRef.current = stageLayout;
    syncViewportSnapshot(canvasRef.current);
  }, [project?.id, stageLayout, syncViewportSnapshot]);

  useLayoutEffect(() => {
    syncViewportSnapshot(canvasRef.current);
  }, [zoom, renderCanvas, stageLayout, syncViewportSnapshot]);

  useLayoutEffect(() => {
    const anchor = zoomAnchorRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!anchor || !container || !canvas || !stageLayout) return;

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
    syncViewportSnapshot(canvas);
  }, [zoom, stageLayout, syncViewportSnapshot]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !project) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey) {
        const { activeTool: tool, toolSettings: settings } = useAppStore.getState();
        if (tool === "brush" || tool === "eraser") {
          const delta = e.deltaY > 0 ? -1 : 1;
          const sizeKey = tool === "brush" ? "brushSize" : "eraserSize";
          const currentSize = settings[sizeKey];
          const newSize = clampStampSize(currentSize + delta);
          if (newSize !== currentSize) {
            setToolSettings({ [sizeKey]: newSize });
          }
          return;
        }
      }

      const currentStageLayout = stageLayoutRef.current;
      if (!currentStageLayout) return;

      const currentZoom = zoomRef.current;
      const delta = e.deltaY > 0 ? -1 : 1;
      const newZoom = Math.max(1, Math.min(32, currentZoom + delta));
      if (newZoom === currentZoom) return;

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

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [project, setZoom, setToolSettings]);

  const startPanning = useCallback((clientX: number, clientY: number) => {
    isPanningRef.current = true;
    setIsPanning(true);
    setHoverPoint(null);
    lastPanRef.current = { x: clientX, y: clientY };
  }, []);

  const applyPanMove = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const { deltaX, deltaY } = computePanScrollDelta(
        lastPanRef.current,
        { x: clientX, y: clientY },
      );
      container.scrollLeft += deltaX;
      container.scrollTop += deltaY;
      lastPanRef.current = { x: clientX, y: clientY };
      syncViewportSnapshot(canvasRef.current);
    },
    [syncViewportSnapshot],
  );

  const stopPanning = useCallback(() => {
    isPanningRef.current = false;
    setIsPanning(false);
  }, []);

  const toPixel = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / zoom);
      const y = Math.floor((e.clientY - rect.top) / zoom);
      return { x, y };
    },
    [zoom],
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMiddleMouseButton(e.button)) {
      e.preventDefault();
      startPanning(e.clientX, e.clientY);
      return;
    }
    const button = buttonFromMouseButton(e.button);
    if (!button) return;
    e.preventDefault();
    const point = toPixel(e);
    if (e.altKey) {
      pickColorAt(point, colorSlotFromDrawingButton(button));
      return;
    }
    pointerDown(point, button);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) return;
    const point = toPixel(e);
    setHoverPoint(point);
    const button = drawingButton;
    if (!button || !isDrawingButtonPressed(e.buttons, button)) return;
    pointerMove(point, button);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) return;
    const button = buttonFromMouseButton(e.button);
    if (!button) return;
    pointerUp(toPixel(e), button);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setHoverPoint(null);
    if (!drawingButton) return;
    pointerUp(toPixel(e), drawingButton);
  };

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

  const handleAuxClick = (e: React.MouseEvent) => {
    if (isMiddleMouseButton(e.button)) {
      e.preventDefault();
    }
  };

  if (!project) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-center text-zinc-500">
        请新建或打开项目
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
      <div
        ref={containerRef}
        className={`relative min-h-0 min-w-0 flex-1 overflow-auto bg-zinc-800${
          isPanning ? " cursor-grabbing" : ""
        }`}
        onMouseDown={handleContainerMouseDown}
        onAuxClick={handleAuxClick}
        onMouseUp={stopPanning}
        onMouseLeave={stopPanning}
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
                ref={canvasRef}
                className={`block${isPanning ? " cursor-grabbing" : " cursor-crosshair"}`}
                style={{ imageRendering: "pixelated" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onAuxClick={handleAuxClick}
                onContextMenu={(e) => e.preventDefault()}
                onMouseLeave={handleMouseLeave}
              />
              <canvas
                ref={gridRef}
                className="pointer-events-none absolute left-0 top-0"
                style={{ imageRendering: "pixelated" }}
              />
              <canvas
                ref={previewRef}
                className="pointer-events-none absolute left-0 top-0"
                style={{ imageRendering: "pixelated" }}
              />
            </div>
          </div>
        )}
        <div className="sr-only">当前工具: {activeTool}</div>
      </div>
      {isCapturing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-900/70">
          <p className="text-sm text-zinc-300">正在截图...</p>
        </div>
      )}
      <NavigatorPanel />
      <FloatingColorPickerPanel />
    </div>
  );
}
