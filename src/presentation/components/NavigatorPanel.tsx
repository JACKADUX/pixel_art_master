import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computePreviewTransform,
  computeVisibleRect,
  mapVisibleRectToPreview,
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
import { renderPixelGrid1x } from "@/infrastructure/canvas/PixelGridCanvasRenderer";
import { useAppStore } from "../stores/appStore";

const HEADER_HEIGHT = 28;
const PREVIEW_ZOOM_STEP = 0.1;
const HEADER_ZOOM_STEP = 0.25;
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
  const pixelCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const resizeStartRef = useRef<NavigatorResizeStart & { corner: NavigatorResizeCorner } | null>(null);
  const lastPanRef = useRef({ x: 0, y: 0 });
  const previewScaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const isNavigatingRef = useRef(false);
  const isPanningRef = useRef(false);

  const project = useAppStore((s) => s.project);
  const zoom = useAppStore((s) => s.zoom);
  const navigator = useAppStore((s) => s.navigator);
  const viewportSnapshot = useAppStore((s) => s.viewportSnapshot);
  const getCompositeGrid = useAppStore((s) => s.getCompositeGrid);
  const setNavigatorPosition = useAppStore((s) => s.setNavigatorPosition);
  const setNavigatorBounds = useAppStore((s) => s.setNavigatorBounds);
  const viewportContainer = useAppStore((s) => s.viewportContainer);
  const zoomNavigatorPreviewAtPoint = useAppStore(
    (s) => s.zoomNavigatorPreviewAtPoint,
  );
  const panNavigatorPreview = useAppStore((s) => s.panNavigatorPreview);
  const navigateToPreviewPoint = useAppStore((s) => s.navigateToPreviewPoint);

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
    const pixelCanvas = pixelCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!pixelCanvas || !overlayCanvas || !project || !viewportSnapshot) return;

    const composite = getCompositeGrid();
    if (!composite) return;

    const transform = computePreviewTransform(viewportSnapshot, previewLayout);

    pixelCanvas.width = composite.width;
    pixelCanvas.height = composite.height;
    pixelCanvas.style.position = "absolute";
    pixelCanvas.style.left = `${transform.offsetX}px`;
    pixelCanvas.style.top = `${transform.offsetY}px`;
    pixelCanvas.style.width = `${transform.drawnWidth}px`;
    pixelCanvas.style.height = `${transform.drawnHeight}px`;
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
  }, [
    project,
    previewLayout,
    viewportSnapshot,
    getCompositeGrid,
  ]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview, zoom, renderTick]);

  useEffect(() => {
    if (!navigator.visible) return;
    const id = requestAnimationFrame(() => setRenderTick((t) => t + 1));
    return () => cancelAnimationFrame(id);
  }, [navigator.visible, viewportSnapshot]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setNavigatorPosition(
          dragStartRef.current.posX + dx,
          dragStartRef.current.posY + dy,
        );
        return;
      }

      if (resizeStartRef.current) {
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
      isDraggingRef.current = false;
      resizeStartRef.current = null;
      isNavigatingRef.current = false;
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
    setNavigatorPosition,
    setNavigatorBounds,
    viewportContainer,
    panNavigatorPreview,
    navigateToPreviewPoint,
    getPreviewPoint,
  ]);

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
    const delta = e.deltaY > 0 ? -PREVIEW_ZOOM_STEP : PREVIEW_ZOOM_STEP;
    zoomNavigatorPreviewAtPoint(point.x, point.y, currentScale + delta);
  };

  const zoomPreviewAtCenter = (delta: number) => {
    zoomNavigatorPreviewAtPoint(
      navigator.size.width / 2,
      navigator.size.height / 2,
      navigator.previewScale + delta,
    );
  };

  const handleZoomOut = () => {
    zoomPreviewAtCenter(-HEADER_ZOOM_STEP);
  };

  const handleZoomIn = () => {
    zoomPreviewAtCenter(HEADER_ZOOM_STEP);
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
      className="pointer-events-auto absolute z-30 flex flex-col overflow-hidden rounded border-2 border-zinc-600 bg-zinc-900 shadow-xl"
      style={{
        left: navigator.position.x,
        top: navigator.position.y,
        width: navigator.size.width,
        height: panelHeight,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="flex cursor-move select-none items-center justify-between border-b-2 border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-300"
        style={{ height: HEADER_HEIGHT }}
        onMouseDown={handleHeaderMouseDown}
      >
        <span>导航</span>
        <div className="flex items-center gap-1">
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
