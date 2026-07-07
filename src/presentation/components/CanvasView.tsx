import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  computeScrollPositionForZoomAtPoint,
  resolveCanvasPointAtStagePosition,
  type CanvasPoint,
} from "@/domain/viewport/ZoomAtPoint";
import {
  WORKSPACE_CONTAINER_FALLBACK_HEIGHT,
  WORKSPACE_CONTAINER_FALLBACK_WIDTH,
  type WorkspaceStageLayout,
} from "@/domain/viewport/WorkspaceLayout";
import { fitActiveCanvasInViewport } from "@/application/use-cases/FitActiveCanvasInViewport";
import { applyEditorWheelZoomRatio } from "@/domain/viewport/EditorZoom";
import { computeActiveCanvasCenterScroll } from "@/domain/pixelCanvas/ActiveCanvasViewport";
import {
  boardLayoutToWorkspaceStage,
  boardRenderOrigin,
  computeBoardContentBounds,
  computeBoardInitialScrollPosition,
  computeBoardLayout,
  computeCanvasCompositeDisplayRect,
  hitTestBoardCanvas,
  resolveCanvasDropTarget,
  stagePointToBoardPoint,
  type BoardLayout,
} from "@/domain/pixelCanvas/BoardLayout";
import {
  computePanScrollDelta,
  isMiddleMouseButton,
  isMiddleMousePressed,
} from "@/domain/viewport/ViewportPan";
import { gridColorRgbString } from "@/domain/appSettings/AppSettings";
import { renderTransparencyCheckerboard } from "@/infrastructure/canvas/CanvasBackgroundRenderer";
import { renderCanvasGrid } from "@/infrastructure/canvas/CanvasGridRenderer";
import { renderPixelGrid1x } from "@/infrastructure/canvas/PixelGridCanvasRenderer";
import {
  blitWithDisplayMode,
  OklchDisplayGlRenderer,
} from "@/infrastructure/canvas/OklchDisplayGlRenderer";
import { renderBrushStampPreview } from "@/infrastructure/canvas/BrushStampPreviewRenderer";
import { renderBrushLinePreview } from "@/infrastructure/canvas/BrushLinePreviewRenderer";
import { renderPatternBrushPreview } from "@/infrastructure/canvas/PatternBrushPreviewRenderer";
import {
  hitTestTransformHandle,
  renderSelectionOverlay,
  renderTransformHandles,
  type TransformHandle,
} from "@/infrastructure/canvas/SelectionOverlayRenderer";
import { getTransformHandleCursor } from "@/domain/selection/TransformHandleInteraction";
import { renderSymmetryAxis } from "@/infrastructure/canvas/SymmetryAxisRenderer";
import { renderTileOverlay } from "@/infrastructure/canvas/TileOverlayRenderer";
import type { Point } from "@/domain/tool/ITool";
import { rgbKey } from "@/domain/canvas/PixelColor";
import { isSymmetryActive } from "@/domain/symmetry/SymmetryConfig";
import {
  forEachSymmetricTransform,
  hitTestSymmetryAxis,
} from "@/domain/symmetry/SymmetryMirror";
import { isDrawingToolType, toolReservesCanvasRightClick } from "@/domain/tool/ToolRegistry";
import { clampStampSize } from "@/domain/tool/ToolType";
import { shapeDragPreviewRect } from "@/domain/tool/ShapeDragGeometry";
import { findTopReferenceLayerAtBoardPoint } from "@/domain/layer/ReferenceLayerPalette";
import { canvasPointToBoardPoint } from "@/domain/layer/ReferenceLayerOperations";
import {
  getOverlayPixelCoordinates,
  resolveMousePositionOverlayTarget,
} from "@/domain/grid/MousePositionOverlayTarget";
import { getReferenceStackIndex } from "@/domain/layer/LayerStack";
import { getActiveCanvas, getCompositeGrid as getProjectCompositeGrid } from "@/domain/project/Project";
import {
  computeGridRelativeLabelScreenPosition,
  computeSecondaryGridCellScreenBounds,
  computeSecondaryGridCellScreenBoundsWithSpans,
} from "@/domain/viewport/OverlayLabelLayout";
import {
  computeForeshortenedSecondarySpan,
  computeForeshortenedSpan,
  resolveOrthographicAngle,
} from "@/domain/viewport/OrthographicView";
import {
  computeOrthographicSecondaryGridCellOrigin,
} from "@/domain/grid/GridRelativePosition";
import { buildReferenceLayerContextMenuItems } from "../config/referenceLayerContextMenu";
import { buildSelectionContextMenuItems } from "../config/selectionContextMenu";
import { isSelectionEmpty } from "@/domain/selection/SelectionState";
import { useAppStore, type ColorSlot, type DrawingButton } from "../stores/appStore";
import { useAltKeyHeld } from "../hooks/useAltKeyHeld";
import { useBrushSizeHint } from "../hooks/useBrushSizeHint";
import { useImageFileDrop } from "../hooks/useImageFileDrop";
import { useMousePositionOverlay } from "../hooks/useMousePositionOverlay";
import { useWorkspaceRegion } from "../hooks/useWorkspaceRegion";
import { useColorEditStore } from "../stores/colorEditStore";
import { useColorVariationAnalysisStore } from "../stores/colorVariationAnalysisStore";
import { useComfyUiStore } from "../stores/comfyUiStore";
import { usePixelRestoreStore } from "../stores/pixelRestoreStore";
import { useWorldStore } from "../stores/worldStore";
import { toast } from "../stores/toastStore";
import type { DropPointerPosition } from "../hooks/useImageFileDrop";
import { WorkspaceRegionBorder } from "./WorkspaceRegionBorder";
import { focusCanvasKeyboard } from "../utils/canvasKeyboardFocus";
import { isTextEntryElement } from "../utils/editableFocus";
import { CanvasBoundsLabel } from "./CanvasBoundsLabel";
import { CanvasBrushSizeHint } from "./CanvasBrushSizeHint";
import { CanvasMousePositionHint } from "./CanvasMousePositionHint";
import { CanvasMousePositionGridHighlight } from "./CanvasMousePositionGridHighlight";
import { ContextMenu } from "./ContextMenu";
import { FloatingColorPickerPanel } from "./color-picker/FloatingColorPickerPanel";
import { NavigatorPanel } from "./NavigatorPanel";
import { ComfyAppFloatingRunner } from "./comfyui/ComfyAppFloatingRunner";
import { ReferenceCropModal } from "./ReferenceCropModal";
import { ReferenceLayerOverlay } from "./ReferenceLayerOverlay";
import { CanvasSizeToolOverlay } from "./CanvasSizeToolOverlay";
import { CanvasBoardToolOverlay } from "./CanvasBoardToolOverlay";
import { ImageDropOverlay } from "./pluginPage/ImageDropOverlay";

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

interface CanvasPointerModifiers {
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  spaceKey: boolean;
}

interface AltPickSession {
  point: Point;
  button: DrawingButton;
  dragStarted: boolean;
}

function canvasModifiersFromMouseEvent(
  e: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean },
  spaceKey: boolean,
): CanvasPointerModifiers {
  return {
    shiftKey: e.shiftKey,
    altKey: e.altKey,
    ctrlKey: e.ctrlKey,
    spaceKey,
  };
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

function clientToPixelFloat(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  zoom: number,
): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / zoom,
    y: (clientY - rect.top) / zoom,
  };
}

const SYMMETRY_HIT_SCREEN_PX = 6;

