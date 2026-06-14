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
import {
  blitWithDisplayMode,
  OklabDisplayGlRenderer,
} from "@/infrastructure/canvas/OklabDisplayGlRenderer";
import { renderBrushStampPreview } from "@/infrastructure/canvas/BrushStampPreviewRenderer";
import { renderBrushLinePreview } from "@/infrastructure/canvas/BrushLinePreviewRenderer";
import {
  renderSelectionOverlay,
  renderTransformHandles,
} from "@/infrastructure/canvas/SelectionOverlayRenderer";
import { isDrawingToolType } from "@/domain/tool/ToolRegistry";
import { clampStampSize } from "@/domain/tool/ToolType";
import type { ReferenceLayer } from "@/domain/layer/Layer";
import { findTopReferenceLayerAtCanvasPoint } from "@/domain/layer/ReferenceLayerPalette";
import {
  getOverlayPixelCoordinates,
  resolveMousePositionOverlayTarget,
} from "@/domain/grid/MousePositionOverlayTarget";
import { getReferenceStackIndex } from "@/domain/layer/LayerStack";
import {
  computeGridRelativeLabelScreenPosition,
  computeSecondaryGridCellScreenBounds,
  normalizeDragRect,
} from "@/domain/viewport/OverlayLabelLayout";
import { buildReferenceLayerContextMenuItems } from "../config/referenceLayerContextMenu";
import { useAppStore, type ColorSlot, type DrawingButton } from "../stores/appStore";
import { useAltKeyHeld } from "../hooks/useAltKeyHeld";
import { useBrushSizeHint } from "../hooks/useBrushSizeHint";
import { useMousePositionOverlay } from "../hooks/useMousePositionOverlay";
import { releaseKeyboardFocus, isTextEntryElement } from "../utils/editableFocus";
import { CanvasBoundsLabel } from "./CanvasBoundsLabel";
import { CanvasBrushSizeHint } from "./CanvasBrushSizeHint";
import { CanvasMousePositionHint } from "./CanvasMousePositionHint";
import { CanvasMousePositionGridHighlight } from "./CanvasMousePositionGridHighlight";
import { ContextMenu } from "./ContextMenu";
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

function clientToPixel(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  zoom: number,
): CanvasPoint {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.floor((clientX - rect.left) / zoom),
    y: Math.floor((clientY - rect.top) / zoom),
  };
}

