import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  computeScrollPositionForZoomAtPoint,
  resolveCanvasPointAtStagePosition,
  type CanvasPoint,
} from "@/domain/viewport/ZoomAtPoint";
import {
  computeInitialScrollPosition,
  computeReferenceAwareStageSize,
  computeScrollCompensation,
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
import { renderTransparencyCheckerboard } from "@/infrastructure/canvas/CanvasBackgroundRenderer";
import { renderCanvasGrid } from "@/infrastructure/canvas/CanvasGridRenderer";
import { renderPixelGrid1x } from "@/infrastructure/canvas/PixelGridCanvasRenderer";
import { renderBrushStampPreview } from "@/infrastructure/canvas/BrushStampPreviewRenderer";
import {
  renderSelectionOverlay,
  renderTransformHandles,
} from "@/infrastructure/canvas/SelectionOverlayRenderer";
import { clampStampSize } from "@/domain/tool/ToolType";
import type { ReferenceLayer } from "@/domain/layer/Layer";
import { getReferenceStackIndex } from "@/domain/layer/LayerStack";
import { useAppStore, type ColorSlot, type DrawingButton } from "../stores/appStore";
import { FloatingColorPickerPanel } from "./color-picker/FloatingColorPickerPanel";
import { NavigatorPanel } from "./NavigatorPanel";
import { ReferenceCropModal } from "./ReferenceCropModal";
import { ReferenceLayerOverlay } from "./ReferenceLayerOverlay";

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
  const selection = useAppStore((s) => s.selection);
  const selectionPreviewRect = useAppStore((s) => s.selectionPreviewRect);
  const lassoPoints = useAppStore((s) => s.lassoPoints);
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
  const [marchPhase, setMarchPhase] = useState(0);
  const marchFrameRef = useRef<number | null>(null);

  const composite = useMemo(() => {
    if (!project) return null;
    return getCompositeGrid();
  }, [project, getCompositeGrid, selection]);

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

  const activeLayerId = project?.canvas.activeLayerId;

  const referenceLayers = useMemo(() => {
    if (!project) return [];
    return project.canvas.layers.filter(
      (l): l is ReferenceLayer => l.type === "reference",
    );
  }, [project]);

  const overlayZIndex = 100;

  const stageLayout = useMemo(() => {
    if (displayWidth <= 0 || displayHeight <= 0) {
      return null;
    }

    return computeReferenceAwareStageSize(
      layoutContainerWidth,
      layoutContainerHeight,
      displayWidth,
      displayHeight,
      referenceLayers,
      zoom,
    );
  }, [
    layoutContainerWidth,
    layoutContainerHeight,
    displayWidth,
    displayHeight,
    referenceLayers,
    zoom,
  ]);

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

    renderTransparencyCheckerboard(ctx, composite.width, composite.height, zoom);

    const offscreen = document.createElement("canvas");
    offscreen.width = composite.width;
    offscreen.height = composite.height;
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;
    renderPixelGrid1x(offCtx, composite);
    ctx.drawImage(offscreen, 0, 0, displayWidth, displayHeight);

    if (selection?.floating) {
      const { pixels, offset } = selection.floating;
      const floatCanvas = document.createElement("canvas");
      floatCanvas.width = pixels.width;
      floatCanvas.height = pixels.height;
      const floatCtx = floatCanvas.getContext("2d");
      if (floatCtx) {
        const imageData = floatCtx.createImageData(pixels.width, pixels.height);
        imageData.data.set(pixels.toRgba());
        floatCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(
          floatCanvas,
          offset.x * zoom,
          offset.y * zoom,
          pixels.width * zoom,
          pixels.height * zoom,
        );
      }
    }

    if (gridCanvas && project.grid.visible) {
      gridCanvas.width = displayWidth;
      gridCanvas.height = displayHeight;
      gridCanvas.style.width = `${displayWidth}px`;
      gridCanvas.style.height = `${displayHeight}px`;
      const gridCtx = gridCanvas.getContext("2d");
      if (gridCtx) {
        const { primary, secondary } = project.grid;
        renderCanvasGrid(
          gridCtx,
          composite.width,
          composite.height,
          zoom,
          primary,
          secondary,
        );
      }
    } else if (gridCanvas) {
      const gridCtx = gridCanvas.getContext("2d");
      gridCtx?.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    }
  }, [project, composite, displayWidth, displayHeight, zoom, selection]);

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

  const renderOverlay = useCallback(() => {
    const previewCanvas = previewRef.current;
    if (!previewCanvas || !composite) return;

    previewCanvas.width = displayWidth;
    previewCanvas.height = displayHeight;
    previewCanvas.style.width = `${displayWidth}px`;
    previewCanvas.style.height = `${displayHeight}px`;

    const ctx = previewCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    renderSelectionOverlay(ctx, {
      selection,
      previewRect: selectionPreviewRect,
      lassoPoints,
      phase: marchPhase,
      zoom,
      canvasWidth: composite.width,
      canvasHeight: composite.height,
    });

    if (activeTool === "transform" && selection) {
      renderTransformHandles(ctx, { selection, zoom, phase: marchPhase });
    }

    if (brushPreview && hoverPoint && !isPanning) {
      renderBrushStampPreview(
        ctx,
        hoverPoint,
        brushPreview.size,
        brushPreview.shape,
        zoom,
        { width: composite.width, height: composite.height },
      );
    }
  }, [
    activeTool,
    brushPreview,
    composite,
    displayWidth,
    displayHeight,
    hoverPoint,
    isPanning,
    lassoPoints,
    marchPhase,
    selection,
    selectionPreviewRect,
    zoom,
  ]);

  useEffect(() => {
    const tick = () => {
      setMarchPhase((p) => (p + 1) % 16);
      marchFrameRef.current = requestAnimationFrame(tick);
    };
    marchFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (marchFrameRef.current !== null) {
        cancelAnimationFrame(marchFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useLayoutEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  useLayoutEffect(() => {
    renderOverlay();
  }, [renderOverlay]);

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

  const updateHoverFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !composite) {
        setHoverPoint(null);
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = Math.floor((clientX - rect.left) / zoom);
      const y = Math.floor((clientY - rect.top) / zoom);
      if (x < 0 || y < 0 || x >= composite.width || y >= composite.height) {
        setHoverPoint(null);
        return;
      }
      setHoverPoint({ x, y });
    },
    [composite, zoom],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || (activeTool !== "brush" && activeTool !== "eraser")) return;

    const handleMove = (e: MouseEvent) => {
      if (isPanningRef.current) return;
      updateHoverFromClient(e.clientX, e.clientY);
    };

    container.addEventListener("mousemove", handleMove);
    return () => container.removeEventListener("mousemove", handleMove);
  }, [activeTool, updateHoverFromClient]);

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
    const modifiers = { shiftKey: e.shiftKey, altKey: e.altKey };
    if (e.altKey) {
      pickColorAt(point, colorSlotFromDrawingButton(button));
      return;
    }
    pointerDown(point, button, modifiers);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) return;
    const point = toPixel(e);
    updateHoverFromClient(e.clientX, e.clientY);
    const button = drawingButton;
    const modifiers = { shiftKey: e.shiftKey, altKey: e.altKey };
    if (activeTool === "select" || activeTool === "transform") {
      if (button !== null && isDrawingButtonPressed(e.buttons, button)) {
        pointerMove(point, button, modifiers);
      } else if (e.buttons !== 0) {
        pointerMove(point, "primary", modifiers);
      }
      return;
    }
    if (!button || !isDrawingButtonPressed(e.buttons, button)) return;
    pointerMove(point, button, modifiers);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) return;
    const button = buttonFromMouseButton(e.button);
    if (!button) return;
    pointerUp(toPixel(e), button, { shiftKey: e.shiftKey, altKey: e.altKey });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setHoverPoint(null);
    if (!drawingButton && activeTool !== "select" && activeTool !== "transform") return;
    pointerUp(toPixel(e), drawingButton ?? "primary", {
      shiftKey: e.shiftKey,
      altKey: e.altKey,
    });
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
        onMouseLeave={() => {
          setHoverPoint(null);
          stopPanning();
        }}
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
                zIndex: 0,
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
            </div>
            {project.canvas.layers.map((layer) => {
              if (layer.type !== "reference") return null;
              return (
                <ReferenceLayerOverlay
                  key={layer.id}
                  layer={layer}
                  stackIndex={getReferenceStackIndex(project.canvas.layers, layer.id)}
                  canvasLeft={stageLayout.canvasLeft}
                  canvasTop={stageLayout.canvasTop}
                  zoom={zoom}
                  isActive={layer.id === activeLayerId}
                />
              );
            })}
            <div
              className="pointer-events-none absolute"
              style={{
                left: stageLayout.canvasLeft,
                top: stageLayout.canvasTop,
                width: displayWidth,
                height: displayHeight,
                zIndex: overlayZIndex,
                imageRendering: "pixelated",
              }}
            >
              <canvas
                ref={previewRef}
                className="block"
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
      <ReferenceCropModal />
    </div>
  );
}