export function CanvasView() {
  const { regionProps: canvasRegionProps, isActive: canvasRegionActive } =
    useWorkspaceRegion("canvas");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const boardBackgroundRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const oklchRendererRef = useRef<OklchDisplayGlRenderer | null>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pixelGridOffscreenRef = useRef<HTMLCanvasElement | null>(null);
  const floatOffscreenRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRenderFrameRef = useRef<number | null>(null);
  const isPanningRef = useRef(false);
  const mousePositionOverlaySuppressedRef = useRef(false);
  const lastPanRef = useRef({ x: 0, y: 0 });
  const zoomAnchorRef = useRef<ZoomAnchor | null>(null);
  const centeredProjectIdRef = useRef<string | null>(null);
  const prevStageLayoutRef = useRef<WorkspaceStageLayout | null>(null);
  const prevBoardLayoutRef = useRef<BoardLayout | null>(null);
  const stageLayoutRef = useRef<WorkspaceStageLayout | null>(null);

  const project = useAppStore((s) => s.project);
  const activeCanvas = useMemo(
    () => (project ? getActiveCanvas(project) : null),
    [project],
  );
  const referenceLayerCount = project?.referenceLayers.length ?? 0;
  const zoom = useAppStore((s) => s.zoom);
  const zoomRef = useRef(zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const fitActiveCanvasNonce = useAppStore((s) => s.fitActiveCanvasNonce);
  const pendingFitActiveCanvasRef = useRef<{ zoom: number } | null>(null);
  const processedFitActiveCanvasNonceRef = useRef(0);
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
  const getCompositeGridForRender = useAppStore((s) => s.getCompositeGridForRender);
  const canvasRenderNonce = useAppStore((s) => s.canvasRenderNonce);
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
  const setActiveCanvas = useAppStore((s) => s.setActiveCanvas);
  const setViewportContainer = useAppStore((s) => s.setViewportContainer);
  const syncViewportSnapshot = useAppStore((s) => s.syncViewportSnapshot);
  const adaptFloatingPanelsToViewport = useAppStore((s) => s.adaptFloatingPanelsToViewport);
  const mousePositionOverlayVisible = useAppStore((s) => s.mousePositionOverlayVisible);
  const canvasDisplayMode = useAppStore((s) => s.canvasDisplayMode);
  const appSettings = useAppStore((s) => s.appSettings);
  const setActiveReferenceLayer = useAppStore((s) => s.setActiveReferenceLayer);
  const openCropEditor = useAppStore((s) => s.openCropEditor);
  const toggleReferenceGrid = useAppStore((s) => s.toggleReferenceGrid);
  const importImageToReferenceLayer = useAppStore((s) => s.importImageToReferenceLayer);
  const importDroppedImageAtCanvasPoint = useAppStore((s) => s.importDroppedImageAtCanvasPoint);
  const importDroppedImageAtBoardPoint = useAppStore((s) => s.importDroppedImageAtBoardPoint);
  const importReferenceLayerColors = useAppStore((s) => s.importReferenceLayerColors);
  const selectAllCanvas = useAppStore((s) => s.selectAllCanvas);
  const deselectCanvas = useAppStore((s) => s.deselectCanvas);
  const invertCanvasSelection = useAppStore((s) => s.invertCanvasSelection);
  const copySelection = useAppStore((s) => s.copySelection);
  const cutSelection = useAppStore((s) => s.cutSelection);
  const pasteSelection = useAppStore((s) => s.pasteSelection);
  const clearSelectionContent = useAppStore((s) => s.clearSelectionContent);
  const commitSelection = useAppStore((s) => s.commitSelection);
  const cancelSelection = useAppStore((s) => s.cancelSelection);
  const sendSelectionColorsToColorVariationAnalysis = useAppStore(
    (s) => s.sendSelectionColorsToColorVariationAnalysis,
  );
  const symmetry = useAppStore((s) => s.symmetry);
  const symmetryAxisDrag = useAppStore((s) => s.symmetryAxisDrag);
  const beginSymmetryAxisDrag = useAppStore((s) => s.beginSymmetryAxisDrag);
  const endSymmetryAxisDrag = useAppStore((s) => s.endSymmetryAxisDrag);
  const setSymmetryOrigin = useAppStore((s) => s.setSymmetryOrigin);
  const activePatternBrushGrid = useAppStore((s) =>
    s.activePatternBrushId
      ? (s.patternBrushPixelsCache[s.activePatternBrushId] ?? null)
      : null,
  );
  const patternBrushAnchorForegroundColor = useAppStore(
    (s) => s.patternBrushAnchorForegroundColor,
  );
  const tileSession = useAppStore((s) => s.tileSession);
  const tilePreviewRect = useAppStore((s) => s.tilePreviewRect);

  const [isPanning, setIsPanning] = useState(false);
  const altHeld = useAltKeyHeld();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hoverPoint, setHoverPoint] = useState<CanvasPoint | null>(null);
  const [referenceContextMenu, setReferenceContextMenu] = useState<{
    layerId: string;
    x: number;
    y: number;
  } | null>(null);
  const [selectionContextMenu, setSelectionContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [shiftKeyHeld, setShiftKeyHeld] = useState(false);
  const [altKeyHeld, setAltKeyHeld] = useState(false);
  const [altPickPending, setAltPickPending] = useState(false);
  const altPickSessionRef = useRef<AltPickSession | null>(null);
  const [spaceKeyHeld, setSpaceKeyHeld] = useState(false);
  const [symmetryAxisHover, setSymmetryAxisHover] = useState<"horizontal" | "vertical" | null>(null);
  const [transformHandleHover, setTransformHandleHover] = useState<TransformHandle | null>(null);
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
    return getCompositeGridForRender();
  }, [project, getCompositeGridForRender, selection, canvasRenderNonce]);

  const displayWidth = composite ? composite.width * zoom : 0;
  const displayHeight = composite ? composite.height * zoom : 0;

  const isAssetCaptureDragging = assetCapturePhase === "dragging";
  const isAssetCaptureAdjusting = assetCapturePhase === "adjusting";
  const isAssetCaptureActive = assetCapturePhase !== "idle";

  const isRepeatTileCreating = tileSession.phase === "creating";
  const isRepeatTileDrawing = tileSession.phase === "drawing";
  const isRepeatTilePointerActive =
    isRepeatTileCreating || (isRepeatTileDrawing && isDrawing && isDrawingToolType(activeTool));

  const boundsLabelRect = useMemo(() => {
    if (
      isRepeatTileCreating &&
      tilePreviewRect &&
      tilePreviewRect.width > 0 &&
      tilePreviewRect.height > 0
    ) {
      return tilePreviewRect;
    }
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
      return shapeDragPreviewRect(drawStart, lastPoint, toolSettings.shapeMode, {
        altKey: altKeyHeld,
      });
    }
    return null;
  }, [
    isRepeatTileCreating,
    tilePreviewRect,
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
    altKeyHeld,
  ]);

  const layoutContainerWidth =
    containerSize.width > 0
      ? containerSize.width
      : WORKSPACE_CONTAINER_FALLBACK_WIDTH;
  const layoutContainerHeight =
    containerSize.height > 0
      ? containerSize.height
      : WORKSPACE_CONTAINER_FALLBACK_HEIGHT;

  const activeReferenceLayerId = project?.activeReferenceLayerId ?? null;

  const referenceLayers = useMemo(() => {
    return project?.referenceLayers ?? [];
  }, [project?.referenceLayers]);

  const closeReferenceContextMenu = useCallback(() => {
    setReferenceContextMenu(null);
  }, []);

  const closeSelectionContextMenu = useCallback(() => {
    setSelectionContextMenu(null);
  }, []);

  const openReferenceContextMenu = useCallback(
    (layerId: string, clientX: number, clientY: number) => {
      closeSelectionContextMenu();
      setActiveReferenceLayer(layerId);
      setReferenceContextMenu({ layerId, x: clientX, y: clientY });
    },
    [closeSelectionContextMenu, setActiveReferenceLayer],
  );

  const openSelectionContextMenu = useCallback(
    (clientX: number, clientY: number) => {
      closeReferenceContextMenu();
      setSelectionContextMenu({ x: clientX, y: clientY });
    },
    [closeReferenceContextMenu],
  );

  const referenceContextMenuLayer = useMemo(() => {
    if (!referenceContextMenu || !project) return null;
    const layer = project.referenceLayers.find(
      (entry) => entry.id === referenceContextMenu.layerId,
    );
    return layer ?? null;
  }, [referenceContextMenu, project]);

  const referenceContextMenuItems = useMemo(() => {
    if (!referenceContextMenuLayer) return [];
    return buildReferenceLayerContextMenuItems(referenceContextMenuLayer, {
      openCropEditor,
      toggleReferenceGrid,
      importImageToReferenceLayer: (layerId) => {
        void importImageToReferenceLayer(layerId);
      },
      importReferenceLayerColors: (layerId, scope) => {
        void importReferenceLayerColors(layerId, scope);
      },
    });
  }, [
    referenceContextMenuLayer,
    openCropEditor,
    toggleReferenceGrid,
    importImageToReferenceLayer,
    importReferenceLayerColors,
  ]);

  const hasCanvasSelection =
    selection !== null && !isSelectionEmpty(selection);
  const hasFloatingSelection = selection?.floating != null;

  const selectionContextMenuItems = useMemo(() => {
    if (!project) return [];
    return buildSelectionContextMenuItems(
      {
        hasSelection: hasCanvasSelection,
        hasFloatingSelection,
      },
      {
        selectAll: selectAllCanvas,
        deselect: deselectCanvas,
        invertSelection: invertCanvasSelection,
        copySelection: () => void copySelection(),
        cutSelection: () => void cutSelection(),
        pasteSelection: () => void pasteSelection(),
        clearSelectionContent,
        commitSelection,
        cancelSelection,
        sendSelectionColorsToAnalysis: sendSelectionColorsToColorVariationAnalysis,
      },
    );
  }, [
    project,
    hasCanvasSelection,
    hasFloatingSelection,
    selectAllCanvas,
    deselectCanvas,
    invertCanvasSelection,
    copySelection,
    cutSelection,
    pasteSelection,
    clearSelectionContent,
    commitSelection,
    cancelSelection,
    sendSelectionColorsToColorVariationAnalysis,
  ]);

  const overlayZIndex = 2;

  const boardLayout = useMemo(() => {
    if (!project) return null;
    return computeBoardLayout(
      layoutContainerWidth,
      layoutContainerHeight,
      project.board.canvases,
      zoom,
      project.referenceLayers,
    );
  }, [project?.board.canvases, project?.referenceLayers, layoutContainerWidth, layoutContainerHeight, zoom]);

  const activeCanvasLayout = useMemo(() => {
    if (!boardLayout || !project) return null;
    return (
      boardLayout.canvases.find((layout) => layout.canvasId === project.board.activeCanvasId) ??
      boardLayout.canvases[0] ??
      null
    );
  }, [boardLayout, project?.board.activeCanvasId]);

  const pixelRestoreOpen = usePixelRestoreStore((s) => s.open);
  const colorEditOpen = useColorEditStore((s) => s.open);
  const colorVariationOpen = useColorVariationAnalysisStore((s) => s.open);
  const worldOpen = useWorldStore((s) => s.open);
  const comfyUiOpen = useComfyUiStore((s) => s.open);

  const imageDropEnabled =
    !!project &&
    !isAssetCaptureActive &&
    !pixelRestoreOpen &&
    !colorEditOpen &&
    !colorVariationOpen &&
    !worldOpen &&
    !comfyUiOpen;

  const resolveStagePointFromClient = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    return {
      stageX: container.scrollLeft + (clientX - rect.left),
      stageY: container.scrollTop + (clientY - rect.top),
    };
  }, []);

  const [imageDropAsReference, setImageDropAsReference] = useState(false);

  const handleCanvasImageDrop = useCallback(
    (source: { file: File } | { path: string }, position?: DropPointerPosition) => {
      if (!position || !boardLayout) return;
      const stagePoint = resolveStagePointFromClient(position.clientX, position.clientY);
      if (!stagePoint) return;
      const target = resolveCanvasDropTarget(
        boardLayout,
        stagePoint.stageX,
        stagePoint.stageY,
        zoom,
      );
      if (!target) {
        if (position.ctrlKey) {
          toast.info("请将图片拖放到画板上");
          return;
        }
        const boardPoint = stagePointToBoardPoint(
          boardLayout,
          stagePoint.stageX,
          stagePoint.stageY,
          zoom,
        );
        void importDroppedImageAtBoardPoint(source, boardPoint);
        return;
      }
      void importDroppedImageAtCanvasPoint(
        source,
        target.canvasId,
        target.canvasPoint,
        position.ctrlKey ?? false,
      );
    },
    [boardLayout, zoom, resolveStagePointFromClient, importDroppedImageAtCanvasPoint, importDroppedImageAtBoardPoint],
  );

  const { isDraggingOver: isImageDraggingOver, dropZoneProps } = useImageFileDrop({
    enabled: imageDropEnabled,
    disabled: isCapturing,
    onImportPath: (path, position) => {
      handleCanvasImageDrop({ path }, position);
    },
    onImportFile: (file, position) => {
      handleCanvasImageDrop({ file }, position);
    },
  });

  useEffect(() => {
    if (!isImageDraggingOver) {
      setImageDropAsReference(false);
      return;
    }

    const syncCtrl = (event: KeyboardEvent) => {
      setImageDropAsReference(event.ctrlKey);
    };

    window.addEventListener("keydown", syncCtrl);
    window.addEventListener("keyup", syncCtrl);
    return () => {
      window.removeEventListener("keydown", syncCtrl);
      window.removeEventListener("keyup", syncCtrl);
    };
  }, [isImageDraggingOver]);

  const hasMultipleCanvases = (project?.board.canvases.length ?? 0) > 1;

  const boardContentBounds = useMemo(
    () =>
      boardLayout && project
        ? computeBoardContentBounds(boardLayout, project.referenceLayers, zoom)
        : null,
    [boardLayout, project?.referenceLayers, zoom],
  );

  const canvasCompositeDisplayRect = useMemo(
    () =>
      boardLayout && boardContentBounds
        ? computeCanvasCompositeDisplayRect(boardLayout, boardContentBounds, zoom)
        : null,
    [boardLayout, boardContentBounds, zoom],
  );

  const syncBoardViewport = useCallback(
    (canvasEl?: HTMLCanvasElement | null) => {
      syncViewportSnapshot({
        canvasEl,
        boardContent: boardContentBounds ?? undefined,
        pixelGridRect: canvasCompositeDisplayRect ?? undefined,
      });
    },
    [syncViewportSnapshot, boardContentBounds, canvasCompositeDisplayRect],
  );

  const stageLayout = useMemo(() => {
    if (!boardLayout) return null;
    return boardLayoutToWorkspaceStage(boardLayout);
  }, [boardLayout]);

  const activeCanvasLeft = activeCanvasLayout?.left ?? 0;
  const activeCanvasTop = activeCanvasLayout?.top ?? 0;
  const boardOriginLeft = boardLayout ? boardRenderOrigin(boardLayout).left : 0;
  const boardOriginTop = boardLayout ? boardRenderOrigin(boardLayout).top : 0;

  const activeCanvasStageLayout = useMemo(() => {
    if (!stageLayout) return null;
    return {
      ...stageLayout,
      canvasLeft: activeCanvasLeft,
      canvasTop: activeCanvasTop,
    };
  }, [stageLayout, activeCanvasLeft, activeCanvasTop]);

  stageLayoutRef.current = stageLayout;
  const activeCanvasStageLayoutRef = useRef(activeCanvasStageLayout);
  activeCanvasStageLayoutRef.current = activeCanvasStageLayout;

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

    const orthographicAngle = resolveOrthographicAngle(project.orthographicView);
    const primarySpanY = computeForeshortenedSpan(project.grid.primary, orthographicAngle);
    const secondarySpanY = computeForeshortenedSecondarySpan(
      project.grid.primary,
      project.grid.secondary,
      orthographicAngle,
    );
    const checkerboardTileHeight = computeForeshortenedSpan(
      appSettings.checkerboardTileSize,
      orthographicAngle,
    );

    renderTransparencyCheckerboard(ctx, composite.width, composite.height, zoom, {
      tileSize: appSettings.checkerboardTileSize,
      tileHeight: checkerboardTileHeight,
      lightColor: appSettings.checkerboardLightHex,
      darkColor: appSettings.checkerboardDarkHex,
    });

    if (!pixelGridOffscreenRef.current) {
      pixelGridOffscreenRef.current = document.createElement("canvas");
    }
    const offscreen = pixelGridOffscreenRef.current;
    if (offscreen.width !== composite.width || offscreen.height !== composite.height) {
      offscreen.width = composite.width;
      offscreen.height = composite.height;
    }
    const offCtx = offscreen.getContext("2d");
    if (!offCtx) return;

    const renderer = oklchRendererRef.current;
    const glCanvas = glCanvasRef.current;

    if (canvasDisplayMode === "oklchLightness" && renderer && glCanvas) {
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

      if (canvasDisplayMode === "oklchLightness" && renderer && glCanvas) {
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
        if (!floatOffscreenRef.current) {
          floatOffscreenRef.current = document.createElement("canvas");
        }
        const floatCanvas = floatOffscreenRef.current;
        if (floatCanvas.width !== pixels.width || floatCanvas.height !== pixels.height) {
          floatCanvas.width = pixels.width;
          floatCanvas.height = pixels.height;
        }
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
          {
            primary,
            secondary,
            primarySpanY,
            secondarySpanY,
            colorRgb: gridColorRgbString(appSettings.gridColorHex),
            lineWidth: appSettings.gridLineWidth,
            subGridEnabled: appSettings.subGridEnabled,
          },
        );
      }
    } else if (gridCanvas) {
      const gridCtx = gridCanvas.getContext("2d");
      gridCtx?.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    }
  }, [project, composite, displayWidth, displayHeight, zoom, selection, canvasDisplayMode, appSettings]);

  const renderBoardBackground = useCallback(() => {
    const boardCanvas = boardBackgroundRef.current;
    if (!boardCanvas || !project || !boardLayout || !stageLayout) return;

    boardCanvas.width = stageLayout.stageWidth;
    boardCanvas.height = stageLayout.stageHeight;
    boardCanvas.style.width = `${stageLayout.stageWidth}px`;
    boardCanvas.style.height = `${stageLayout.stageHeight}px`;

    const ctx = boardCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, stageLayout.stageWidth, stageLayout.stageHeight);
    ctx.imageSmoothingEnabled = false;

    const orthographicAngle = resolveOrthographicAngle(project.orthographicView);
    const checkerboardTileHeight = computeForeshortenedSpan(
      appSettings.checkerboardTileSize,
      orthographicAngle,
    );
    const renderer = oklchRendererRef.current;
    const glCanvas = glCanvasRef.current;
    const activeCanvasId = project.board.activeCanvasId;

    for (const layout of boardLayout.canvases) {
      if (layout.canvasId === activeCanvasId) continue;

      const canvasComposite = getProjectCompositeGrid(project, layout.canvasId);
      const { width, height } = canvasComposite;

      ctx.save();
      ctx.translate(layout.left, layout.top);

      renderTransparencyCheckerboard(
        ctx,
        width,
        height,
        zoom,
        {
          tileSize: appSettings.checkerboardTileSize,
          tileHeight: checkerboardTileHeight,
          lightColor: appSettings.checkerboardLightHex,
          darkColor: appSettings.checkerboardDarkHex,
        },
      );

      if (canvasDisplayMode === "oklchLightness" && renderer && glCanvas) {
        const imageData = new ImageData(canvasComposite.toRgba(), width, height);
        blitWithDisplayMode(
          renderer,
          glCanvas,
          imageData,
          width,
          height,
          canvasDisplayMode,
        );
        ctx.drawImage(glCanvas, 0, 0, layout.displayWidth, layout.displayHeight);
      } else {
        const offscreen = document.createElement("canvas");
        offscreen.width = width;
        offscreen.height = height;
        const offCtx = offscreen.getContext("2d");
        if (!offCtx) {
          ctx.restore();
          continue;
        }
        renderPixelGrid1x(offCtx, canvasComposite);
        ctx.drawImage(offscreen, 0, 0, layout.displayWidth, layout.displayHeight);
      }
      ctx.restore();
    }
  }, [project, boardLayout, stageLayout, zoom, canvasDisplayMode, appSettings]);

  const brushPreview = useMemo(() => {
    if (activeTool !== "brush" && activeTool !== "eraser") return null;
    if (activeTool === "brush") {
      return {
        size: toolSettings.brushSize,
        shape: toolSettings.brushShape,
        isPattern: toolSettings.brushShape === "pattern",
        patternScale: toolSettings.patternBrushScale,
      };
    }
    return {
      size: toolSettings.eraserSize,
      shape: toolSettings.eraserShape,
      isPattern: false,
      patternScale: 100,
    };
  }, [activeTool, toolSettings]);

  const patternBrushGrid = brushPreview?.isPattern ? activePatternBrushGrid : null;

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

    const tileCreatePreviewRect =
      isRepeatTileCreating &&
      tilePreviewRect &&
      tilePreviewRect.width > 0 &&
      tilePreviewRect.height > 0
        ? tilePreviewRect
        : null;

    const showTileRegionOverlay =
      (isRepeatTileDrawing &&
        tileSession.region.width > 0 &&
        tileSession.region.height > 0) ||
      (isRepeatTileCreating && tileCreatePreviewRect !== null);

    renderSelectionOverlay(ctx, {
      selection:
        capturePreviewRect || showTileRegionOverlay || selectionDrag?.mode === "layerPosition"
          ? null
          : selection,
      previewRect: capturePreviewRect ?? (showTileRegionOverlay ? null : selectionPreviewRect),
      lassoPoints,
      phase: marchPhase,
      zoom,
      canvasWidth: composite.width,
      canvasHeight: composite.height,
    });

    if (showTileRegionOverlay) {
      renderTileOverlay(
        ctx,
        isRepeatTileDrawing ? tileSession.region : tileCreatePreviewRect!,
        zoom,
      );
    }

    if (activeTool === "transform" && selection && selectionDrag?.mode !== "layerPosition") {
      renderTransformHandles(ctx, { selection, zoom, phase: marchPhase });
    }

      renderSymmetryAxis(ctx, {
      config: symmetry,
      zoom,
      canvasWidth: composite.width,
      canvasHeight: composite.height,
      style: {
        visible: appSettings.symmetryAxisVisible,
        colorHex: appSettings.symmetryAxisColorHex,
        lineWidth: appSettings.symmetryAxisLineWidth,
        outlineEnabled: appSettings.symmetryAxisOutlineEnabled,
      },
    });

    const applyForegroundTint =
      patternBrushAnchorForegroundColor !== null &&
      rgbKey(foregroundColor) !== rgbKey(patternBrushAnchorForegroundColor);

    const renderStampPreviewAt = (center: Point) => {
      if (brushPreview!.isPattern && patternBrushGrid) {
        renderPatternBrushPreview(
          ctx,
          center,
          patternBrushGrid,
          brushPreview!.patternScale,
          foregroundColor,
          applyForegroundTint,
          zoom,
          { width: composite.width, height: composite.height },
        );
        return;
      }
      renderBrushStampPreview(
        ctx,
        center,
        brushPreview!.size,
        brushPreview!.shape,
        activeTool === "brush" ? foregroundColor : null,
        zoom,
        { width: composite.width, height: composite.height },
      );
    };

    if (brushPreview && hoverPoint && !isPanning && !isAssetCaptureActive) {
      if (
        activeTool === "brush" &&
        !brushPreview.isPattern &&
        shiftKeyHeld &&
        brushLineAnchor &&
        (brushLineAnchor.x !== hoverPoint.x || brushLineAnchor.y !== hoverPoint.y)
      ) {
        const drawLinePreview = (from: Point, to: Point) => {
          renderBrushLinePreview(
            ctx,
            from,
            to,
            { brushSize: brushPreview.size, brushShape: brushPreview.shape },
            foregroundColor,
            zoom,
            { width: composite.width, height: composite.height },
          );
        };

        if (isSymmetryActive(symmetry)) {
          forEachSymmetricTransform(symmetry, (transform) => {
            drawLinePreview(transform(brushLineAnchor), transform(hoverPoint));
          });
        } else {
          drawLinePreview(brushLineAnchor, hoverPoint);
        }
      }

      if (isSymmetryActive(symmetry)) {
        forEachSymmetricTransform(symmetry, (transform) => {
          renderStampPreviewAt(transform(hoverPoint));
        });
      } else {
        renderStampPreviewAt(hoverPoint);
      }
    }
  }, [
    activeTool,
    assetCaptureRect,
    brushLineAnchor,
    brushPreview,
    patternBrushGrid,
    patternBrushAnchorForegroundColor,
    composite,
    displayWidth,
    displayHeight,
    foregroundColor,
    hoverPoint,
    isAssetCaptureActive,
    isPanning,
    isRepeatTileCreating,
    isRepeatTileDrawing,
    tilePreviewRect,
    lassoPoints,
    marchPhase,
    selection,
    selectionDrag,
    selectionPreviewRect,
    tileSession,
    shiftKeyHeld,
    symmetry,
    appSettings.symmetryAxisVisible,
    appSettings.symmetryAxisColorHex,
    appSettings.symmetryAxisLineWidth,
    appSettings.symmetryAxisOutlineEnabled,
    zoom,
  ]);

  const resolveSymmetryHitAtClient = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !isSymmetryActive(symmetry)) return null;
      const floatPoint = clientToPixelFloat(clientX, clientY, canvas, zoom);
      const threshold = SYMMETRY_HIT_SCREEN_PX / zoom;
      return hitTestSymmetryAxis(floatPoint.x, floatPoint.y, symmetry, threshold);
    },
    [symmetry, zoom],
  );

  const resolveTransformHandleAtClient = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (
        activeTool !== "transform" ||
        !canvas ||
        !selection ||
        isSelectionEmpty(selection)
      ) {
        return null;
      }
      const floatPoint = clientToPixelFloat(clientX, clientY, canvas, zoom);
      return hitTestTransformHandle(floatPoint, selection, zoom);
    },
    [activeTool, selection, zoom],
  );

  const activeSymmetryAxisInteraction = symmetryAxisDrag ?? symmetryAxisHover;

  const symmetryCursorClass =
    activeSymmetryAxisInteraction === "horizontal"
      ? " cursor-col-resize"
      : activeSymmetryAxisInteraction === "vertical"
        ? " cursor-row-resize"
        : "";

  const activeTransformHandleInteraction =
    selectionDrag?.mode === "transform"
      ? (selectionDrag.transformHandle ?? null)
      : transformHandleHover;
  const transformCursor =
    activeTool === "transform" && activeTransformHandleInteraction
      ? getTransformHandleCursor(activeTransformHandleInteraction)
      : undefined;
  const transformCursorStyle =
    !isPanning &&
    !isAssetCaptureActive &&
    !(altHeld && activeTool !== "select" && !isDrawing) &&
    transformCursor
      ? transformCursor
      : undefined;

  const showEyedropperCursor =
    (altHeld || altPickPending) && activeTool !== "select" && !isDrawing;

  useEffect(() => {
    if (activeTool === "shape" && isDrawing) return;
    setAltKeyHeld(altHeld);
  }, [altHeld, activeTool, isDrawing]);

  const clearAltPickSession = useCallback(() => {
    altPickSessionRef.current = null;
    setAltPickPending(false);
  }, []);

  const beginAltPickSession = useCallback((point: Point, button: DrawingButton) => {
    altPickSessionRef.current = { point, button, dragStarted: false };
    setAltPickPending(true);
  }, []);

  const finishAltPickOnRelease = useCallback((): boolean => {
    const session = altPickSessionRef.current;
    if (!session) return false;
    altPickSessionRef.current = null;
    setAltPickPending(false);
    if (!session.dragStarted) {
      void pickColorAt(session.point, colorSlotFromDrawingButton(session.button));
      return true;
    }
    return false;
  }, [pickColorAt]);

  /** 画笔等绘制工具：Alt+点击未拖拽时在同位置取色（无需移动鼠标激活吸管）。 */
  const isAltSamePositionPickTool = useCallback((tool: typeof activeTool): boolean => {
    return isDrawingToolType(tool) && tool !== "shape";
  }, []);

  const tryStartAltPickDrag = useCallback(
    (point: Point, modifiers: CanvasPointerModifiers): boolean => {
      const session = altPickSessionRef.current;
      if (!session || session.dragStarted) return false;
      if (point.x === session.point.x && point.y === session.point.y) return false;

      const tool = useAppStore.getState().activeTool;
      if (isAltSamePositionPickTool(tool)) {
        return false;
      }

      altPickSessionRef.current = { ...session, dragStarted: true };
      setAltPickPending(false);
      pointerDown(session.point, session.button, modifiers);
      pointerMove(point, session.button, modifiers);
      if (tool === "shape") {
        setAltKeyHeld(modifiers.altKey);
      }
      return true;
    },
    [pointerDown, pointerMove, isAltSamePositionPickTool],
  );

  const preventSpaceScroll = useCallback((e: KeyboardEvent | React.KeyboardEvent) => {
    if (isTextEntryElement(document.activeElement)) return;
    if (e.code !== "Space") return;
    e.preventDefault();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isSymmetryActive(symmetry)) {
      setSymmetryAxisHover(null);
      return;
    }

    const handleMove = (e: MouseEvent) => {
      if (isPanningRef.current || useAppStore.getState().symmetryAxisDrag) return;
      setSymmetryAxisHover(resolveSymmetryHitAtClient(e.clientX, e.clientY));
    };

    const handleLeave = () => setSymmetryAxisHover(null);

    container.addEventListener("mousemove", handleMove);
    container.addEventListener("mouseleave", handleLeave);
    return () => {
      container.removeEventListener("mousemove", handleMove);
      container.removeEventListener("mouseleave", handleLeave);
    };
  }, [symmetry, resolveSymmetryHitAtClient]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || activeTool !== "transform" || !selection) {
      setTransformHandleHover(null);
      return;
    }

    const handleMove = (e: MouseEvent) => {
      if (isPanningRef.current || useAppStore.getState().selectionDrag?.mode === "transform") {
        return;
      }
      setTransformHandleHover(resolveTransformHandleAtClient(e.clientX, e.clientY));
    };

    const handleLeave = () => setTransformHandleHover(null);

    container.addEventListener("mousemove", handleMove);
    container.addEventListener("mouseleave", handleLeave);
    return () => {
      container.removeEventListener("mousemove", handleMove);
      container.removeEventListener("mouseleave", handleLeave);
    };
  }, [activeTool, selection, resolveTransformHandleAtClient]);

  useEffect(() => {
    if (activeTool !== "transform") {
      setTransformHandleHover(null);
    }
  }, [activeTool]);

  useEffect(() => {
    if (!symmetryAxisDrag) return;
    setSymmetryAxisHover(symmetryAxisDrag);
  }, [symmetryAxisDrag]);

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
      if (e.key === "Alt") setAltKeyHeld(true);
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
        ctrlKey: e.ctrlKey,
        spaceKey: true,
      });
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (isTextEntryElement(document.activeElement)) return;

      if (e.key === "Shift") setShiftKeyHeld(false);
      if (e.key === "Alt") setAltKeyHeld(false);
      if (e.code !== "Space") return;

      e.preventDefault();
      setSpaceKeyHeld(false);

      const {
        selectionDrag: drag,
        activeTool: tool,
        drawingButton: button,
      } = useAppStore.getState();
      if (tool !== "select" || !drag?.createOffset || button === null) {
        return;
      }

      pointerMove(drag.current, button, {
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        spaceKey: false,
      });
    };
    const handleBlur = () => {
      setShiftKeyHeld(false);
      setAltKeyHeld(false);
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
    oklchRendererRef.current = new OklchDisplayGlRenderer();
    glCanvasRef.current = document.createElement("canvas");
    return () => {
      oklchRendererRef.current?.dispose();
      oklchRendererRef.current = null;
      glCanvasRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (canvasRenderFrameRef.current !== null) {
      cancelAnimationFrame(canvasRenderFrameRef.current);
    }
    canvasRenderFrameRef.current = requestAnimationFrame(() => {
      canvasRenderFrameRef.current = null;
      renderCanvas();
    });
    return () => {
      if (canvasRenderFrameRef.current !== null) {
        cancelAnimationFrame(canvasRenderFrameRef.current);
        canvasRenderFrameRef.current = null;
      }
    };
  }, [renderCanvas, canvasRenderNonce]);

  useLayoutEffect(() => {
    renderBoardBackground();
  }, [renderBoardBackground]);

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
      syncBoardViewport();
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
      syncBoardViewport();
      adaptFloatingPanelsToViewport();
    });

    container.addEventListener("scroll", handleScroll, { passive: true });
    resizeObserver.observe(container);
    syncBoardViewport();
    adaptFloatingPanelsToViewport();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
      setViewportContainer(null);
    };
  }, [project, setViewportContainer, syncBoardViewport, adaptFloatingPanelsToViewport]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !project || !boardLayout) return;
    if (centeredProjectIdRef.current === project.id) return;

    const { scrollLeft, scrollTop } = computeBoardInitialScrollPosition(
      boardLayout,
      layoutContainerWidth,
      layoutContainerHeight,
      project.referenceLayers,
      zoom,
    );

    container.scrollLeft = scrollLeft;
    container.scrollTop = scrollTop;
    centeredProjectIdRef.current = project.id;
    prevStageLayoutRef.current = stageLayout;
    syncBoardViewport();
  }, [
    project?.id,
    project?.referenceLayers,
    boardLayout,
    stageLayout,
    layoutContainerWidth,
    layoutContainerHeight,
    zoom,
    syncBoardViewport,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const prevBoard = prevBoardLayoutRef.current;
    if (!container || !boardLayout) return;
    if (zoomAnchorRef.current) {
      prevBoardLayoutRef.current = boardLayout;
      return;
    }

    if (prevBoard) {
      const deltaX = boardLayout.contentShiftX - prevBoard.contentShiftX;
      const deltaY = boardLayout.contentShiftY - prevBoard.contentShiftY;
      if (deltaX !== 0 || deltaY !== 0) {
        container.scrollLeft += deltaX;
        container.scrollTop += deltaY;
      }
    }

    prevBoardLayoutRef.current = boardLayout;
  }, [boardLayout]);

  useLayoutEffect(() => {
    if (fitActiveCanvasNonce === processedFitActiveCanvasNonceRef.current) return;
    processedFitActiveCanvasNonceRef.current = fitActiveCanvasNonce;

    const container = containerRef.current;
    if (!container || !project) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    if (containerWidth <= 0 || containerHeight <= 0) return;

    const plan = fitActiveCanvasInViewport(project, containerWidth, containerHeight);
    if (!plan) return;

    zoomAnchorRef.current = null;
    pendingFitActiveCanvasRef.current = { zoom: plan.zoom };
    setZoom(plan.zoom);
  }, [fitActiveCanvasNonce, project, setZoom]);

  useLayoutEffect(() => {
    const pendingFit = pendingFitActiveCanvasRef.current;
    const container = containerRef.current;
    if (!pendingFit || !container || !project || !boardLayout || !activeCanvasLayout) return;
    if (zoom !== pendingFit.zoom) return;

    const scroll = computeActiveCanvasCenterScroll(
      activeCanvasLayout,
      layoutContainerWidth,
      layoutContainerHeight,
      boardLayout,
    );
    container.scrollLeft = scroll.scrollLeft;
    container.scrollTop = scroll.scrollTop;
    pendingFitActiveCanvasRef.current = null;
    prevStageLayoutRef.current = stageLayout;
    syncBoardViewport(canvasRef.current);
  }, [
    zoom,
    boardLayout,
    activeCanvasLayout,
    layoutContainerWidth,
    layoutContainerHeight,
    project,
    stageLayout,
    syncBoardViewport,
  ]);

  useLayoutEffect(() => {
    const anchor = zoomAnchorRef.current;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!anchor || !container || !canvas || !activeCanvasStageLayout) return;

    zoomAnchorRef.current = null;
    mousePositionOverlaySuppressedRef.current = false;

    const containerRect = container.getBoundingClientRect();
    const { scrollLeft, scrollTop } = computeScrollPositionForZoomAtPoint(
      anchor.logicalPoint,
      zoom,
      activeCanvasStageLayout,
      containerRect.left,
      containerRect.top,
      anchor.clientX,
      anchor.clientY,
    );
    container.scrollLeft = scrollLeft;
    container.scrollTop = scrollTop;
    prevStageLayoutRef.current = stageLayout;
    syncBoardViewport(canvas);
  }, [zoom, activeCanvasStageLayout, syncBoardViewport]);

  useLayoutEffect(() => {
    syncBoardViewport(canvasRef.current);
  }, [zoom, renderCanvas, boardContentBounds, syncBoardViewport]);

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
          if (tool === "brush" && settings.brushShape === "pattern") {
            const currentScale = settings.patternBrushScale;
            const newScale = Math.max(0, Math.min(500, currentScale + delta * 5));
            if (newScale !== currentScale) {
              setToolSettings({ patternBrushScale: newScale });
            }
            return;
          }
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

      const currentStageLayout = activeCanvasStageLayoutRef.current;
      if (!currentStageLayout) return;

      const currentZoom = zoomRef.current;
      const newZoom = applyEditorWheelZoomRatio(currentZoom, e.deltaY);
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
      syncBoardViewport();
    },
    [syncBoardViewport],
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
      if (!project || !activeCanvas) return;
      if (toolReservesCanvasRightClick(activeTool)) return;
      if (!e.altKey) {
        const canvas = canvasRef.current;
        if (canvas) {
          const point = clientToPixel(e.clientX, e.clientY, canvas, zoom);
          const boardPoint = canvasPointToBoardPoint(
            point,
            activeCanvas.boardPosition,
          );
          const refLayer = findTopReferenceLayerAtBoardPoint(
            project.referenceLayers,
            boardPoint,
          );
          if (refLayer) {
            openReferenceContextMenu(refLayer.id, e.clientX, e.clientY);
            return;
          }
        }
      }
      openSelectionContextMenu(e.clientX, e.clientY);
    },
    [project, activeCanvas, zoom, activeTool, openReferenceContextMenu, openSelectionContextMenu],
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
    const orthographicAngle = resolveOrthographicAngle(project.orthographicView);
    const primarySpanY = computeForeshortenedSpan(project.grid.primary, orthographicAngle);
    const secondarySpanY = computeForeshortenedSecondarySpan(
      project.grid.primary,
      secondarySize,
      orthographicAngle,
    );

    const handleMove = (e: MouseEvent) => {
      if (isPanningRef.current || mousePositionOverlaySuppressedRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) {
        clearMousePositionOverlay();
        return;
      }

      const point = clientToPixel(e.clientX, e.clientY, canvas, zoom);
      const activeCanvas = getActiveCanvas(project);
      const target = resolveMousePositionOverlayTarget(
        point,
        activeCanvas.boardPosition,
        referenceLayers,
        secondarySize,
        composite,
      );
      if (!target) {
        clearMousePositionOverlay();
        return;
      }

      const canvasRect = canvas.getBoundingClientRect();
      const useOrthographicHighlight =
        project.orthographicView.enabled && target.kind === "canvas";
      const highlightCellOrigin = useOrthographicHighlight
        ? computeOrthographicSecondaryGridCellOrigin(
            point.x,
            point.y,
            secondarySize,
            primarySpanY,
            secondarySpanY,
          )
        : target.canvasCellOrigin;
      const labelPosition = computeGridRelativeLabelScreenPosition(
        canvasRect,
        highlightCellOrigin,
        target.secondarySize,
        zoom,
      );
      const cellBounds = useOrthographicHighlight
        ? computeSecondaryGridCellScreenBoundsWithSpans(
            canvasRect,
            highlightCellOrigin,
            secondarySize,
            secondarySpanY,
            zoom,
          )
        : computeSecondaryGridCellScreenBounds(
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

  useEffect(() => {
    if (!isAssetCaptureActive) return;
    setHoverPoint(null);
    hideBrushSizeHint();
  }, [isAssetCaptureActive, hideBrushSizeHint]);

  useEffect(() => {
    if (!isAssetCaptureAdjusting) return;
    focusCanvasKeyboard();
  }, [isAssetCaptureAdjusting]);

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
    e.stopPropagation();
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
    if (activeTool === "canvasResize") return;
    const button = buttonFromMouseButton(e.button);
    if (!button) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas && isSymmetryActive(symmetry)) {
      const hitAxis = resolveSymmetryHitAtClient(e.clientX, e.clientY);
      if (hitAxis) {
        beginSymmetryAxisDrag(hitAxis);
        return;
      }
    }
    const point = toPixel(e);
    const modifiers = canvasModifiersFromMouseEvent(e, spaceKeyHeldRef.current);
    if (e.altKey && activeTool !== "select") {
      beginAltPickSession(point, button);
      return;
    }
    clearAltPickSession();
    pointerDown(point, button, modifiers);
  };

  const handleSymmetryAxisDragMove = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !symmetryAxisDrag || !composite) return;
    const floatPoint = clientToPixelFloat(clientX, clientY, canvas, zoom);
    if (symmetryAxisDrag === "horizontal") {
      setSymmetryOrigin(floatPoint.x, symmetry.originY);
    } else {
      setSymmetryOrigin(symmetry.originX, floatPoint.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) return;
    if (symmetryAxisDrag) {
      handleSymmetryAxisDragMove(e.clientX, e.clientY);
      return;
    }
    const point = toPixel(e);
    if (isAssetCaptureDragging) {
      assetCapturePointerMove(point);
      return;
    }
    if (isAssetCaptureActive) return;
    if (activeTool === "canvasResize") return;
    updateHoverFromClient(e.clientX, e.clientY);
    const button = drawingButton;
    const modifiers = canvasModifiersFromMouseEvent(e, spaceKeyHeldRef.current);
    if (altPickSessionRef.current && !altPickSessionRef.current.dragStarted) {
      tryStartAltPickDrag(point, modifiers);
      return;
    }
    if (activeTool === "select" || activeTool === "transform") {
      if (button !== null && isDrawingButtonPressed(e.buttons, button)) {
        pointerMove(point, button, modifiers);
      } else if (e.buttons !== 0) {
        pointerMove(point, "primary", modifiers);
      }
      return;
    }
    if (!button || !isDrawingButtonPressed(e.buttons, button)) return;
    if (activeTool === "shape" && isDrawing) {
      setAltKeyHeld(e.altKey);
    }
    pointerMove(point, button, modifiers);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) return;
    if (symmetryAxisDrag) {
      endSymmetryAxisDrag();
      return;
    }
    if (isAssetCaptureDragging) {
      assetCapturePointerUp(toPixel(e));
      return;
    }
    const button = buttonFromMouseButton(e.button);
    if (!button) return;
    if (finishAltPickOnRelease()) return;
    pointerUp(toPixel(e), button, canvasModifiersFromMouseEvent(e, spaceKeyHeldRef.current));
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setHoverPoint(null);
    if (altPickSessionRef.current && !altPickSessionRef.current.dragStarted) {
      return;
    }
    if (selectionDrag || isDrawing) return;
    if (!drawingButton && activeTool !== "select" && activeTool !== "transform" && activeTool !== "canvasResize") return;
    pointerUp(toPixel(e), drawingButton ?? "primary", canvasModifiersFromMouseEvent(e, spaceKeyHeldRef.current));
  };

  const assetCaptureTracking =
    isAssetCaptureDragging && assetCaptureRect !== null;

  const documentPointerTracking =
    altPickPending ||
    assetCaptureTracking ||
    symmetryAxisDrag !== null ||
    (drawingButton !== null &&
      ((selectionDrag !== null &&
        (activeTool === "select" || activeTool === "transform")) ||
        (isDrawing && isDrawingToolType(activeTool)) ||
        isRepeatTilePointerActive));

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
        symmetryAxisDrag: axisDrag,
        tileSession: currentTileSession,
      } = useAppStore.getState();

      if (capturePhase === "dragging") {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const point = clientToPixel(e.clientX, e.clientY, canvas, zoomRef.current);
        useAppStore.getState().assetCapturePointerMove(point);
        return;
      }

      if (axisDrag) {
        const floatPoint = clientToPixelFloat(e.clientX, e.clientY, canvas, zoomRef.current);
        const { symmetry: currentSymmetry, setSymmetryOrigin: updateOrigin } = useAppStore.getState();
        if (axisDrag === "horizontal") {
          updateOrigin(floatPoint.x, currentSymmetry.originY);
        } else {
          updateOrigin(currentSymmetry.originX, floatPoint.y);
        }
        return;
      }

      const pendingAltPick = altPickSessionRef.current;
      if (pendingAltPick && !pendingAltPick.dragStarted) {
        const point = clientToPixel(e.clientX, e.clientY, canvas, zoomRef.current);
        const modifiers = canvasModifiersFromMouseEvent(e, spaceKeyHeldRef.current);
        if (isDrawingButtonPressed(e.buttons, pendingAltPick.button)) {
          tryStartAltPickDrag(point, modifiers);
        }
        return;
      }

      if (button === null) return;

      const isSelectTransform =
        (tool === "select" || tool === "transform") && drag !== null;
      const isRepeatTileActive =
        currentTileSession.phase === "creating" ||
        (currentTileSession.phase === "drawing" && drawing && isDrawingToolType(tool));
      const isActiveDrawingTool =
        (drawing && isDrawingToolType(tool)) || isRepeatTileActive;
      if (!isSelectTransform && !isActiveDrawingTool) return;

      const point = clientToPixel(e.clientX, e.clientY, canvas, zoomRef.current);
      const modifiers = canvasModifiersFromMouseEvent(e, spaceKeyHeldRef.current);

      if (isDrawingButtonPressed(e.buttons, button)) {
        pointerMove(point, button, modifiers);
      } else if (e.buttons !== 0 && isSelectTransform) {
        pointerMove(point, "primary", modifiers);
      }
    };

    const handleDocumentMouseUp = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const { assetCapturePhase: capturePhase, symmetryAxisDrag: axisDrag, endSymmetryAxisDrag: finishAxisDrag } =
        useAppStore.getState();

      if (axisDrag) {
        finishAxisDrag();
        return;
      }

      if (capturePhase === "dragging") {
        const point = clientToPixel(e.clientX, e.clientY, canvas, zoomRef.current);
        useAppStore.getState().assetCapturePointerUp(point);
        return;
      }

      if (finishAltPickOnRelease()) return;

      const button = buttonFromMouseButton(e.button);
      if (!button) return;

      const {
        drawingButton: activeButton,
        selectionDrag: drag,
        isDrawing: drawing,
        activeTool: tool,
        tileSession: currentTileSession,
      } = useAppStore.getState();

      const isSelectTransform =
        (tool === "select" || tool === "transform") && drag !== null;
      const isRepeatTileActive =
        currentTileSession.phase === "creating" ||
        (currentTileSession.phase === "drawing" && drawing && isDrawingToolType(tool));
      const isActiveDrawingTool =
        (drawing && isDrawingToolType(tool)) || isRepeatTileActive;
      if (!isSelectTransform && !isActiveDrawingTool) return;

      const expectedButton = activeButton ?? "primary";
      if (button !== expectedButton) return;

      const point = clientToPixel(e.clientX, e.clientY, canvas, zoomRef.current);
      pointerUp(point, button, canvasModifiersFromMouseEvent(e, spaceKeyHeldRef.current));
    };

    document.addEventListener("mousemove", handleDocumentMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleDocumentMouseMove);
      document.removeEventListener("mouseup", handleDocumentMouseUp);
    };
  }, [documentPointerTracking, pointerMove, pointerUp, tryStartAltPickDrag, finishAltPickOnRelease]);

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
    if (isMiddleMouseButton(e.button)) {
      e.preventDefault();
      startPanning(e.clientX, e.clientY);
      return;
    }
    if (e.button === 0 && boardLayout && project) {
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const stageX = container.scrollLeft + (e.clientX - containerRect.left);
        const stageY = container.scrollTop + (e.clientY - containerRect.top);
        const hitId = hitTestBoardCanvas(boardLayout, stageX, stageY);
        if (hitId && hitId !== project.board.activeCanvasId) {
          e.preventDefault();
          setActiveCanvas(hitId);
          return;
        }
      }
    }
    if (e.button === 0 && isSymmetryActive(symmetry)) {
      const hitAxis = resolveSymmetryHitAtClient(e.clientX, e.clientY);
      if (hitAxis) {
        e.preventDefault();
        beginSymmetryAxisDrag(hitAxis);
      }
    }
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
    <div
      {...canvasRegionProps}
      className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden"
    >
      <WorkspaceRegionBorder active={canvasRegionActive} />
      <div
        ref={containerRef}
        tabIndex={-1}
        className={`relative min-h-0 min-w-0 flex-1 overflow-auto bg-zinc-800 outline-none${
          isPanning ? " cursor-grabbing" : isAssetCaptureActive ? " cursor-capture" : symmetryCursorClass
        }`}
        style={transformCursorStyle ? { cursor: transformCursorStyle } : undefined}
        {...dropZoneProps}
        onMouseDown={handleContainerMouseDown}
        onKeyDown={preventSpaceScroll}
        onAuxClick={handleAuxClick}
        onMouseUp={stopPanning}
        onMouseLeave={() => {
          setHoverPoint(null);
          setTransformHandleHover(null);
          stopPanning();
        }}
      >
        <ImageDropOverlay
          visible={isImageDraggingOver}
          hint={
            imageDropAsReference
              ? "松开以导入为参考图层（Ctrl）"
              : "松开以导入为绘制图层"
          }
        />
        {stageLayout && boardLayout && (
          <div
            className="relative shrink-0"
            style={{
              width: stageLayout.stageWidth,
              height: stageLayout.stageHeight,
            }}
          >
            <canvas
              ref={boardBackgroundRef}
              className="pointer-events-none absolute left-0 top-0"
              style={{ imageRendering: "pixelated" }}
            />
            <div
              className={`absolute isolate overflow-hidden${
                hasMultipleCanvases ? " outline outline-2 outline-blue-500" : ""
              }`}
              style={{
                left: activeCanvasLeft,
                top: activeCanvasTop,
                width: displayWidth,
                height: displayHeight,
                zIndex: 1,
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
                      : showEyedropperCursor
                        ? " cursor-eyedropper"
                        : symmetryCursorClass || " cursor-crosshair"
                }`}
                style={{
                  imageRendering: "pixelated",
                  ...(transformCursorStyle ? { cursor: transformCursorStyle } : {}),
                }}
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
              <div
                className="pointer-events-none absolute left-0 top-0"
                style={{
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
            {referenceLayers.map((layer) => (
                <ReferenceLayerOverlay
                  key={layer.id}
                  layer={layer}
                  stackIndex={getReferenceStackIndex(referenceLayers, layer.id)}
                  referenceLayerCount={referenceLayerCount}
                  boardOriginLeft={boardOriginLeft}
                  boardOriginTop={boardOriginTop}
                  zoom={zoom}
                  isActive={layer.id === activeReferenceLayerId}
                  onContextMenuRequest={openReferenceContextMenu}
                />
              ))}
            {activeTool === "canvasResize" && boardLayout && project && (
              <CanvasBoardToolOverlay
                zoom={zoom}
                boardLayouts={boardLayout.canvases.map((layout) => {
                  const canvas = project.board.canvases.find((entry) => entry.id === layout.canvasId);
                  return {
                    canvasId: layout.canvasId,
                    name: canvas?.name ?? "画板",
                    left: layout.left,
                    top: layout.top,
                    displayWidth: layout.displayWidth,
                    displayHeight: layout.displayHeight,
                    isActive: layout.canvasId === project.board.activeCanvasId,
                  };
                })}
              />
            )}
            {activeTool === "canvasResize" && composite && (
              <CanvasSizeToolOverlay
                canvasLeft={activeCanvasLeft}
                canvasTop={activeCanvasTop}
                displayWidth={displayWidth}
                displayHeight={displayHeight}
                zoom={zoom}
                canvasWidth={composite.width}
                canvasHeight={composite.height}
              />
            )}
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
      <ComfyAppFloatingRunner scope="canvas" floatingPanelId="comfyRunner" />
      <ReferenceCropModal />
      {referenceContextMenu && referenceContextMenuItems.length > 0 && (
        <ContextMenu
          position={{ x: referenceContextMenu.x, y: referenceContextMenu.y }}
          items={referenceContextMenuItems}
          onClose={closeReferenceContextMenu}
        />
      )}
      {selectionContextMenu && selectionContextMenuItems.length > 0 && (
        <ContextMenu
          position={{ x: selectionContextMenu.x, y: selectionContextMenu.y }}
          items={selectionContextMenuItems}
          onClose={closeSelectionContextMenu}
        />
      )}
    </div>
  );
}
