import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ViewfinderCircleIcon } from "@heroicons/react/24/outline";
import {
  computeVisibleRect,
  mapDisplayRectToPreview,
  mapVisibleRectToPreview,
  applyNavigatorPreviewButtonZoomRatio,
  applyNavigatorPreviewWheelZoomRatio,
  resolvePixelGridDisplayRect,
} from "@/domain/viewport/NavigatorViewport";
import {
  computePanScrollDelta,
  isMiddleMouseButton,
  isMiddleMousePressed,
} from "@/domain/viewport/ViewportPan";
import {
  computeNavigatorResizeFromCorner,
  NAVIGATOR_RESIZE_CURSORS,
  NAVIGATOR_RESIZE_HANDLE_SIZE,
  resolveNavigatorResizeConstraints,
  type NavigatorResizeCorner,
  type NavigatorResizeStart,
} from "@/domain/viewport/NavigatorPanelResize";
import { computeFloatingPanelZIndex } from "@/domain/viewport/FloatingPanelStack";
import {
  computeForeshortenedSpan,
  resolveOrthographicAngle,
} from "@/domain/viewport/OrthographicView";
import { renderTransparencyCheckerboard } from "@/infrastructure/canvas/CanvasBackgroundRenderer";
import { renderPixelGrid1x } from "@/infrastructure/canvas/PixelGridCanvasRenderer";
import { compositeBoardPixelGrid } from "@/domain/pixelCanvas/BoardExport";
import { getActiveCanvas } from "@/domain/project/Project";
import { useAppStore } from "../stores/appStore";

const NAVIGATOR_PROJECT_RENDER_DEBOUNCE_MS = 150;
const HEADER_HEIGHT = 28;
const RESIZE_HANDLE_SIZE = NAVIGATOR_RESIZE_HANDLE_SIZE;

const RESIZE_CORNERS: NavigatorResizeCorner[] = ["nw", "ne", "sw", "se"];

const RESIZE_HANDLE_POSITION: Record<NavigatorResizeCorner, string> = {
  nw: "left-0 top-0",
  ne: "right-0 top-0",
  sw: "bottom-0 left-0",
  se: "bottom-0 right-0",
};

function toPreviewLayout(navigator: {
  size: { width: number; height: number };
  previewScale: number;
  previewPan: { x: number; y: number };
}) {
  return {
    previewWidth: navigator.size.width,
    previewHeight: navigator.size.height,
    previewScale: navigator.previewScale,
    previewPanX: navigator.previewPan.x,
    previewPanY: navigator.previewPan.y,
  };
}

