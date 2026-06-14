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
import { applyWheelZoomRatio, computeInitialFitZoom } from "./imagePreviewUtils";

interface ZoomAnchor {
  logicalPoint: CanvasPoint;
  clientX: number;
  clientY: number;
}

export interface ImagePreviewViewportOptions {
  /** 返回 false 时不处理视图滚轮缩放（例如 Shift/Ctrl+滚轮留给其他交互）。 */
  shouldHandleWheelZoom?: (event: WheelEvent) => boolean;
}

export function useImagePreviewViewport(
  imageData: ImageData | null,
  options?: ImagePreviewViewportOptions,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef(1);
  const isPanningRef = useRef(false);
  const lastPanRef = useRef({ x: 0, y: 0 });
  const zoomAnchorRef = useRef<ZoomAnchor | null>(null);
  const centeredImageKeyRef = useRef<string | null>(null);
  const didInitialScrollRef = useRef(false);
  const prevImageKeyRef = useRef<string | null>(null);
  const prevStageLayoutRef = useRef<WorkspaceStageLayout | null>(null);
  const stageLayoutRef = useRef<WorkspaceStageLayout | null>(null);
  const shouldHandleWheelZoomRef = useRef<(event: WheelEvent) => boolean>(
    options?.shouldHandleWheelZoom ?? (() => true),
  );
  shouldHandleWheelZoomRef.current = options?.shouldHandleWheelZoom ?? (() => true);

  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

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

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    canvas.width = imageWidth;
    canvas.height = imageHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.putImageData(imageData, 0, 0);
  }, [imageData, imageWidth, imageHeight, displayWidth, displayHeight]);

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
      if (!shouldHandleWheelZoomRef.current(event)) {
        return;
      }

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

    const handleDocumentMouseMove = (event: MouseEvent) => {
      if (!isPanningRef.current) return;
      if (!isMiddleMousePressed(event.buttons)) {
        stopPanning();
        return;
      }
      applyPanMove(event.clientX, event.clientY);
    };

    const handleDocumentMouseUp = (event: MouseEvent) => {
      if (isMiddleMouseButton(event.button)) {
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

  const handleContainerMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isMiddleMouseButton(event.button)) return;
    event.preventDefault();
    startPanning(event.clientX, event.clientY);
  };

  const handleAuxClick = (event: React.MouseEvent) => {
    if (isMiddleMouseButton(event.button)) {
      event.preventDefault();
    }
  };

  return {
    containerRef,
    canvasRef,
    zoom,
    zoomRef,
    isPanning,
    isPanningRef,
    stageLayout,
    imageWidth,
    imageHeight,
    displayWidth,
    displayHeight,
    handleContainerMouseDown,
    handleAuxClick,
    stopPanning,
    startPanning,
    applyPanMove,
  };
}

export function canvasClientToImage(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  zoom: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor((clientX - rect.left) / zoom),
    y: Math.floor((clientY - rect.top) / zoom),
  };
}