export function CanvasView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const oklabRendererRef = useRef<OklabDisplayGlRenderer | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPanningRef = useRef(false);
  const mousePositionOverlaySuppressedRef = useRef(false);
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
  const foregroundColor = useAppStore((s) => s.foregroundColor);
  const selection = useAppStore((s) => s.selection);
  const selectionDrag = useAppStore((s) => s.selectionDrag);
  const selectionPreviewRect = useAppStore((s) => s.selectionPreviewRect);
  const lassoPoints = useAppStore((s) => s.lassoPoints);
  const pointerDown = useAppStore((s) => s.pointerDown);
  const pointerMove = useAppStore((s) => s.pointerMove);
  const pointerUp = useAppStore((s) => s.pointerUp);
  const pickColorAt = useAppStore((s) => s.pickColorAt);
  const drawingButton = useAppStore((s) => s.drawingButton);
  const isDrawing = useAppStore((s) => s.isDrawing);
  const drawStart = useAppStore((s) => s.drawStart);
  const lastPoint = useAppStore((s) => s.lastPoint);
  const brushLineAnchor = useAppStore((s) => s.brushLineAnchor);
  const getCompositeGrid = useAppStore((s) => s.getCompositeGrid);
  const isCapturing = useAppStore((s) => s.isCapturing);
  const assetCapturePhase = useAppStore((s) => s.assetCapturePhase);
  const assetCaptureRect = useAppStore((s) => s.assetCaptureRect);
  const assetCaptureSource = useAppStore((s) => s.assetCaptureSource);
  const assetCapturePointerDown = useAppStore((s) => s.assetCapturePointerDown);
  const assetCapturePointerMove = useAppStore((s) => s.assetCapturePointerMove);
  const assetCapturePointerUp = useAppStore((s) => s.assetCapturePointerUp);
  const cancelAssetCanvasCapture = useAppStore((s) => s.cancelAssetCanvasCapture);
  const confirmAssetCanvasCapture = useAppStore((s) => s.confirmAssetCanvasCapture);
  const setAssetCaptureSource = useAppStore((s) => s.setAssetCaptureSource);
  const setViewportContainer = useAppStore((s) => s.setViewportContainer);
  const syncViewportSnapshot = useAppStore((s) => s.syncViewportSnapshot);
  const adaptFloatingPanelsToViewport = useAppStore((s) => s.adaptFloatingPanelsToViewport);
  const mousePositionOverlayVisible = useAppStore((s) => s.mousePositionOverlayVisible);
  const canvasDisplayMode = useAppStore((s) => s.canvasDisplayMode);
  const setActiveReferenceLayer = useAppStore((s) => s.setActiveReferenceLayer);
  const openCropEditor = useAppStore((s) => s.openCropEditor);
  const toggleReferenceGrid = useAppStore((s) => s.toggleReferenceGrid);
  const importImageToReferenceLayer = useAppStore((s) => s.importImageToReferenceLayer);

  const [isPanning, setIsPanning] = useState(false);
  const altHeld = useAltKeyHeld();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hoverPoint, setHoverPoint] = useState<CanvasPoint | null>(null);
  const [referenceContextMenu, setReferenceContextMenu] = useState<{
    layerId: string;
    x: number;
    y: number;
  } | null>(null);
  const [shiftKeyHeld, setShiftKeyHeld] = useState(false);
  const [spaceKeyHeld, setSpaceKeyHeld] = useState(false);
  const spaceKeyHeldRef = useRef(false);
  const [marchPhase, setMarchPhase] = useState(0);
  const marchFrameRef = useRef<number | null>(null);

  const { hint: brushSizeHint, show: showBrushSizeHint, hide: hideBrushSizeHint, handleMouseMove: handleBrushHintMouseMove } =
    useBrushSizeHint();
  const {
    overlay: mousePositionOverlay,
    update: updateMousePositionOverlay,
    clear: clearMousePositionOverlay,
  } = useMousePositionOverlay();

  const composite = useMemo(() => {
    if (!project) return null;
    return getCompositeGrid();
  }, [project, getCompositeGrid, selection]);

  const displayWidth = composite ? composite.width * zoom : 0;
  const displayHeight = composite ? composite.height * zoom : 0;

  const isAssetCaptureDragging = assetCapturePhase === "dragging";
  const isAssetCaptureAdjusting = assetCapturePhase === "adjusting";
  const isAssetCaptureActive = assetCapturePhase !== "idle";

  const boundsLabelRect = useMemo(() => {
    if (
      isAssetCaptureActive &&
      assetCaptureRect &&
      assetCaptureRect.width > 0 &&
      assetCaptureRect.height > 0
    ) {
      return assetCaptureRect;
    }
    if (
      activeTool === "select" &&
      selectionDrag?.mode === "create" &&
      toolSettings.selectionMode !== "lasso" &&
      toolSettings.selectionMode !== "magicWand" &&
      selectionPreviewRect &&
      selectionPreviewRect.width > 0 &&
      selectionPreviewRect.height > 0
    ) {
      return selectionPreviewRect;
    }
    if (
      activeTool === "shape" &&
      isDrawing &&
      drawStart &&
      lastPoint &&
      toolSettings.shapeMode !== "line"
    ) {
      return normalizeDragRect(drawStart, lastPoint);
    }
    return null;
  }, [
    isAssetCaptureActive,
    assetCaptureRect,
    activeTool,
    drawStart,
    isDrawing,
    lastPoint,
    selectionDrag,
    selectionPreviewRect,
    toolSettings.selectionMode,
    toolSettings.shapeMode,
  ]);

  const layoutContainerWidth =
    containerSize.width > 0
      ? containerSize.width
      : WORKSPACE_CONTAINER_FALLBACK_WIDTH;
  const layoutContainerHeight =
    containerSize.height > 0
      ? containerSize.height
      : WORKSPACE_CONTAINER_FALLBACK_HEIGHT;

  const activeReferenceLayerId = project?.canvas.activeReferenceLayerId;

  const referenceLayers = useMemo(() => {
    if (!project) return [];
    return project.canvas.layers.filter(
      (l): l is ReferenceLayer => l.type === "reference",
    );
  }, [project]);

  const closeReferenceContextMenu = useCallback(() => {
    setReferenceContextMenu(null);
  }, []);

  const openReferenceContextMenu = useCallback(
    (layerId: string, clientX: number, clientY: number) => {
      setActiveReferenceLayer(layerId);
      setReferenceContextMenu({ layerId, x: clientX, y: clientY });
    },
    [setActiveReferenceLayer],
  );

  const referenceContextMenuLayer = useMemo(() => {
    if (!referenceContextMenu || !project) return null;
    const layer = project.canvas.layers.find(
      (l) => l.id === referenceContextMenu.layerId && l.type === "reference",
    );
    return layer?.type === "reference" ? layer : null;
  }, [referenceContextMenu, project]);

  const referenceContextMenuItems = useMemo(() => {
    if (!referenceContextMenuLayer) return [];
    return buildReferenceLayerContextMenuItems(referenceContextMenuLayer, {
      openCropEditor,
      toggleReferenceGrid,
      importImageToReferenceLayer: (layerId) => {
        void importImageToReferenceLayer(layerId);
      },
    });
  }, [
    referenceContextMenuLayer,
    openCropEditor,
    toggleReferenceGrid,
    importImageToReferenceLayer,
  ]);

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

    const renderer = oklabRendererRef.current;
    const glCanvas = glCanvasRef.current;

    if (canvasDisplayMode === "oklabLightness" && renderer && glCanvas) {
      const imageData = new ImageData(composite.toRgba(), composite.width, composite.height);
      blitWithDisplayMode(
        renderer,
        glCanvas,
        imageData,
        composite.width,
        composite.height,
        canvasDisplayMode,
      );
      ctx.drawImage(glCanvas, 0, 0, displayWidth, displayHeight);
    } else {
      renderPixelGrid1x(offCtx, composite);
      ctx.drawImage(offscreen, 0, 0, displayWidth, displayHeight);
    }

    if (selection?.floating) {
      const { pixels, offset } = selection.floating;
      const floatDisplayWidth = pixels.width * zoom;
      const floatDisplayHeight = pixels.height * zoom;

      if (canvasDisplayMode === "oklabLightness" && renderer && glCanvas) {
        const floatImageData = new ImageData(pixels.toRgba(), pixels.width, pixels.height);
        blitWithDisplayMode(
          renderer,
          glCanvas,
          floatImageData,
          floatDisplayWidth,
          floatDisplayHeight,
          canvasDisplayMode,
        );
        ctx.drawImage(
          glCanvas,
          offset.x * zoom,
          offset.y * zoom,
          floatDisplayWidth,
          floatDisplayHeight,
        );
      } else {
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
            floatDisplayWidth,
            floatDisplayHeight,
          );
        }
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
  }, [project, composite, displayWidth, displayHeight, zoom, selection, canvasDisplayMode]);

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

    const capturePreviewRect =
      isAssetCaptureActive &&
      assetCaptureRect &&
      assetCaptureRect.width > 0 &&
      assetCaptureRect.height > 0
        ? assetCaptureRect
        : null;

    renderSelectionOverlay(ctx, {
      selection: capturePreviewRect ? null : selectionDrag?.layerPan ? null : selection,
      previewRect: capturePreviewRect ?? selectionPreviewRect,
      lassoPoints,
      phase: marchPhase,
      zoom,
      canvasWidth: composite.width,
      canvasHeight: composite.height,
    });

    if (activeTool === "transform" && selection && !selectionDrag?.layerPan) {
      renderTransformHandles(ctx, { selection, zoom, phase: marchPhase });
    }

    if (brushPreview && hoverPoint && !isPanning && !isAssetCaptureActive) {
      if (
        activeTool === "brush" &&
        shiftKeyHeld &&
        brushLineAnchor &&
        (brushLineAnchor.x !== hoverPoint.x || brushLineAnchor.y !== hoverPoint.y)
      ) {
        renderBrushLinePreview(
          ctx,
          brushLineAnchor,
          hoverPoint,
          { brushSize: brushPreview.size, brushShape: brushPreview.shape },
          foregroundColor,
          zoom,
          { width: composite.width, height: composite.height },
        );
      }

      renderBrushStampPreview(
        ctx,
        hoverPoint,
        brushPreview.size,
        brushPreview.shape,
        activeTool === "brush" ? foregroundColor : null,
        zoom,
        { width: composite.width, height: composite.height },
      );
    }
  }, [
    activeTool,
    assetCaptureRect,
    brushLineAnchor,
    brushPreview,
    composite,
    displayWidth,
    displayHeight,
    foregroundColor,
    hoverPoint,
    isAssetCaptureActive,
    isPanning,
    lassoPoints,
    marchPhase,
    selection,
    selectionDrag,
    selectionPreviewRect,
    shiftKeyHeld,
    zoom,
  ]);

  const preventSpaceScroll = useCallback((e: KeyboardEvent | React.KeyboardEvent) => {
    if (isTextEntryElement(document.activeElement)) return;
    if (e.code !== "Space") return;
    e.preventDefault();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("keydown", preventSpaceScroll, true);
    return () => container.removeEventListener("keydown", preventSpaceScroll, true);
  }, [project, preventSpaceScroll]);

  useEffect(() => {
    spaceKeyHeldRef.current = spaceKeyHeld;
  }, [spaceKeyHeld]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTextEntryElement(document.activeElement)) return;

      if (e.key === "Shift") setShiftKeyHeld(true);
      if (e.code !== "Space") return;

      e.preventDefault();
      if (e.repeat) return;

      setSpaceKeyHeld(true);

      const {
        selectionDrag: drag,
        activeTool: tool,
        drawingButton: button,
      } = useAppStore.getState();
      if (tool !== "select" || !drag || drag.mode !== "create" || button === null) {
        return;
      }

      pointerMove(drag.current, button, {
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        spaceKey: true,
      });
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isTextEntryElement(document.activeElement)) return;

      if (e.key === "Shift") setShiftKeyHeld(false);
      if (e.code !== "Space") return;

      e.preventDefault();
      setSpaceKeyHeld(false);

      const {
        selectionDrag: drag,
        activeTool: tool,
        drawingButton: button,
      } = useAppStore.getState();
      if (tool !== "select" || !drag?.deferredCreate || button === null) {
        return;
      }

      pointerMove(drag.current, button, {
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        spaceKey: false,
      });
    };
    const handleBlur = () => {
      setShiftKeyHeld(false);
      setSpaceKeyHeld(false);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("blur", handleBlur);
    };
  }, [pointerMove]);

  useEffect(() => {
    const MARCH_PERIOD = 16;
    const MARCH_STEP_MS = 120;
    let lastStep = performance.now();

    const tick = (now: number) => {
      if (now - lastStep >= MARCH_STEP_MS) {
        lastStep = now;
        setMarchPhase((p) => (p + 1) % MARCH_PERIOD);
      }
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

  useEffect(() => {
    oklabRendererRef.current = new OklabDisplayGlRenderer();
    glCanvasRef.current = document.createElement("canvas");
    return () => {
      oklabRendererRef.current?.dispose();
      oklabRendererRef.current = null;
      glCanvasRef.current = null;
    };
  }, []);

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
      adaptFloatingPanelsToViewport();
    });

    container.addEventListener("scroll", handleScroll, { passive: true });
    resizeObserver.observe(container);
    syncViewportSnapshot(canvasRef.current);
    adaptFloatingPanelsToViewport();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      setViewportContainer(null);
    };
  }, [project, setViewportContainer, syncViewportSnapshot, adaptFloatingPanelsToViewport]);

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
    mousePositionOverlaySuppressedRef.current = false;

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

      const { assetCapturePhase } = useAppStore.getState();
      if (assetCapturePhase !== "idle") return;

      if (e.ctrlKey) {
        const { activeTool: tool, toolSettings: settings } = useAppStore.getState();
        if (tool === "brush" || tool === "eraser") {
          const delta = e.deltaY > 0 ? -1 : 1;
          const sizeKey = tool === "brush" ? "brushSize" : "eraserSize";
          const currentSize = settings[sizeKey];
          const newSize = clampStampSize(currentSize + delta);
          if (newSize !== currentSize) {
            setToolSettings({ [sizeKey]: newSize });
            showBrushSizeHint(newSize, e.clientX, e.clientY);
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
      mousePositionOverlaySuppressedRef.current = true;
      clearMousePositionOverlay();
      setZoom(newZoom);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [project, setZoom, setToolSettings, showBrushSizeHint, clearMousePositionOverlay]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMove = () => {
      handleBrushHintMouseMove();
    };

    container.addEventListener("mousemove", handleMove);
    return () => container.removeEventListener("mousemove", handleMove);
  }, [handleBrushHintMouseMove]);

  const startPanning = useCallback((clientX: number, clientY: number) => {
    isPanningRef.current = true;
    mousePositionOverlaySuppressedRef.current = true;
    setIsPanning(true);
    setHoverPoint(null);
    clearMousePositionOverlay();
    lastPanRef.current = { x: clientX, y: clientY };
  }, [clearMousePositionOverlay]);

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
    mousePositionOverlaySuppressedRef.current = false;
    setIsPanning(false);
  }, []);

  const toPixel = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): CanvasPoint => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      return clientToPixel(e.clientX, e.clientY, canvas, zoom);
    },
    [zoom],
  );

  const handleCanvasContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (e.altKey || !project) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const point = clientToPixel(e.clientX, e.clientY, canvas, zoom);
      const refLayer = findTopReferenceLayerAtCanvasPoint(project.canvas.layers, point);
      if (!refLayer) return;
      openReferenceContextMenu(refLayer.id, e.clientX, e.clientY);
    },
    [project, zoom, openReferenceContextMenu],
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
    if (!container || (activeTool !== "brush" && activeTool !== "eraser") || isAssetCaptureActive) return;

    const handleMove = (e: MouseEvent) => {
      if (isPanningRef.current) return;
      updateHoverFromClient(e.clientX, e.clientY);
    };

    container.addEventListener("mousemove", handleMove);
    return () => container.removeEventListener("mousemove", handleMove);
  }, [activeTool, isAssetCaptureActive, updateHoverFromClient]);

  useEffect(() => {
    if (!mousePositionOverlayVisible) {
      clearMousePositionOverlay();
      return;
    }

    const container = containerRef.current;
    if (!container || !project || !composite) {
      clearMousePositionOverlay();
      return;
    }

    const secondarySize = project.grid.secondary;

    const handleMove = (e: MouseEvent) => {
      if (isPanningRef.current || mousePositionOverlaySuppressedRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) {
        clearMousePositionOverlay();
        return;
      }

      const point = clientToPixel(e.clientX, e.clientY, canvas, zoom);
      const target = resolveMousePositionOverlayTarget(
        point,
        referenceLayers,
        secondarySize,
        composite,
      );
      if (!target) {
        clearMousePositionOverlay();
        return;
      }

      const canvasRect = canvas.getBoundingClientRect();
      const labelPosition = computeGridRelativeLabelScreenPosition(
        canvasRect,
        target.canvasCellOrigin,
        target.secondarySize,
        zoom,
      );
      const cellBounds = computeSecondaryGridCellScreenBounds(
        canvasRect,
        target.canvasCellOrigin,
        target.secondarySize,
        zoom,
      );
      const pixelCoords = getOverlayPixelCoordinates(target);

      updateMousePositionOverlay(
        labelPosition.left,
        labelPosition.top,
        cellBounds,
        pixelCoords.x,
        pixelCoords.y,
        target.secondarySize,
      );
    };

    const handleLeave = () => {
      clearMousePositionOverlay();
    };

    container.addEventListener("mousemove", handleMove);
    container.addEventListener("mouseleave", handleLeave);
    return () => {
      container.removeEventListener("mousemove", handleMove);
      container.removeEventListener("mouseleave", handleLeave);
    };
  }, [
    mousePositionOverlayVisible,
    project,
    composite,
    referenceLayers,
    zoom,
    updateMousePositionOverlay,
    clearMousePositionOverlay,
  ]);

  const focusCanvasKeyboard = useCallback(() => {
    releaseKeyboardFocus();
    containerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!isAssetCaptureActive) return;
    setHoverPoint(null);
    hideBrushSizeHint();
  }, [isAssetCaptureActive, hideBrushSizeHint]);

  useEffect(() => {
    if (!isAssetCaptureAdjusting) return;
    focusCanvasKeyboard();
  }, [isAssetCaptureAdjusting, focusCanvasKeyboard]);

  useEffect(() => {
    if (!isAssetCaptureAdjusting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTextEntryElement(document.activeElement)) return;

      const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (!arrowKeys.includes(e.key) && e.key !== "Enter" && e.key !== "Escape") {
        return;
      }

      const store = useAppStore.getState();
      if (store.assetCapturePhase !== "adjusting") return;

      if (e.key === "Escape") {
        e.preventDefault();
        store.cancelAssetCanvasCapture();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        void store.confirmAssetCanvasCapture();
        return;
      }

      e.preventDefault();
      const dx = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
      const dy = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
      const corner = e.shiftKey ? "bottomRight" : "topLeft";
      store.adjustAssetCaptureRect(dx, dy, corner);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isAssetCaptureAdjusting]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    focusCanvasKeyboard();
    if (isMiddleMouseButton(e.button)) {
      e.preventDefault();
      startPanning(e.clientX, e.clientY);
      return;
    }
    if (isAssetCaptureDragging) {
      e.preventDefault();
      assetCapturePointerDown(toPixel(e));
      return;
    }
    const button = buttonFromMouseButton(e.button);
    if (!button) return;
    e.preventDefault();
    const point = toPixel(e);
    const modifiers = {
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      spaceKey: spaceKeyHeldRef.current,
    };
    if (e.altKey) {
      pickColorAt(point, colorSlotFromDrawingButton(button));
      return;
    }
    pointerDown(point, button, modifiers);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) return;
    const point = toPixel(e);
    if (isAssetCaptureDragging) {
      assetCapturePointerMove(point);
      return;
    }
    if (isAssetCaptureActive) return;
    updateHoverFromClient(e.clientX, e.clientY);
    const button = drawingButton;
    const modifiers = {
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      spaceKey: spaceKeyHeldRef.current,
    };
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
    if (isAssetCaptureDragging) {
      assetCapturePointerUp(toPixel(e));
      return;
    }
    const button = buttonFromMouseButton(e.button);
    if (!button) return;
    pointerUp(toPixel(e), button, {
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      spaceKey: spaceKeyHeldRef.current,
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setHoverPoint(null);
    if (selectionDrag || isDrawing) return;
    if (!drawingButton && activeTool !== "select" && activeTool !== "transform") return;
    pointerUp(toPixel(e), drawingButton ?? "primary", {
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      spaceKey: spaceKeyHeldRef.current,
    });
  };

  const assetCaptureTracking =
    isAssetCaptureDragging && assetCaptureRect !== null;

  const documentPointerTracking =
    assetCaptureTracking ||
    (drawingButton !== null &&
      ((selectionDrag !== null &&
        (activeTool === "select" || activeTool === "transform")) ||
        (isDrawing && isDrawingToolType(activeTool))));

  useEffect(() => {
    if (!documentPointerTracking) return;

    const handleDocumentMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const {
        drawingButton: button,
        activeTool: tool,
        selectionDrag: drag,
        isDrawing: drawing,
        assetCapturePhase: capturePhase,
      } = useAppStore.getState();

      if (capturePhase === "dragging") {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const point = clientToPixel(e.clientX, e.clientY, canvas, zoomRef.current);
        useAppStore.getState().assetCapturePointerMove(point);
        return;
      }

      if (button === null) return;

      const isSelectTransform =
        (tool === "select" || tool === "transform") && drag !== null;
      const isActiveDrawingTool = drawing && isDrawingToolType(tool);
      if (!isSelectTransform && !isActiveDrawingTool) return;

      const point = clientToPixel(e.clientX, e.clientY, canvas, zoomRef.current);
      const modifiers = {
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        spaceKey: spaceKeyHeldRef.current,
      };

      if (isDrawingButtonPressed(e.buttons, button)) {
        pointerMove(point, button, modifiers);
      } else if (e.buttons !== 0 && isSelectTransform) {
        pointerMove(point, "primary", modifiers);
      }
    };

    const handleDocumentMouseUp = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const { assetCapturePhase: capturePhase } = useAppStore.getState();
      if (capturePhase === "dragging") {
        const point = clientToPixel(e.clientX, e.clientY, canvas, zoomRef.current);
        useAppStore.getState().assetCapturePointerUp(point);
        return;
      }

      const button = buttonFromMouseButton(e.button);
      if (!button) return;

      const {
        drawingButton: activeButton,
        selectionDrag: drag,
        isDrawing: drawing,
        activeTool: tool,
      } = useAppStore.getState();

      const isSelectTransform =
        (tool === "select" || tool === "transform") && drag !== null;
      const isActiveDrawingTool = drawing && isDrawingToolType(tool);
      if (!isSelectTransform && !isActiveDrawingTool) return;

      const expectedButton = activeButton ?? "primary";
      if (button !== expectedButton) return;

      const point = clientToPixel(e.clientX, e.clientY, canvas, zoomRef.current);
      pointerUp(point, button, {
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        spaceKey: spaceKeyHeldRef.current,
      });
    };

    document.addEventListener("mousemove", handleDocumentMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleDocumentMouseMove);
      document.removeEventListener("mouseup", handleDocumentMouseUp);
    };
  }, [documentPointerTracking, pointerMove, pointerUp]);

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
    focusCanvasKeyboard();
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
        tabIndex={-1}
        className={`relative min-h-0 min-w-0 flex-1 overflow-auto bg-zinc-800 outline-none${
          isPanning ? " cursor-grabbing" : isAssetCaptureActive ? " cursor-capture" : ""
        }`}
        onMouseDown={handleContainerMouseDown}
        onKeyDown={preventSpaceScroll}
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
                className={`block${
                  isPanning
                    ? " cursor-grabbing"
                    : isAssetCaptureActive
                      ? " cursor-capture"
                      : altHeld
                        ? " cursor-eyedropper"
                        : " cursor-crosshair"
                }`}
                style={{ imageRendering: "pixelated" }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onAuxClick={handleAuxClick}
                onContextMenu={handleCanvasContextMenu}
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
                  isActive={layer.id === activeReferenceLayerId}
                  onContextMenuRequest={openReferenceContextMenu}
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
              {boundsLabelRect && (
                <CanvasBoundsLabel rect={boundsLabelRect} zoom={zoom} />
              )}
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
      {isAssetCaptureDragging && (
        <div className="pointer-events-none absolute left-4 top-4 z-20 rounded bg-zinc-900/90 px-3 py-2 text-xs text-zinc-200">
          资产截图：拖拽框选区域，Esc 取消
        </div>
      )}
      {isAssetCaptureAdjusting && assetCaptureRect && (
        <div className="absolute left-4 top-4 z-20 rounded border border-zinc-600 bg-zinc-900/95 px-3 py-2 text-xs text-zinc-200 shadow-lg">
          <p className="mb-2 text-[10px] text-zinc-500">
            {assetCaptureRect.width}×{assetCaptureRect.height} · 方向键调左上角 · Shift+方向键调右下角 · Enter 确认 · Esc 取消
          </p>
          <div className="mb-2 flex gap-1">
            <button
              type="button"
              onClick={() => setAssetCaptureSource("activeLayer")}
              className={`rounded px-2 py-0.5 text-[10px] ${
                assetCaptureSource === "activeLayer"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              当前图层
            </button>
            <button
              type="button"
              onClick={() => setAssetCaptureSource("composite")}
              className={`rounded px-2 py-0.5 text-[10px] ${
                assetCaptureSource === "composite"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              完整图像
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void confirmAssetCanvasCapture()}
              className="rounded bg-blue-600 px-2 py-1 text-[10px] text-white hover:bg-blue-700"
            >
              确认
            </button>
            <button
              type="button"
              onClick={cancelAssetCanvasCapture}
              className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700"
            >
              取消
            </button>
          </div>
        </div>
      )}
      {brushSizeHint && !isAssetCaptureActive && <CanvasBrushSizeHint hint={brushSizeHint} />}
      {mousePositionOverlay && (
        <>
          <CanvasMousePositionGridHighlight hint={mousePositionOverlay} />
          <CanvasMousePositionHint hint={mousePositionOverlay} />
        </>
      )}
      <NavigatorPanel />
      <FloatingColorPickerPanel />
      <ReferenceCropModal />
      {referenceContextMenu && referenceContextMenuItems.length > 0 && (
        <ContextMenu
          position={{ x: referenceContextMenu.x, y: referenceContextMenu.y }}
          items={referenceContextMenuItems}
          onClose={closeReferenceContextMenu}
        />
      )}
    </div>
  );
}