export function NavigatorPanel() {
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const pixelCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef<NavigatorResizeStart & { corner: NavigatorResizeCorner } | null>(null);
  const lastPanRef = useRef({ x: 0, y: 0 });
  const previewScaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const isNavigatingRef = useRef(false);
  const isPanningRef = useRef(false);

  const project = useAppStore((s) => s.project);
  const drawingStrokeSession = useAppStore((s) => s.drawingStrokeSession);
  const zoom = useAppStore((s) => s.zoom);
  const appSettings = useAppStore((s) => s.appSettings);
  const navigator = useAppStore((s) => s.navigator);
  const viewportSnapshot = useAppStore((s) => s.viewportSnapshot);
  const setNavigatorPositionWithAnchor = useAppStore(
    (s) => s.setNavigatorPositionWithAnchor,
  );
  const setNavigatorBounds = useAppStore((s) => s.setNavigatorBounds);
  const finalizeNavigatorDrag = useAppStore((s) => s.finalizeNavigatorDrag);
  const viewportContainer = useAppStore((s) => s.viewportContainer);
  const zoomNavigatorPreviewAtPoint = useAppStore(
    (s) => s.zoomNavigatorPreviewAtPoint,
  );
  const panNavigatorPreview = useAppStore((s) => s.panNavigatorPreview);
  const navigateToPreviewPoint = useAppStore((s) => s.navigateToPreviewPoint);
  const syncNavigatorToViewport = useAppStore((s) => s.syncNavigatorToViewport);
  const setNavigatorFollowViewport = useAppStore(
    (s) => s.setNavigatorFollowViewport,
  );
  const floatingPanelStack = useAppStore((s) => s.floatingPanelStack);
  const bringFloatingPanelToFront = useAppStore((s) => s.bringFloatingPanelToFront);

  const [renderTick, setRenderTick] = useState(0);
  const [isPanning, setIsPanning] = useState(false);

  previewScaleRef.current = navigator.previewScale;

  const previewLayout = useMemo(
    () => toPreviewLayout(navigator),
    [
      navigator.size.width,
      navigator.size.height,
      navigator.previewScale,
      navigator.previewPan.x,
      navigator.previewPan.y,
    ],
  );

  const getPreviewPoint = useCallback((clientX: number, clientY: number) => {
    const preview = previewRef.current;
    if (!preview) return null;
    const rect = preview.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const renderPreview = useCallback(() => {
    const backgroundCanvas = backgroundCanvasRef.current;
    const pixelCanvas = pixelCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (
      !backgroundCanvas ||
      !pixelCanvas ||
      !overlayCanvas ||
      !project ||
      !viewportSnapshot
    ) {
      return;
    }

    const composite = compositeBoardPixelGrid(project);

    const pixelGridRect = resolvePixelGridDisplayRect(viewportSnapshot);
    const contentRect = mapDisplayRectToPreview(
      pixelGridRect,
      viewportSnapshot,
      previewLayout,
    );
    const effectiveZoom = contentRect.width / composite.width;

    backgroundCanvas.width = Math.max(1, Math.round(contentRect.width));
    backgroundCanvas.height = Math.max(1, Math.round(contentRect.height));
    backgroundCanvas.style.position = "absolute";
    backgroundCanvas.style.left = `${contentRect.x}px`;
    backgroundCanvas.style.top = `${contentRect.y}px`;
    backgroundCanvas.style.width = `${contentRect.width}px`;
    backgroundCanvas.style.height = `${contentRect.height}px`;
    backgroundCanvas.style.imageRendering = "pixelated";

    const backgroundCtx = backgroundCanvas.getContext("2d");
    if (!backgroundCtx) return;
    const orthographicAngle = resolveOrthographicAngle(project.orthographicView);
    const checkerboardTileHeight = computeForeshortenedSpan(
      appSettings.checkerboardTileSize,
      orthographicAngle,
    );
    renderTransparencyCheckerboard(
      backgroundCtx,
      composite.width,
      composite.height,
      effectiveZoom,
      {
        tileSize: appSettings.checkerboardTileSize,
        tileHeight: checkerboardTileHeight,
        lightColor: appSettings.checkerboardLightHex,
        darkColor: appSettings.checkerboardDarkHex,
      },
    );

    pixelCanvas.width = composite.width;
    pixelCanvas.height = composite.height;
    pixelCanvas.style.position = "absolute";
    pixelCanvas.style.left = `${contentRect.x}px`;
    pixelCanvas.style.top = `${contentRect.y}px`;
    pixelCanvas.style.width = `${contentRect.width}px`;
    pixelCanvas.style.height = `${contentRect.height}px`;
    pixelCanvas.style.imageRendering = "pixelated";

    const pixelCtx = pixelCanvas.getContext("2d");
    if (!pixelCtx) return;
    renderPixelGrid1x(pixelCtx, composite);

    overlayCanvas.width = previewLayout.previewWidth;
    overlayCanvas.height = previewLayout.previewHeight;
    const overlayCtx = overlayCanvas.getContext("2d");
    if (!overlayCtx) return;
    overlayCtx.clearRect(0, 0, previewLayout.previewWidth, previewLayout.previewHeight);

    const visibleRect = computeVisibleRect(viewportSnapshot);
    const previewRect = mapVisibleRectToPreview(
      visibleRect,
      viewportSnapshot,
      previewLayout,
    );

    if (previewRect.width > 0 && previewRect.height > 0) {
      overlayCtx.strokeStyle = "rgba(96, 165, 250, 0.9)";
      overlayCtx.lineWidth = 1;
      overlayCtx.strokeRect(
        previewRect.x + 0.5,
        previewRect.y + 0.5,
        previewRect.width - 1,
        previewRect.height - 1,
      );
    }

    if (project.board.canvases.length > 0) {
      const activeCanvas = getActiveCanvas(project);
      let minX = Infinity;
      let minY = Infinity;
      for (const canvas of project.board.canvases) {
        minX = Math.min(minX, canvas.boardPosition.x);
        minY = Math.min(minY, canvas.boardPosition.y);
      }
      const activeLeft = activeCanvas.boardPosition.x - minX;
      const activeTop = activeCanvas.boardPosition.y - minY;
      const scale = contentRect.width / composite.width;
      overlayCtx.strokeStyle = "rgba(250, 204, 21, 0.95)";
      overlayCtx.lineWidth = 1;
      overlayCtx.strokeRect(
        contentRect.x + activeLeft * scale + 0.5,
        contentRect.y + activeTop * scale + 0.5,
        activeCanvas.width * scale - 1,
        activeCanvas.height * scale - 1,
      );
    }
  }, [
    project,
    previewLayout,
    viewportSnapshot,
    appSettings.checkerboardTileSize,
    appSettings.checkerboardLightHex,
    appSettings.checkerboardDarkHex,
  ]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview, zoom, renderTick]);

  useEffect(() => {
    if (!navigator.visible || drawingStrokeSession) return;
    const timer = window.setTimeout(
      () => setRenderTick((tick) => tick + 1),
      NAVIGATOR_PROJECT_RENDER_DEBOUNCE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [project, navigator.visible, drawingStrokeSession]);

  useEffect(() => {
    if (!navigator.visible || drawingStrokeSession) return;
    const id = requestAnimationFrame(() => setRenderTick((t) => t + 1));
    return () => cancelAnimationFrame(id);
  }, [navigator.visible, viewportSnapshot, drawingStrokeSession]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setNavigatorPositionWithAnchor(
          dragStartRef.current.posX + dx,
          dragStartRef.current.posY + dy,
        );
        return;
      }

      if (resizeStartRef.current) {
        isResizingRef.current = true;
        const start = resizeStartRef.current;
        const bounds = computeNavigatorResizeFromCorner(
          start.corner,
          start,
          e.clientX,
          e.clientY,
          resolveNavigatorResizeConstraints(viewportContainer),
        );
        setNavigatorBounds(bounds.x, bounds.y, bounds.width, bounds.height);
        return;
      }

      if (isPanningRef.current) {
        if (!isMiddleMousePressed(e.buttons)) {
          isPanningRef.current = false;
          setIsPanning(false);
          return;
        }
        const { deltaX, deltaY } = computePanScrollDelta(
          lastPanRef.current,
          { x: e.clientX, y: e.clientY },
        );
        panNavigatorPreview(deltaX, deltaY);
        lastPanRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (isNavigatingRef.current) {
        const point = getPreviewPoint(e.clientX, e.clientY);
        if (!point) return;
        navigateToPreviewPoint(point.x, point.y);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const wasDragging = isDraggingRef.current;
      const wasResizing = isResizingRef.current;
      isDraggingRef.current = false;
      resizeStartRef.current = null;
      isResizingRef.current = false;
      isNavigatingRef.current = false;
      if (wasDragging || wasResizing) {
        finalizeNavigatorDrag();
      }
      if (isMiddleMouseButton(e.button)) {
        isPanningRef.current = false;
        setIsPanning(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    setNavigatorPositionWithAnchor,
    setNavigatorBounds,
    finalizeNavigatorDrag,
    viewportContainer,
    panNavigatorPreview,
    navigateToPreviewPoint,
    getPreviewPoint,
  ]);

  useEffect(() => {
    if (navigator.visible) bringFloatingPanelToFront("navigator");
  }, [navigator.visible, bringFloatingPanelToFront]);

  if (!navigator.visible || !project) return null;

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: navigator.position.x,
      posY: navigator.position.y,
    };
  };

  const handleResizeMouseDown = (
    corner: NavigatorResizeCorner,
    e: React.MouseEvent,
  ) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    resizeStartRef.current = {
      corner,
      clientX: e.clientX,
      clientY: e.clientY,
      bounds: {
        x: navigator.position.x,
        y: navigator.position.y,
        width: navigator.size.width,
        height: navigator.size.height,
      },
    };
  };

  const startPreviewPanning = (clientX: number, clientY: number) => {
    isPanningRef.current = true;
    setIsPanning(true);
    lastPanRef.current = { x: clientX, y: clientY };
  };

  const handlePreviewMouseDown = (e: React.MouseEvent) => {
    if (isMiddleMouseButton(e.button)) {
      e.preventDefault();
      e.stopPropagation();
      startPreviewPanning(e.clientX, e.clientY);
      return;
    }
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    isNavigatingRef.current = true;
    const point = getPreviewPoint(e.clientX, e.clientY);
    if (!point) return;
    navigateToPreviewPoint(point.x, point.y);
  };

  const handlePreviewWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!viewportSnapshot) return;

    const point = getPreviewPoint(e.clientX, e.clientY);
    if (!point) return;

    const currentScale = previewScaleRef.current;
    const nextScale = applyNavigatorPreviewWheelZoomRatio(currentScale, e.deltaY);
    zoomNavigatorPreviewAtPoint(point.x, point.y, nextScale);
  };

  const zoomPreviewAtCenter = (nextScale: number) => {
    zoomNavigatorPreviewAtPoint(
      navigator.size.width / 2,
      navigator.size.height / 2,
      nextScale,
    );
  };

  const handleZoomOut = () => {
    zoomPreviewAtCenter(
      applyNavigatorPreviewButtonZoomRatio(navigator.previewScale, "out"),
    );
  };

  const handleZoomIn = () => {
    zoomPreviewAtCenter(
      applyNavigatorPreviewButtonZoomRatio(navigator.previewScale, "in"),
    );
  };

  const handleAuxClick = (e: React.MouseEvent) => {
    if (isMiddleMouseButton(e.button)) {
      e.preventDefault();
    }
  };

  const panelHeight = navigator.size.height + HEADER_HEIGHT;

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto absolute flex flex-col overflow-hidden rounded border-2 border-zinc-600 bg-zinc-900 shadow-xl"
      style={{
        left: navigator.position.x,
        top: navigator.position.y,
        width: navigator.size.width,
        height: panelHeight,
        zIndex: computeFloatingPanelZIndex(floatingPanelStack, "navigator"),
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        bringFloatingPanelToFront("navigator");
      }}
    >
      <div
        className="flex cursor-move select-none items-center justify-between gap-1 border-b-2 border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-300"
        style={{ height: HEADER_HEIGHT }}
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0">导航</span>
          <button
            type="button"
            title="定位到当前视口"
            disabled={!viewportSnapshot}
            onClick={() => syncNavigatorToViewport()}
            className="shrink-0 rounded p-0.5 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <ViewfinderCircleIcon className="h-3.5 w-3.5" />
          </button>
          <label
            className={`flex shrink-0 cursor-pointer items-center gap-0.5 ${
              navigator.followViewport ? "text-sky-400" : "text-zinc-400"
            }`}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={navigator.followViewport}
              onChange={(e) => setNavigatorFollowViewport(e.target.checked)}
              className="h-3 w-3 accent-sky-500"
            />
            <span>锚定</span>
          </label>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="rounded px-1 hover:bg-zinc-700"
            onMouseDown={(e) => e.stopPropagation()}
          >
            −
          </button>
          <span className="w-8 text-center text-zinc-500">
            {Math.round(navigator.previewScale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="rounded px-1 hover:bg-zinc-700"
            onMouseDown={(e) => e.stopPropagation()}
          >
            +
          </button>
        </div>
      </div>

      <div
        ref={previewRef}
        className={`relative overflow-hidden bg-zinc-800${
          isPanning ? " cursor-grabbing" : " cursor-crosshair"
        }`}
        style={{ height: navigator.size.height }}
        onMouseDown={handlePreviewMouseDown}
        onWheel={handlePreviewWheel}
        onAuxClick={handleAuxClick}
        onMouseLeave={() => {
          isNavigatingRef.current = false;
        }}
      >
        <canvas
          ref={backgroundCanvasRef}
          className="pointer-events-none absolute block"
        />
        <canvas
          ref={pixelCanvasRef}
          className="pointer-events-none absolute block"
        />
        <canvas
          ref={overlayCanvasRef}
          className="pointer-events-none absolute left-0 top-0 block"
        />
      </div>

      {RESIZE_CORNERS.map((corner) => (
        <div
          key={corner}
          className={`absolute z-10 ${RESIZE_HANDLE_POSITION[corner]} ${NAVIGATOR_RESIZE_CURSORS[corner]}`}
          style={{
            width: RESIZE_HANDLE_SIZE,
            height: RESIZE_HANDLE_SIZE,
          }}
          onMouseDown={(e) => handleResizeMouseDown(corner, e)}
        />
      ))}
    </div>
  );
}
