import {
  applyToolPointerDown,
  applyToolPointerMove,
  applyToolPointerUp,
  applyBrushStraightLine,
  type DrawToolOptions,
} from "@/application/use-cases/DrawStroke";
import { shapeDragBoundingPoints } from "@/domain/tool/ShapeDragGeometry";
import type { PointerModifiers } from "@/domain/tool/ITool";
import { clampEditorZoom } from "@/domain/viewport/EditorZoom";

import {
  pushHistory,
  pushStructureHistory,
  pushBoardStructureHistory,
  undoHistory,
  redoHistory,
} from "@/application/use-cases/HistoryUseCases";

import { autoLayoutBoardCanvases as autoLayoutBoardCanvasesUseCase } from "@/application/use-cases/AutoLayoutBoardCanvases";

import {
  beginDrawingStroke,
  commitDrawingStroke,
  type DrawingStrokeSession,
} from "@/application/use-cases/DrawingStrokeSessionUseCases";

import {
  beginMoveSelection,
  cancelFloatingSelectionInProject,
  clearSelectionPixels,
  commitFloatingSelectionInProject,
  createFloatingFromCut,
  deselectSelection,
  getEffectiveSelectionMask,
  invertSelection,
  nudgeSelection,
  selectAll,
  resolveSelectionForTransform,
} from "@/application/use-cases/SelectionUseCases";

import {
  copySelectionToClipboard,
  pasteFromClipboard,
} from "@/application/use-cases/ClipboardUseCases";

import { HistoryStack } from "@/domain/history/HistoryStack";

import type { SelectionState } from "@/domain/selection/SelectionState";

import type { FloatingSelection } from "@/domain/selection/FloatingSelection";

import { isSelectionEmpty } from "@/domain/selection/SelectionState";

import type { SelectionMask } from "@/domain/selection/SelectionMask";
import type { SelectionRect } from "@/domain/selection/SelectionRect";

import {
  clampMagicWandTolerance,
  clampFillTolerance,
  clampPatternScale,
} from "@/domain/tool/ToolType";

import { cloneImageData } from "@/domain/image/ImageDataOperations";

import { clipboardService } from "@/infrastructure/clipboard/createClipboardService";

import {
  handleSelectPointerDown,
  handleSelectPointerMove,
  handleSelectPointerUp,
  handleTransformPointerDown,
  handleTransformPointerMove,
  handleTransformPointerUp,
  flipFloatingHorizontal,
  flipFloatingVertical,
  rotateFloatingSelection90,
  resolveLayerPositionFromDrag,
  type SelectionDragState,
} from "@/presentation/controllers/canvasInteraction";

import { extractSelectionColorsForAnalysis } from "@/application/use-cases/ExtractSelectionColorsForAnalysis";
import { buildColorEntriesInScanOrder } from "@/domain/selection/SelectionColorExtraction";
import { usePixelRestoreStore } from "@/presentation/stores/pixelRestoreStore";
import { useColorEditStore } from "@/presentation/stores/colorEditStore";
import { useColorVariationAnalysisStore } from "@/presentation/stores/colorVariationAnalysisStore";
import { useAiTextFieldSessionStore } from "@/presentation/stores/aiTextFieldSessionStore";
import { useComfyUiStore } from "@/presentation/stores/comfyUiStore";
import { useWorldStore } from "@/presentation/stores/worldStore";
import type { PluginPageId } from "@/presentation/config/pluginPagesConfig";

import type { CapturableMonitor } from "@/application/ports/ICaptureService";

import {

  replaceProjectFromImagePath,

  replaceProjectFromScreenCapture,

  replaceProjectFromWindowCapture,

} from "@/application/use-cases/ReplaceProjectFromImage";

import { importAssetFromImageData } from "@/application/use-cases/ImportAssetFromImageData";
import { loadAssetLibrary } from "@/application/use-cases/LoadAssetLibrary";
import {
  importAssetColorsToPalette,
  importAssetGridToNewDrawingLayer,
  importAssetImageDataToNewReferenceLayer,
} from "@/application/use-cases/ImportAssetToProject";
import { dropImageAsDrawingLayerOntoCanvas, dropImageAsReferenceLayerOntoCanvas, createCanvasWithDroppedDrawingLayer } from "@/application/use-cases/DropImageOntoCanvas";
import { imageDataToPixelGrid } from "@/application/use-cases/ClipboardUseCases";
import { importReferenceLayerFromClipboard } from "@/application/use-cases/ImportReferenceLayerFromClipboard";

import {

  addDrawingLayer,

  addReferenceLayer,

  getActiveLayerGridFromProject,

  getActiveLayerProjectedSurfaceFromProject,

  ensureActiveLayerContainsCanvasPointsInProject,

  ensureActiveLayerCoversCanvasInProject,

  ensureActiveLayerContainsFloatingSelectionInProject,

  moveDrawingLayer as moveDrawingLayerInProjectUseCase,

  moveReferenceLayer as moveReferenceLayerInProject,

  removeLayerFromProject,

  renameLayerInProject,

  reorderLayerInProject,

  setActiveLayer,
  setActiveReferenceLayer,

  setReferenceCrop as setReferenceCropInProject,

  setDrawingLayerOpacityInProject,

  syncActiveLayerPixels,

  toggleDrawingLayerLockInProject,

  toggleLayerVisibilityInProject,

  toggleReferenceGrid as toggleReferenceGridInProject,

  toggleReferencePalette as toggleReferencePaletteInProject,

  scaleReferenceLayer as scaleReferenceLayerInProject,

  resetReferenceScale as resetReferenceScaleInProject,

  copyDrawingLayerInProject,

  pasteDrawingLayerInProject,

  mergeDrawingLayerDownInProject,

} from "@/application/use-cases/LayerUseCases";

import { resolveColorAtCanvasPointAsync } from "@/application/use-cases/PickColorAtPoint";
import { loadAppSettings } from "@/application/use-cases/LoadAppSettings";
import { loadEditorPreferences } from "@/application/use-cases/LoadEditorPreferences";
import { loadColorVariationAnalysisPreferences } from "@/application/use-cases/LoadColorVariationAnalysisPreferences";
import { loadAgentProfiles } from "@/application/use-cases/LoadAgentProfiles";
import { loadFieldPromptConfigs } from "@/application/use-cases/LoadFieldPromptConfigs";
import { loadLlmSettings } from "@/application/use-cases/LoadLlmSettings";
import { exportImage } from "@/application/use-cases/ExportImageUseCases";
import { loadProject } from "@/application/use-cases/LoadProject";
import { createBlankProjectWithPreferences } from "@/application/use-cases/CanvasSizePreferences";
import { openLastProjectOnStartup } from "@/application/use-cases/OpenLastProjectOnStartup";
import { saveEditorPreferences } from "@/application/use-cases/SaveEditorPreferences";
import { saveLastOpenedProject } from "@/application/use-cases/SaveLastOpenedProject";
import { getPersistedProjectPath } from "@/application/use-cases/ProjectPersistence";
import { migrateUserDataFromLocalStorage } from "@/application/use-cases/MigrateUserDataFromLocalStorage";

import { deleteProject } from "@/application/use-cases/DeleteProject";

import { renameProjectInSoftwareDataPath } from "@/application/use-cases/RenameProjectInSoftwareDataPath";

import {
  ensureSoftwareDataPathAccess,
  markSoftwareDataPathAccessGranted,
} from "@/application/use-cases/EnsureSoftwareDataPathAccess";
import { listProjectsInSoftwareDataPath } from "@/application/use-cases/ListProjectsInSoftwareDataPath";

import {

  resolveDefaultSavePath,

} from "@/application/use-cases/ResolveProjectSavePath";

import { saveCurrentProject as saveCurrentProjectUseCase } from "@/application/use-cases/SaveCurrentProject";
import { saveProject } from "@/application/use-cases/SaveProject";
import { resizeCanvas } from "@/application/use-cases/ResizeCanvas";
import { resizeCanvasByEdge } from "@/application/use-cases/ResizeCanvasByEdge";
import type { CanvasResizeEdge } from "@/domain/canvas/CanvasEdgeResizeOperations";
import type { CanvasSize } from "@/domain/canvas/CanvasSize";

import type { CanvasDisplayMode } from "@/domain/color/CanvasDisplayMode";
import type { ColorMode } from "@/domain/color/ColorMode";
import {
  getFloatingColorPickerPanelDimensions,
  type ColorPickerLayoutOrientation,
} from "@/domain/color/ColorPickerLayout";
import { rgba, TRANSPARENT, rgbKey, type PixelColor } from "@/domain/canvas/PixelColor";
import {
  DEFAULT_NAVIGATOR_HEIGHT,
  DEFAULT_NAVIGATOR_WIDTH,
  DEFAULT_SIDEBAR_WIDTH,
  DEFAULT_SPLIT_PANE_RATIO,
  extractEditorPreferences,
} from "@/domain/preferences/EditorPreferences";
import {
  createCenteredOrigin,
  createDefaultSymmetryConfig,
  isSymmetryActive,
  type SymmetryConfig,
} from "@/domain/symmetry/SymmetryConfig";
import type { SymmetryAxisKind } from "@/domain/symmetry/SymmetryMirror";
import { snapSymmetryOrigin } from "@/domain/symmetry/SymmetryMirror";

import { findAssetById, ROOT_FOLDER_ID } from "@/domain/asset/AssetLibrary";
import { getAssetRelativeFilePath, isImageAsset } from "@/domain/asset/AssetRecord";
import { isReferenceLayer, isDrawingLayer } from "@/domain/layer/LayerTypeGuards";
import {
  CompositeCache,
  compositeActiveLayerOverBase,
} from "@/domain/layer/CompositeCache";
import type { DrawingLayerClipboard } from "@/domain/layer/DrawingLayerClipboard";
import { LayerProjectedSurface } from "@/domain/canvas/LayerProjectedSurface";
import type { WritableCanvasSurface } from "@/domain/canvas/MaskedPixelGrid";
import { MaskedPixelGrid } from "@/domain/canvas/MaskedPixelGrid";
import { PixelGrid } from "@/domain/canvas/PixelGrid";
import { loadAssetImageAsImageData } from "@/infrastructure/storage/AssetImageLoader";
import { revealAssetFileInFolder } from "@/infrastructure/storage/AssetFileReveal";
import { toast } from "@/presentation/stores/toastStore";
import { referenceLayerCropKey } from "@/domain/layer/ReferenceLayerPalette";

import {

  getActiveLayer,

  getActiveCanvas,

  getCanvasSize,

  isUnsavedEmptyProject,

  getCompositeGrid as compositeProjectLayers,

  withProjectFilePath,

  withOrthographicView,

  withActiveCanvasId,

  withBoard,

  type Project,

} from "@/domain/project/Project";
import {
  addPixelCanvasToBoard,
  removePixelCanvasFromBoard,
  movePixelCanvasOnBoard,
  renamePixelCanvas,
  duplicatePixelCanvasOnBoard,
} from "@/domain/pixelCanvas/PixelCanvasOperations";
import type { BoardPosition } from "@/domain/pixelCanvas/PixelCanvas";
import {
  clampCameraAngle,
} from "@/domain/viewport/OrthographicView";

import type { CropRect, LayerPosition, ReferenceLayer } from "@/domain/layer/Layer";

import type { ProjectSummary } from "@/domain/project/ProjectSummary";

import type { Point } from "@/domain/tool/ITool";

import {
  DEFAULT_TOOL_SETTINGS,
  clampStampSize,
  clampCanvasResizeStep,
  type ToolSettings,
  type ToolType,
} from "@/domain/tool/ToolType";

import { isDrawingToolType } from "@/domain/tool/ToolRegistry";
import {
  closeTileSession as closeTileSessionUseCase,
  handleTileCreatePointerDown,
  handleTileCreatePointerMove,
  handleTileCreatePointerUp,
  type TileCreateDragState,
} from "@/application/use-cases/TileSessionUseCases";
import {
  createTileCellMask,
  createTileUnionMask,
} from "@/domain/tile/TileReplication";
import {
  createIdleTileSession,
  type TileSessionState,
} from "@/domain/tile/TileSession";

export type ColorSlot = "foreground" | "background";
export type DrawingButton = "primary" | "secondary";

import {
  addColorToPalette as addColorToPaletteUseCase,
  clearPalette as clearPaletteUseCase,
  removeColorsFromPalette as removeColorsFromPaletteUseCase,
} from "@/application/use-cases/PaletteUseCases";
import {
  importReferenceLayerColorsToPalette,
  type ReferenceColorImportScope,
} from "@/application/use-cases/ImportReferenceLayerColorsToPalette";

import {
  clearReferenceLayerPixelCache,
  ensureReferenceLayerFullPixelCache,
  ensureReferenceLayerPixelCache,
  getReferenceLayerPixelCache,
  invalidateReferenceLayerPixelCache,
  removeStaleReferenceLayerCropCaches,
} from "@/infrastructure/canvas/ReferenceLayerPixelCache";
import { imageProcessor } from "@/infrastructure/image/CanvasImageProcessor";

import { projectRepository } from "@/infrastructure/storage/JsonProjectRepository";
import { buildDefaultExportSavePath } from "@/domain/export/ExportImageOperations";
import {
  DEFAULT_IMAGE_EXPORT_PREFERENCES,
  getImageExportExtension,
  parseImageExportPreferences,
  type ImageExportFormat,
  type ImageExportPreferences,
  type ImageExportScalePreset,
  type ImageExportScope,
} from "@/domain/export/ImageExportPreferences";
import { imageExportPreferencesRepository } from "@/infrastructure/storage/FileImageExportPreferencesRepository";
import { lastOpenedProjectStore } from "@/infrastructure/storage/FileLastOpenedProjectStore";
import { softwareDataPathStore } from "@/infrastructure/storage/LocalSoftwareDataPathStore";
import {
  getActiveSoftwareDataPath,
  setActiveSoftwareDataPath,
  setUserDataHydrating,
} from "@/infrastructure/storage/UserDataPersistenceContext";

import { assetLibraryRepository } from "@/infrastructure/storage/FileAssetLibraryRepository";
import { patternBrushRepository } from "@/infrastructure/storage/FilePatternBrushRepository";

import {
  createAssetLibrarySlice,
  type AssetLibrarySliceActions,
  type AssetLibrarySliceState,
} from "@/presentation/stores/assetLibrarySlice";
import {
  createPatternBrushSlice,
  type PatternBrushSliceActions,
  type PatternBrushSliceState,
} from "@/presentation/stores/patternBrushSlice";
import {
  createSettingsSlice,
  type SettingsSliceActions,
  type SettingsSliceState,
} from "@/presentation/stores/settingsSlice";
import {
  createHelpSlice,
  type HelpSliceActions,
  type HelpSliceState,
} from "@/presentation/stores/helpSlice";
import {
  createAppSettingsSlice,
  subscribeAppSettingsPersistence,
  setAppSettingsHydrating,
  type AppSettingsSliceActions,
  type AppSettingsSliceState,
} from "@/presentation/stores/appSettingsSlice";
import {
  createLlmSettingsSlice,
  subscribeLlmSettingsPersistence,
  type LlmSettingsSliceActions,
  type LlmSettingsSliceState,
} from "@/presentation/stores/llmSettingsSlice";
import {
  createPalettePresetSlice,
  type PalettePresetSliceActions,
  type PalettePresetSliceState,
} from "@/presentation/stores/palettePresetSlice";
import { editorPreferencesRepository } from "@/infrastructure/storage/FileEditorPreferencesRepository";
import { colorVariationAnalysisPreferencesRepository } from "@/infrastructure/storage/FileColorVariationAnalysisPreferencesRepository";
import { agentProfileRepository } from "@/infrastructure/storage/FileAgentProfileRepository";
import { fieldPromptConfigRepository } from "@/infrastructure/storage/FileFieldPromptConfigRepository";
import { appSettingsRepository } from "@/infrastructure/storage/FileAppSettingsRepository";
import { llmSettingsRepository } from "@/infrastructure/storage/FileLlmSettingsRepository";
import { palettePresetRepository } from "@/infrastructure/storage/FilePalettePresetRepository";
import { luminancePalettePresetRepository } from "@/infrastructure/storage/FileLuminancePalettePresetRepository";
import {
  createLuminancePaletteSlice,
  syncLuminanceLiveEditFromColorPicker,
  type LuminancePaletteSliceActions,
  type LuminancePaletteSliceState,
} from "@/presentation/stores/luminancePaletteSlice";
import {
  createLuminancePalettePresetSlice,
  type LuminancePalettePresetSliceActions,
  type LuminancePalettePresetSliceState,
} from "@/presentation/stores/luminancePalettePresetSlice";
import {
  createWorkspaceRegionSlice,
  type WorkspaceRegionSliceActions,
  type WorkspaceRegionSliceState,
} from "@/presentation/stores/workspaceRegionSlice";

import { captureService } from "@/infrastructure/tauri/TauriCaptureService";

import { windowService } from "@/infrastructure/tauri/TauriWindowService";

import { navigateToPreviewPoint as navigateToPreviewPointUseCase } from "@/application/use-cases/NavigateToPoint";

import { zoomNavigatorPreviewAtPoint as zoomNavigatorPreviewAtPointUseCase } from "@/application/use-cases/ZoomNavigatorPreviewAtPoint";

import { syncNavigatorPreviewToViewport } from "@/application/use-cases/SyncNavigatorPreviewToViewport";

import {
  applyPreviewPanDelta,
  clampPreviewScale,
  type ViewportSnapshot,
} from "@/domain/viewport/NavigatorViewport";

import { clampPanelPosition } from "@/domain/viewport/FloatingPanelBounds";
import {
  adaptPanelPositionOnResize,
  applyMagneticSnap,
  DEFAULT_PANEL_EDGE_ANCHOR,
  detectEdgeAnchor,
  type PanelEdgeAnchor,
} from "@/domain/viewport/FloatingPanelAnchor";
import { resolveNavigatorResizeConstraints } from "@/domain/viewport/NavigatorPanelResize";
import {
  bringPanelToFront,
  type FloatingPanelId,
} from "@/domain/viewport/FloatingPanelStack";

import { open, save } from "@tauri-apps/plugin-dialog";

import { create } from "zustand";

const NAVIGATOR_HEADER_HEIGHT = 28;
const NAVIGATOR_MIN_WIDTH = 100;
const NAVIGATOR_MIN_HEIGHT = 80;
const NAVIGATOR_DEFAULT_WIDTH = DEFAULT_NAVIGATOR_WIDTH;
const NAVIGATOR_DEFAULT_HEIGHT = DEFAULT_NAVIGATOR_HEIGHT;

const SIDEBAR_MIN_WIDTH = 180;
const SIDEBAR_MAX_WIDTH = 400;
const SPLIT_PANE_MIN_RATIO = 0.15;
const SPLIT_PANE_MAX_RATIO = 0.85;

let isHydratingPreferences = false;
let preferencesSaveTimer: ReturnType<typeof setTimeout> | null = null;

function toNavigatorLayout(navigator: NavigatorState) {
  return {
    previewWidth: navigator.size.width,
    previewHeight: navigator.size.height,
    previewScale: navigator.previewScale,
    previewPanX: navigator.previewPan.x,
    previewPanY: navigator.previewPan.y,
  };
}

function getNavigatorResizeConstraints(container: HTMLDivElement | null) {
  return resolveNavigatorResizeConstraints(container);
}

function getNavigatorPanelSize(navigator: NavigatorState) {
  return {
    width: navigator.size.width,
    height: navigator.size.height + NAVIGATOR_HEADER_HEIGHT,
  };
}

function getContainerDimensions(container: HTMLDivElement | null) {
  if (!container) return null;
  return {
    width: container.clientWidth,
    height: container.clientHeight,
  };
}

function applyNavigatorViewportSync(
  navigator: NavigatorState,
  snapshot: ViewportSnapshot,
): NavigatorState | null {
  const sync = syncNavigatorPreviewToViewport(snapshot, {
    previewWidth: navigator.size.width,
    previewHeight: navigator.size.height,
  });
  if (!sync) return null;
  return {
    ...navigator,
    previewScale: sync.previewScale,
    previewPan: { x: sync.previewPan.panX, y: sync.previewPan.panY },
  };
}

export interface NavigatorState {
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  previewScale: number;
  previewPan: { x: number; y: number };
  edgeAnchor: PanelEdgeAnchor;
  followViewport: boolean;
}

export interface FloatingColorPickerState {
  visible: boolean;
  position: { x: number; y: number };
  activeSlot: ColorSlot;
  panelWidth: number;
  panelHeight: number;
  edgeAnchor: PanelEdgeAnchor;
}

interface AppState extends AssetLibrarySliceState, AssetLibrarySliceActions, PatternBrushSliceState, PatternBrushSliceActions, SettingsSliceState, SettingsSliceActions, HelpSliceState, HelpSliceActions, AppSettingsSliceState, AppSettingsSliceActions, LlmSettingsSliceState, LlmSettingsSliceActions, PalettePresetSliceState, PalettePresetSliceActions, LuminancePaletteSliceState, LuminancePaletteSliceActions, LuminancePalettePresetSliceState, LuminancePalettePresetSliceActions, WorkspaceRegionSliceState, WorkspaceRegionSliceActions {

  project: Project | null;

  activeTool: ToolType;

  toolSettings: ToolSettings;

  foregroundColor: PixelColor;

  backgroundColor: PixelColor;

  zoom: number;

  fitActiveCanvasNonce: number;

  alwaysOnTop: boolean;

  isDrawing: boolean;

  drawStart: Point | null;

  lastPoint: Point | null;

  drawingButton: DrawingButton | null;

  drawingColor: PixelColor | null;

  drawingStrokeSession: DrawingStrokeSession | null;

  canvasRenderNonce: number;

  brushLineAnchor: Point | null;

  manualScaleOverride: number | null;

  detectedScale: number;

  layersPanelTab: "drawing" | "reference";

  drawingLayerClipboard: DrawingLayerClipboard | null;

  paletteViewMode: "grid" | "oklchMap";

  colorPickerMode: ColorMode;

  colorPickerLayoutOrientation: ColorPickerLayoutOrientation;

  sidebarWidth: number;

  splitPaneRatio: number;

  isCapturing: boolean;

  captureError: string | null;

  monitorPickerOpen: boolean;

  availableMonitors: CapturableMonitor[];

  projectManagerOpen: boolean;

  softwareDataPath: string | null;

  projectSummaries: ProjectSummary[];

  projectListLoading: boolean;

  deleteConfirmTarget: ProjectSummary | null;

  projectManagerError: string | null;

  navigator: NavigatorState;

  /** 悬浮窗口层级堆叠顺序（末尾为最上层，最近激活者置顶） */
  floatingPanelStack: FloatingPanelId[];

  mousePositionOverlayVisible: boolean;

  canvasDisplayMode: CanvasDisplayMode;

  floatingColorPicker: FloatingColorPickerState;

  viewportSnapshot: ViewportSnapshot | null;

  viewportContainer: HTMLDivElement | null;

  cropEditorLayerId: string | null;

  importTargetLayerId: string | null;

  canvasSizeModalOpen: boolean;

  exportImageModalOpen: boolean;

  imageExportPreferences: ImageExportPreferences;

  historyStack: HistoryStack;

  selection: SelectionState | null;

  selectionDrag: SelectionDragState | null;

  lassoPoints: Point[];

  selectionPreviewRect: SelectionRect | null;

  internalClipboard: FloatingSelection | null;

  symmetry: SymmetryConfig;

  symmetryAxisDrag: SymmetryAxisKind | null;

  tileSession: TileSessionState;

  tileCreateDrag: TileCreateDragState | null;

  tilePreviewRect: SelectionRect | null;

  selectionByCanvas: Record<string, SelectionState | null>;

  symmetryByCanvas: Record<string, SymmetryConfig>;

  tileSessionByCanvas: Record<string, TileSessionState>;



  init: () => Promise<void>;

  newProject: () => Promise<void>;

  createBlankProject: () => void;

  openProject: () => Promise<void>;

  saveCurrentProject: () => Promise<boolean>;

  saveProjectAs: () => Promise<boolean>;

  setActiveTool: (tool: ToolType) => void;

  beginTileRegionCreate: () => void;

  cancelTileRegionCreate: () => void;

  closeTileSession: () => void;

  setToolSettings: (settings: Partial<ToolSettings>) => void;

  toggleSymmetryHorizontal: () => void;

  toggleSymmetryVertical: () => void;

  resetSymmetryToCenter: () => void;

  setSymmetryOrigin: (originX: number, originY: number) => void;

  beginSymmetryAxisDrag: (axis: SymmetryAxisKind) => void;

  endSymmetryAxisDrag: () => void;

  setForegroundColor: (color: PixelColor) => void;

  setBackgroundColor: (color: PixelColor) => void;

  setColorSlot: (slot: ColorSlot, color: PixelColor) => void;

  setZoom: (zoom: number) => void;

  requestFitActiveCanvasInViewport: () => void;

  toggleGrid: () => void;

  setOrthographicViewEnabled: (enabled: boolean) => void;

  setOrthographicCameraAngle: (angle: number) => void;

  toggleNavigator: () => void;

  toggleMousePositionOverlay: () => void;

  toggleCanvasDisplayMode: () => void;

  detachColorPicker: (
    slot: ColorSlot,
    position: { x: number; y: number },
    panelSize?: { width: number; height: number },
  ) => void;

  setFloatingColorPickerPosition: (x: number, y: number) => void;

  setFloatingColorPickerPositionWithAnchor: (
    x: number,
    y: number,
    anchor?: PanelEdgeAnchor,
  ) => void;

  setFloatingColorPickerPanelSize: (width: number, height: number) => void;

  setFloatingColorPickerSlot: (slot: ColorSlot) => void;

  closeFloatingColorPicker: () => void;

  finalizeFloatingColorPickerDrag: () => void;

  setNavigatorPosition: (x: number, y: number) => void;

  setNavigatorPositionWithAnchor: (
    x: number,
    y: number,
    anchor?: PanelEdgeAnchor,
  ) => void;

  finalizeNavigatorDrag: () => void;

  /** 将指定悬浮窗口提到最上层（激活/点击时调用） */
  bringFloatingPanelToFront: (id: FloatingPanelId) => void;

  adaptFloatingPanelsToViewport: () => void;

  setNavigatorSize: (width: number, height: number) => void;

  setNavigatorBounds: (
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;

  setNavigatorPreviewScale: (scale: number) => void;

  zoomNavigatorPreviewAtPoint: (
    previewX: number,
    previewY: number,
    newScale: number,
  ) => void;

  panNavigatorPreview: (deltaX: number, deltaY: number) => void;

  syncNavigatorToViewport: () => void;

  setNavigatorFollowViewport: (follow: boolean) => void;

  setViewportContainer: (el: HTMLDivElement | null) => void;

  syncViewportSnapshot: (options?: {
    canvasEl?: HTMLCanvasElement | null;
    boardContent?: { left: number; top: number; width: number; height: number };
    pixelGridRect?: { x: number; y: number; width: number; height: number };
  }) => void;

  navigateToPreviewPoint: (previewX: number, previewY: number) => void;

  toggleAlwaysOnTop: () => Promise<void>;

  setManualScale: (scale: number | null) => void;

  reapplyScale: () => void;

  screenCapture: () => Promise<void>;

  captureMonitor: (monitorId: number) => Promise<void>;

  closeMonitorPicker: () => void;

  clearCaptureError: () => void;

  windowCapture: (windowId: number) => Promise<void>;

  importImage: () => Promise<void>;

  pointerDown: (
    point: Point,
    button: DrawingButton,
    modifiers?: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean; spaceKey: boolean },
  ) => void;

  pointerMove: (
    point: Point,
    button: DrawingButton,
    modifiers?: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean; spaceKey: boolean },
  ) => void;

  pointerUp: (
    point: Point,
    button: DrawingButton,
    modifiers?: { shiftKey: boolean; altKey: boolean; ctrlKey: boolean; spaceKey: boolean },
  ) => void;

  undo: () => void;

  redo: () => void;

  canUndo: () => boolean;

  canRedo: () => boolean;

  selectAllCanvas: () => void;

  activateTransformTool: () => void;

  deselectCanvas: () => void;

  invertCanvasSelection: () => void;

  copySelection: () => Promise<void>;

  cutSelection: () => Promise<void>;

  pasteSelection: () => Promise<void>;

  clearSelectionContent: () => void;

  commitSelection: () => void;

  cancelSelection: () => void;

  nudgeSelectionBy: (dx: number, dy: number) => void;

  rotateSelection90: (steps: number) => void;

  flipSelectionHorizontal: () => void;

  flipSelectionVertical: () => void;

  togglePatternBrushFlipHorizontal: () => void;

  togglePatternBrushFlipVertical: () => void;

  pickColorAt: (point: Point, slot: ColorSlot) => Promise<void>;

  setLayersPanelTab: (tab: "drawing" | "reference") => void;

  importReferenceLayerFromClipboardAction: () => Promise<void>;

  setPaletteViewMode: (mode: "grid" | "oklchMap") => void;

  setColorPickerMode: (mode: ColorMode) => void;

  setColorPickerLayoutOrientation: (orientation: ColorPickerLayoutOrientation) => void;

  setSidebarWidth: (width: number) => void;

  setSplitPaneRatio: (ratio: number) => void;

  addColorToPalette: (color: PixelColor) => void;

  removeColorsFromPalette: (hexes: string[]) => void;

  clearPalette: () => void;

  importReferenceLayerColors: (
    layerId: string,
    scope: ReferenceColorImportScope,
  ) => Promise<void>;

  importAssetToNewDrawingLayer: (assetId: string) => Promise<void>;

  importAssetToNewReferenceLayer: (assetId: string) => Promise<void>;

  importAssetColorsToPalette: (assetId: string) => Promise<void>;

  /** 把任意图像数据导入为新的绘制图层 */
  importImageDataToDrawingLayer: (imageData: ImageData, name: string) => void;

  /** 将拖放的图片导入到指定画板坐标；默认创建绘制图层，按住 Ctrl 时创建参考图层 */
  importDroppedImageAtCanvasPoint: (
    source: { file: File } | { path: string },
    canvasId: string,
    canvasPoint: Point,
    asReference?: boolean,
  ) => Promise<void>;

  /** 在空白工作区创建与图片同尺寸的画板并导入绘制层（图层位置归零） */
  importDroppedImageAtBoardPoint: (
    source: { file: File } | { path: string },
    boardPoint: Point,
  ) => Promise<void>;

  /** 把任意图像数据导入为新的参考图层 */
  importImageDataToReferenceLayer: (imageData: ImageData, name: string) => void;

  /** 把 PNG 图像复制到系统剪贴板 */
  copyImageToClipboard: (pngBlob: Blob) => Promise<void>;

  setActiveLayer: (layerId: string) => void;

  setActiveReferenceLayer: (layerId: string) => void;

  toggleLayerVisibility: (layerId: string) => void;

  setDrawingLayerOpacity: (layerId: string, opacityPercent: number) => void;

  toggleDrawingLayerLock: (layerId: string) => void;

  renameLayer: (layerId: string, name: string) => void;

  addDrawingLayer: () => void;

  addReferenceLayer: () => void;

  removeLayer: (layerId: string) => void;

  copyDrawingLayer: (layerId?: string) => void;

  pasteDrawingLayer: () => void;

  mergeDrawingLayerDown: (layerId?: string) => void;

  reorderLayer: (fromIndex: number, toIndex: number) => void;

  setActiveCanvas: (canvasId: string) => void;

  addCanvas: (name?: string) => void;

  removeCanvas: (canvasId: string) => void;

  moveCanvasOnBoard: (canvasId: string, boardPosition: BoardPosition) => void;

  beginCanvasBoardMove: () => void;

  previewCanvasOnBoard: (canvasId: string, boardPosition: BoardPosition) => void;

  renameCanvas: (canvasId: string, name: string) => void;

  duplicateCanvas: (canvasId: string) => void;

  autoLayoutBoardCanvases: () => void;

  moveReferenceLayer: (layerId: string, position: LayerPosition) => void;

  setReferenceCrop: (layerId: string, crop: CropRect) => void;

  toggleReferenceGrid: (layerId: string) => void;

  resizeReferenceLayer: (
    layerId: string,
    payload: { scale: number; position?: LayerPosition },
  ) => void;

  resetReferenceScale: (layerId: string) => void;

  toggleReferencePalette: (layerId: string) => void;

  openCropEditor: (layerId: string) => void;

  closeCropEditor: () => void;

  importImageToReferenceLayer: (layerId: string) => Promise<void>;

  openPixelRestorePage: () => void;

  openColorEditPage: () => void;

  openColorVariationPage: () => void;

  openWorldPage: () => void;

  openComfyUiPage: () => void;

  saveImageToAssetLibrary: (imageData: ImageData, title: string) => Promise<void>;

  sendAssetToPlugin: (assetId: string, pluginId: PluginPageId) => Promise<void>;

  revealAssetInFolder: (assetId: string) => Promise<void>;

  sendPixelRestoreResultToColorEdit: (imageData: ImageData) => void;

  sendSelectionColorsToColorVariationAnalysis: () => void;

  exportRestoredImageToAssetLibrary: (imageData: ImageData) => Promise<void>;

  openCanvasSizeModal: () => void;

  closeCanvasSizeModal: () => void;

  applyCanvasSize: (width: number, height: number) => void;

  pushCanvasResizeHistory: () => void;

  applyCanvasEdgeResize: (
    edge: CanvasResizeEdge,
    delta: number,
    anchorSize?: CanvasSize,
  ) => void;

  openExportImageModal: () => void;

  closeExportImageModal: () => void;

  executeExportImage: (input: {
    format: ImageExportFormat;
    scope: ImageExportScope;
    scalePreset: ImageExportScalePreset;
    customLongestEdge: number;
  }) => Promise<{ filePath: string } | "cancelled" | null>;

  getCompositeGrid: () => PixelGrid | null;

  getActiveLayerGrid: () => PixelGrid | null;

  syncActiveLayer: (grid: WritableCanvasSurface) => void;

  requestCanvasRender: () => void;

  getCompositeGridForRender: () => PixelGrid | null;

  getRecentProjects: () => string[];

  openProjectManager: () => void;

  closeProjectManager: () => void;

  pickSoftwareDataPath: () => Promise<void>;

  refreshProjectList: () => Promise<void>;

  openProjectByPath: (path: string) => Promise<void>;

  requestDeleteProject: (summary: ProjectSummary) => void;

  renameProjectFromList: (filePath: string, newName: string) => Promise<void>;

  cancelDeleteProject: () => void;

  confirmDeleteProject: () => Promise<void>;

}



async function promptSaveAs(defaultName: string): Promise<string | null> {

  const defaultPath = await resolveDefaultSavePath(softwareDataPathStore, defaultName);

  const selected = await save({

    filters: [{ name: "像素画项目", extensions: ["pixelart.json"] }],

    defaultPath: defaultPath ?? `${defaultName}.pixelart.json`,

  });

  return selected ?? null;

}

function buildPatternDrawOptions(
  state: Pick<
    AppState,
    | "activeTool"
    | "toolSettings"
    | "activePatternBrushId"
    | "patternBrushPixelsCache"
    | "foregroundColor"
    | "backgroundColor"
    | "patternBrushAnchorForegroundColor"
  >,
  button: DrawingButton,
): DrawToolOptions | undefined {
  if (state.activeTool !== "brush" || state.toolSettings.brushShape !== "pattern") {
    return undefined;
  }
  if (!state.activePatternBrushId || state.toolSettings.patternBrushScale === 0) {
    return undefined;
  }
  const source = state.patternBrushPixelsCache[state.activePatternBrushId];
  if (!source) return undefined;

  const applyForegroundTint =
    state.patternBrushAnchorForegroundColor !== null &&
    rgbKey(state.foregroundColor) !== rgbKey(state.patternBrushAnchorForegroundColor);

  return {
    patternStamp: {
      source,
      drawMode: button === "primary" ? "foreground" : "background",
      foregroundColor: state.foregroundColor,
      backgroundColor: state.backgroundColor,
      applyForegroundTint,
    },
  };
}

function isPatternBrushActive(state: Pick<AppState, "activeTool" | "toolSettings">): boolean {
  return state.activeTool === "brush" && state.toolSettings.brushShape === "pattern";
}

function resolveLayerLocalGrid(surface: WritableCanvasSurface): PixelGrid {
  if (surface instanceof LayerProjectedSurface) return surface.underlyingGrid;
  if (surface instanceof MaskedPixelGrid) return surface.getUnderlyingGrid();
  return surface;
}

function toPointerModifiers(modifiers: {
  shiftKey: boolean;
  altKey: boolean;
}): PointerModifiers {
  return { shiftKey: modifiers.shiftKey, altKey: modifiers.altKey };
}

function prepareActiveLayerProjectForDrawing(
  project: Project,
  activeTool: ToolType,
  toolSettings: ToolSettings,
  firstPoint: Point,
  secondPoint?: Point,
  modifiers?: PointerModifiers,
): Project {
  const canvasPoints = secondPoint ? [firstPoint, secondPoint] : [firstPoint];
  if (activeTool === "fill") {
    return ensureActiveLayerCoversCanvasInProject(project);
  }
  if (!isDrawingToolType(activeTool) || canvasPoints.length === 0) return project;

  let expandPoints = canvasPoints;
  if (activeTool === "brush" || activeTool === "eraser") {
    const half = Math.floor(toolSettings.brushSize / 2);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of canvasPoints) {
      minX = Math.min(minX, p.x - half);
      minY = Math.min(minY, p.y - half);
      maxX = Math.max(maxX, p.x + half);
      maxY = Math.max(maxY, p.y + half);
    }
    expandPoints = [
      { x: minX, y: minY },
      { x: maxX, y: maxY },
    ];
  } else if (activeTool === "shape" && canvasPoints.length >= 2) {
    const [origin, pointer] = canvasPoints;
    expandPoints = shapeDragBoundingPoints(
      origin,
      pointer,
      toolSettings.shapeMode,
      modifiers ?? { altKey: false },
    );
  }

  return ensureActiveLayerContainsCanvasPointsInProject(project, expandPoints);
}

function withFloatingSelectionLayerExpand(
  project: Project,
  selection: SelectionState | null,
): Project {
  return ensureActiveLayerContainsFloatingSelectionInProject(project, selection);
}

function resolveTileDrawParams(
  tileSession: TileSessionState,
  activeTool: ToolType,
  grid: WritableCanvasSurface,
  point?: Point,
): {
  selectionMask: SelectionMask;
  tileRegion: SelectionRect;
} | null {
  if (tileSession.phase !== "drawing" || !isDrawingToolType(activeTool)) {
    return null;
  }

  const { region } = tileSession;
  const unionMask = createTileUnionMask(region, grid.width, grid.height);
  const selectionMask =
    activeTool === "fill" && point
      ? (createTileCellMask(point.x, point.y, region, grid.width, grid.height) ?? unionMask)
      : unionMask;

  return { selectionMask, tileRegion: region };
}

function mergeDrawOptions(
  base: DrawToolOptions | undefined,
  tileRegion: SelectionRect | undefined,
  pointerModifiers?: PointerModifiers,
): DrawToolOptions | undefined {
  if (!tileRegion && !pointerModifiers) return base;
  return {
    ...base,
    ...(tileRegion ? { tileRegion } : {}),
    ...(pointerModifiers ? { pointerModifiers } : {}),
  };
}

function initializeCanvasSessionMaps(project: Project): {
  selectionByCanvas: Record<string, SelectionState | null>;
  symmetryByCanvas: Record<string, SymmetryConfig>;
  tileSessionByCanvas: Record<string, TileSessionState>;
} {
  const selectionByCanvas: Record<string, SelectionState | null> = {};
  const symmetryByCanvas: Record<string, SymmetryConfig> = {};
  const tileSessionByCanvas: Record<string, TileSessionState> = {};

  for (const canvas of project.board.canvases) {
    selectionByCanvas[canvas.id] = null;
    const origin = createCenteredOrigin(canvas.width, canvas.height);
    symmetryByCanvas[canvas.id] = {
      ...createDefaultSymmetryConfig(),
      originX: origin.originX,
      originY: origin.originY,
    };
    tileSessionByCanvas[canvas.id] = createIdleTileSession();
  }

  return { selectionByCanvas, symmetryByCanvas, tileSessionByCanvas };
}

function loadActiveCanvasSession(
  project: Project,
  maps: {
    selectionByCanvas: Record<string, SelectionState | null>;
    symmetryByCanvas: Record<string, SymmetryConfig>;
    tileSessionByCanvas: Record<string, TileSessionState>;
  },
): {
  selection: SelectionState | null;
  symmetry: SymmetryConfig;
  tileSession: TileSessionState;
} {
  const canvas = getActiveCanvas(project);
  const origin = createCenteredOrigin(canvas.width, canvas.height);
  const defaultSymmetry = {
    ...createDefaultSymmetryConfig(),
    originX: origin.originX,
    originY: origin.originY,
  };
  return {
    selection: maps.selectionByCanvas[canvas.id] ?? null,
    symmetry: maps.symmetryByCanvas[canvas.id] ?? defaultSymmetry,
    tileSession: maps.tileSessionByCanvas[canvas.id] ?? createIdleTileSession(),
  };
}

function saveActiveCanvasSession(
  project: Project,
  selection: SelectionState | null,
  symmetry: SymmetryConfig,
  tileSession: TileSessionState,
  maps: {
    selectionByCanvas: Record<string, SelectionState | null>;
    symmetryByCanvas: Record<string, SymmetryConfig>;
    tileSessionByCanvas: Record<string, TileSessionState>;
  },
): {
  selectionByCanvas: Record<string, SelectionState | null>;
  symmetryByCanvas: Record<string, SymmetryConfig>;
  tileSessionByCanvas: Record<string, TileSessionState>;
} {
  const canvasId = getActiveCanvas(project).id;
  return {
    selectionByCanvas: { ...maps.selectionByCanvas, [canvasId]: selection },
    symmetryByCanvas: { ...maps.symmetryByCanvas, [canvasId]: symmetry },
    tileSessionByCanvas: { ...maps.tileSessionByCanvas, [canvasId]: tileSession },
  };
}

function reconcileCanvasSessionMaps(
  project: Project,
  existing: {
    selectionByCanvas: Record<string, SelectionState | null>;
    symmetryByCanvas: Record<string, SymmetryConfig>;
    tileSessionByCanvas: Record<string, TileSessionState>;
  },
  focusSelection: SelectionState | null,
  focusCanvasId: string,
): {
  selectionByCanvas: Record<string, SelectionState | null>;
  symmetryByCanvas: Record<string, SymmetryConfig>;
  tileSessionByCanvas: Record<string, TileSessionState>;
} {
  const selectionByCanvas: Record<string, SelectionState | null> = {};
  const symmetryByCanvas: Record<string, SymmetryConfig> = {};
  const tileSessionByCanvas: Record<string, TileSessionState> = {};

  for (const canvas of project.board.canvases) {
    selectionByCanvas[canvas.id] =
      canvas.id === focusCanvasId
        ? focusSelection
        : (existing.selectionByCanvas[canvas.id] ?? null);
    const origin = createCenteredOrigin(canvas.width, canvas.height);
    symmetryByCanvas[canvas.id] = existing.symmetryByCanvas[canvas.id] ?? {
      ...createDefaultSymmetryConfig(),
      originX: origin.originX,
      originY: origin.originY,
    };
    tileSessionByCanvas[canvas.id] =
      existing.tileSessionByCanvas[canvas.id] ?? createIdleTileSession();
  }

  return { selectionByCanvas, symmetryByCanvas, tileSessionByCanvas };
}

export function getActiveCanvasSelection(
  state: Pick<AppState, "project" | "selectionByCanvas" | "selection">,
): SelectionState | null {
  if (!state.project) return null;
  const canvasId = getActiveCanvas(state.project).id;
  return state.selectionByCanvas[canvasId] ?? state.selection;
}

type ActivePluginPage =
  | "pixelRestore"
  | "colorEdit"
  | "colorVariation"
  | "world"
  | "comfyui";

function closeOtherPluginPages(except?: ActivePluginPage): void {
  if (except !== "pixelRestore") {
    usePixelRestoreStore.getState().closePage();
  }
  if (except !== "colorEdit") {
    useColorEditStore.getState().closePage();
  }
  if (except !== "colorVariation") {
    useColorVariationAnalysisStore.getState().closePage();
  }
  if (except !== "world") {
    useWorldStore.getState().closePage();
  }
  if (except !== "comfyui") {
    useComfyUiStore.getState().closePage();
  }
}

const compositeRenderCache = new CompositeCache();

export const useAppStore = create<AppState>((set, get) => {

  const assetLibrarySlice = createAssetLibrarySlice(
    set as Parameters<typeof createAssetLibrarySlice>[0],
    get,
    {
      pathStore: softwareDataPathStore,
      assetRepository: assetLibraryRepository,
      clipboard: clipboardService,
      imageProcessor,
    },
  );

  const patternBrushSlice = createPatternBrushSlice(
    set as Parameters<typeof createPatternBrushSlice>[0],
    get,
    {
      pathStore: softwareDataPathStore,
      patternBrushRepository,
    },
  );

  const settingsSlice = createSettingsSlice(
    set as Parameters<typeof createSettingsSlice>[0],
  );

  const helpSlice = createHelpSlice(
    set as Parameters<typeof createHelpSlice>[0],
  );

  const appSettingsSlice = createAppSettingsSlice(
    set as Parameters<typeof createAppSettingsSlice>[0],
    get,
    appSettingsRepository,
  );

  const llmSettingsSlice = createLlmSettingsSlice(
    set as Parameters<typeof createLlmSettingsSlice>[0],
    get,
    llmSettingsRepository,
  );

  const palettePresetSlice = createPalettePresetSlice(
    set as Parameters<typeof createPalettePresetSlice>[0],
    get,
    {
      pathStore: softwareDataPathStore,
      palettePresetRepository,
      imageProcessor,
    },
  );

  const luminancePaletteSlice = createLuminancePaletteSlice(
    set as Parameters<typeof createLuminancePaletteSlice>[0],
    get as Parameters<typeof createLuminancePaletteSlice>[1],
  );

  const luminancePalettePresetSlice = createLuminancePalettePresetSlice(
    set as Parameters<typeof createLuminancePalettePresetSlice>[0],
    get as Parameters<typeof createLuminancePalettePresetSlice>[1],
    {
      pathStore: softwareDataPathStore,
      luminancePalettePresetRepository,
    },
  );

  const workspaceRegionSlice = createWorkspaceRegionSlice(
    set as Parameters<typeof createWorkspaceRegionSlice>[0],
    get,
  );

  return {

  ...assetLibrarySlice,

  ...patternBrushSlice,

  ...settingsSlice,

  ...helpSlice,

  ...appSettingsSlice,

  ...llmSettingsSlice,

  ...palettePresetSlice,

  ...luminancePaletteSlice,

  ...luminancePalettePresetSlice,

  ...workspaceRegionSlice,

  project: createBlankProjectWithPreferences(
    appSettingsSlice.appSettings,
    palettePresetSlice.palettePresetLibrary,
  ),

  activeTool: "brush",

  toolSettings: { ...DEFAULT_TOOL_SETTINGS },

  foregroundColor: rgba(255, 0, 0),

  backgroundColor: TRANSPARENT,

  zoom: 8,

  fitActiveCanvasNonce: 0,

  alwaysOnTop: false,

  isDrawing: false,

  drawStart: null,

  lastPoint: null,

  drawingButton: null,

  drawingColor: null,

  drawingStrokeSession: null,

  canvasRenderNonce: 0,

  brushLineAnchor: null,

  manualScaleOverride: null,

  detectedScale: 1,

  layersPanelTab: "drawing",

  drawingLayerClipboard: null,

  paletteViewMode: "grid",

  colorPickerMode: "oklch",

  colorPickerLayoutOrientation: "vertical",

  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,

  splitPaneRatio: DEFAULT_SPLIT_PANE_RATIO,

  isCapturing: false,

  captureError: null,

  monitorPickerOpen: false,

  availableMonitors: [],

  projectManagerOpen: false,

  softwareDataPath: softwareDataPathStore.getPath(),

  projectSummaries: [],

  projectListLoading: false,

  deleteConfirmTarget: null,

  projectManagerError: null,

  navigator: {
    visible: false,
    position: { x: 16, y: 16 },
    size: { width: NAVIGATOR_DEFAULT_WIDTH, height: NAVIGATOR_DEFAULT_HEIGHT },
    previewScale: 1,
    previewPan: { x: 0, y: 0 },
    edgeAnchor: { ...DEFAULT_PANEL_EDGE_ANCHOR },
    followViewport: false,
  },

  floatingPanelStack: ["navigator", "colorPicker", "comfyRunner", "luminancePalette"],

  mousePositionOverlayVisible: false,

  canvasDisplayMode: "normal",

  floatingColorPicker: {
    visible: false,
    position: { x: 16, y: 16 },
    activeSlot: "foreground",
    panelWidth: getFloatingColorPickerPanelDimensions("vertical").width,
    panelHeight: getFloatingColorPickerPanelDimensions("vertical").height,
    edgeAnchor: { ...DEFAULT_PANEL_EDGE_ANCHOR },
  },

  viewportSnapshot: null,

  viewportContainer: null,

  cropEditorLayerId: null,

  importTargetLayerId: null,

  canvasSizeModalOpen: false,

  exportImageModalOpen: false,

  imageExportPreferences: DEFAULT_IMAGE_EXPORT_PREFERENCES,

  historyStack: new HistoryStack(),

  selection: null,

  selectionDrag: null,

  lassoPoints: [],

  selectionPreviewRect: null,

  internalClipboard: null,

  symmetry: createDefaultSymmetryConfig(),

  symmetryAxisDrag: null,

  tileSession: createIdleTileSession(),

  tileCreateDrag: null,

  tilePreviewRect: null,

  selectionByCanvas: {},

  symmetryByCanvas: {},

  tileSessionByCanvas: {},



  init: async () => {

    isHydratingPreferences = true;
    setUserDataHydrating(true);
    setAppSettingsHydrating(true);

    const softwareDataPath = softwareDataPathStore.getPath();
    set({ softwareDataPath });
    setActiveSoftwareDataPath(softwareDataPath);

    if (softwareDataPath) {
      await migrateUserDataFromLocalStorage(softwareDataPath);

      const [
        prefs,
        appSettings,
        imageExportRaw,
        alwaysOnTop,
        colorVariationPrefs,
        agentProfiles,
        fieldPromptConfigs,
        llmSettingsStore,
      ] =
        await Promise.all([
        loadEditorPreferences(editorPreferencesRepository, softwareDataPath),
        loadAppSettings(appSettingsRepository, softwareDataPath),
        imageExportPreferencesRepository.load(softwareDataPath),
        windowService.getStoredPreference(softwareDataPath),
        loadColorVariationAnalysisPreferences(
          colorVariationAnalysisPreferencesRepository,
          softwareDataPath,
        ),
        loadAgentProfiles(agentProfileRepository, softwareDataPath),
        loadFieldPromptConfigs(fieldPromptConfigRepository, softwareDataPath),
        loadLlmSettings(llmSettingsRepository, softwareDataPath),
      ]);

      set({
        appSettings,
        imageExportPreferences: parseImageExportPreferences(imageExportRaw),
        llmSettingsStore,
      });

      useColorVariationAnalysisStore.getState().hydratePreferences(colorVariationPrefs);
      useAiTextFieldSessionStore.getState().hydrateUserData(agentProfiles, fieldPromptConfigs);

      if (prefs) {

        const current = get();

        set({

          activeTool: prefs.activeTool,

          toolSettings: prefs.toolSettings,

          foregroundColor: prefs.foregroundColor,

          backgroundColor: prefs.backgroundColor,

          zoom: prefs.zoom,

          paletteViewMode: prefs.paletteViewMode,

          colorPickerMode: prefs.colorPickerMode,

          colorPickerLayoutOrientation: prefs.colorPickerLayoutOrientation,

          sidebarWidth: prefs.sidebarWidth,

          splitPaneRatio: prefs.splitPaneRatio,

          navigator: {

            ...current.navigator,

            visible: prefs.navigatorLayout.visible,

            position: prefs.navigatorLayout.position,

            size: prefs.navigatorLayout.size,

            edgeAnchor: prefs.navigatorLayout.edgeAnchor,

            followViewport: prefs.navigatorLayout.followViewport,

            previewScale: 1,

            previewPan: { x: 0, y: 0 },

          },

          floatingColorPicker: {
            ...current.floatingColorPicker,
            visible: prefs.floatingColorPickerLayout.visible,
            position: prefs.floatingColorPickerLayout.position,
            panelWidth: prefs.floatingColorPickerLayout.panelWidth,
            panelHeight: prefs.floatingColorPickerLayout.panelHeight,
            activeSlot: prefs.floatingColorPickerLayout.activeSlot,
            edgeAnchor: prefs.floatingColorPickerLayout.edgeAnchor,
          },

          luminancePalettePanel: {

            ...current.luminancePalettePanel,

            visible: prefs.luminancePaletteLayout.visible,

            position: prefs.luminancePaletteLayout.position,

            panelWidth: prefs.luminancePaletteLayout.panelWidth,

            panelHeight: prefs.luminancePaletteLayout.panelHeight,

            edgeAnchor: prefs.luminancePaletteLayout.edgeAnchor,

          },

          mousePositionOverlayVisible: prefs.mousePositionOverlayVisible,

          canvasDisplayMode: prefs.canvasDisplayMode,

          assetLibraryDrawerExpanded: prefs.assetLibraryDrawerExpanded,

          assetLibraryDrawerHeight: prefs.assetLibraryDrawerHeight,

          assetFolderTreeWidth: prefs.assetFolderTreeWidth,

          symmetry: prefs.symmetry,

          activePatternBrushId: prefs.activePatternBrushId,

          patternBrushAnchorForegroundColor:
            prefs.activePatternBrushId && prefs.toolSettings.brushShape === "pattern"
              ? prefs.foregroundColor
              : null,

        });

      }

      if (alwaysOnTop) {

        await windowService.setAlwaysOnTop(true, softwareDataPath);

        set({ alwaysOnTop: true });

      }
    }

    void get().refreshPatternBrushLibrary();

    void get().loadPalettePresets();

    void get().loadLuminancePalettePresets();

    isHydratingPreferences = false;
    setUserDataHydrating(false);
    setAppSettingsHydrating(false);

    if (softwareDataPath) {
      const lastProject = await openLastProjectOnStartup(
        lastOpenedProjectStore,
        projectRepository,
        softwareDataPath,
      );

      if (lastProject) {

        get().historyStack.clear();

        const sessionMaps = initializeCanvasSessionMaps(lastProject);
        const session = loadActiveCanvasSession(lastProject, sessionMaps);

        set({

          project: lastProject,

          manualScaleOverride: null,

          detectedScale: getActiveCanvas(lastProject).scaleFactor,

          projectManagerOpen: false,

          deleteConfirmTarget: null,

          projectManagerError: null,

          ...sessionMaps,

          selection: session.selection,

          symmetry: session.symmetry,

          tileSession: session.tileSession,

          selectionDrag: null,

          lassoPoints: [],

          selectionPreviewRect: null,

        });

        return;

      }
    }

    const { project } = get();

    if (project && isUnsavedEmptyProject(project)) {

      get().openProjectManager();

    }

  },



  newProject: async () => {

    const { project } = get();

    if (project && getPersistedProjectPath(project)) {
      const saved = await get().saveCurrentProject();
      if (!saved) return;
    }

    get().createBlankProject();

  },



  createBlankProject: () => {

    get().historyStack.clear();

    const appSettings = get().appSettings;
    const palettePresetLibrary = get().palettePresetLibrary;
    const project = createBlankProjectWithPreferences(appSettings, palettePresetLibrary);
    const sessionMaps = initializeCanvasSessionMaps(project);
    const session = loadActiveCanvasSession(project, sessionMaps);

    set({

      project,

      manualScaleOverride: null,

      detectedScale: 1,

      projectManagerOpen: false,

      deleteConfirmTarget: null,

      projectManagerError: null,

      ...sessionMaps,

      selection: session.selection,

      symmetry: session.symmetry,

      tileSession: session.tileSession,

      selectionDrag: null,

      lassoPoints: [],

      selectionPreviewRect: null,

      internalClipboard: null,

      brushLineAnchor: null,

    });

    get().resetSymmetryToCenter();

  },



  openProject: async () => {

    const selected = await open({

      multiple: false,

      filters: [{ name: "像素画项目", extensions: ["pixelart.json", "json"] }],

    });

    if (!selected || typeof selected !== "string") return;

    const softwareDataPath = get().softwareDataPath ?? softwareDataPathStore.getPath();
    const project = await loadProject(projectRepository, selected, softwareDataPath);

    if (softwareDataPath) {
      await saveLastOpenedProject(lastOpenedProjectStore, softwareDataPath, selected);
    }

    get().historyStack.clear();

    const sessionMaps = initializeCanvasSessionMaps(project);
    const session = loadActiveCanvasSession(project, sessionMaps);

    set({

      project,

      manualScaleOverride: null,

      detectedScale: getActiveCanvas(project).scaleFactor,

      projectManagerOpen: false,

      deleteConfirmTarget: null,

      projectManagerError: null,

      ...sessionMaps,

      selection: session.selection,

      symmetry: session.symmetry,

      tileSession: session.tileSession,

      selectionDrag: null,

      lassoPoints: [],

      selectionPreviewRect: null,

      brushLineAnchor: null,

    });

    get().resetSymmetryToCenter();

  },



  saveCurrentProject: async () => {

    const activeGrid = get().getActiveLayerGrid();
    if (activeGrid) {
      get().syncActiveLayer(activeGrid);
    }

    const { project } = get();

    if (!project) return false;

    const result = await saveCurrentProjectUseCase(

      projectRepository,

      softwareDataPathStore,

      lastOpenedProjectStore,

      project,

    );

    set({ softwareDataPath: softwareDataPathStore.getPath() });

    if (!result.saved || !result.project) {
      switch (result.reason) {
        case "noSoftwareDataPath":
          toast.info("请先选择软件数据路径");
          get().openProjectManager();
          break;
        case "accessDenied":
          toast.error("无法访问项目目录，请重新授权");
          break;
        case "ioError":
        default:
          toast.error("保存失败，请检查目录权限");
          break;
      }
      return false;
    }

    const savedProject = result.project;

    set((state) => {
      if (!state.project || state.project.id !== savedProject.id) {
        return {};
      }

      return {
        project: withProjectFilePath(state.project, savedProject.filePath),
      };
    });

    if (softwareDataPathStore.getPath()) {

      await get().refreshProjectList();

    }

    toast.info("保存成功");

    return true;

  },



  saveProjectAs: async () => {

    const { project } = get();

    if (!project) return false;

    const defaultPath = await resolveDefaultSavePath(softwareDataPathStore, project.name);

    const selected = await save({

      filters: [{ name: "像素画项目", extensions: ["pixelart.json"] }],

      defaultPath: defaultPath ?? `${project.name}.pixelart.json`,

    });

    if (!selected || typeof selected !== "string") return false;

    const softwareDataPath = get().softwareDataPath ?? softwareDataPathStore.getPath();
    const saved = await saveProject(
      projectRepository,
      project,
      selected,
      softwareDataPath,
    );

    if (softwareDataPath) {
      await saveLastOpenedProject(lastOpenedProjectStore, softwareDataPath, selected);
    }

    set((state) => {
      if (!state.project || state.project.id !== saved.id) {
        return {};
      }

      return {
        project: withProjectFilePath(state.project, saved.filePath),
      };
    });

    if (softwareDataPathStore.getPath()) {

      await get().refreshProjectList();

    }

    return true;

  },



  setActiveTool: (tool) => {
    const state = get();
    if (
      state.activeTool === "select" &&
      tool !== "select" &&
      state.selectionDrag?.mode === "create" &&
      state.project
    ) {
      const grid = getActiveLayerProjectedSurfaceFromProject(state.project);
      if (grid) {
        const result = handleSelectPointerUp({
          project: state.project,
          point: state.selectionDrag.current,
          settings: state.toolSettings,
          selection: state.selection,
          selectionDrag: state.selectionDrag,
          lassoPoints: state.lassoPoints,
          modifiers: { shiftKey: false, altKey: false, ctrlKey: false, spaceKey: false },
          historyStack: state.historyStack,
          grid,
        });
        if (result.grid) get().syncActiveLayer(result.grid);
        set({
          selection: result.selection,
          selectionDrag: result.selectionDrag,
          lassoPoints: result.lassoPoints,
          selectionPreviewRect: result.selectionPreviewRect,
          isDrawing: false,
          drawingButton: null,
          drawStart: null,
          lastPoint: null,
        });
      }
    }

    if (
      state.activeTool === "repeatTile" &&
      tool !== "repeatTile" &&
      state.tileSession.phase === "creating"
    ) {
      set({
        tileSession: createIdleTileSession(),
        tilePreviewRect: null,
        tileCreateDrag: null,
      });
    }

    const { selection, project } = get();
    if (selection?.floating && project) {
      const { project: committedProject, selection: committedSelection } =
        commitFloatingSelectionInProject(project, selection);
      set({ project: committedProject, selection: committedSelection });
    }
    set({ activeTool: tool, brushLineAnchor: tool === "brush" ? get().brushLineAnchor : null });
  },

  beginTileRegionCreate: () => {
    set({
      tileSession: { ...get().tileSession, phase: "creating" },
      tilePreviewRect: null,
      tileCreateDrag: null,
    });
  },

  cancelTileRegionCreate: () => {
    set({
      tileSession: createIdleTileSession(),
      tilePreviewRect: null,
      tileCreateDrag: null,
    });
  },

  closeTileSession: () => {
    const { project, tileSession, historyStack, selection } = get();
    if (!project || tileSession.phase !== "drawing") return;

    const grid = getActiveLayerProjectedSurfaceFromProject(project);
    if (!grid) return;

    pushHistory(historyStack, project, selection);
    const nextSession = closeTileSessionUseCase(grid, tileSession);
    get().syncActiveLayer(grid);
    set({
      tileSession: nextSession,
      tilePreviewRect: null,
      tileCreateDrag: null,
    });
  },



  setToolSettings: (settings) =>
    set((s) => {
      const next = { ...s.toolSettings, ...settings };
      if (settings.brushSize !== undefined) {
        next.brushSize = clampStampSize(settings.brushSize);
      }
      if (settings.eraserSize !== undefined) {
        next.eraserSize = clampStampSize(settings.eraserSize);
      }
      if (settings.magicWandTolerance !== undefined) {
        next.magicWandTolerance = clampMagicWandTolerance(settings.magicWandTolerance);
      }
      if (settings.fillTolerance !== undefined) {
        next.fillTolerance = clampFillTolerance(settings.fillTolerance);
      }
      if (settings.patternBrushScale !== undefined) {
        next.patternBrushScale = clampPatternScale(settings.patternBrushScale);
      }
      if (settings.canvasResizeStep !== undefined) {
        next.canvasResizeStep = clampCanvasResizeStep(settings.canvasResizeStep);
      }
      const patch: Partial<AppState> = { toolSettings: next };
      if (
        next.brushShape === "pattern" &&
        s.activePatternBrushId &&
        s.patternBrushAnchorForegroundColor === null
      ) {
        patch.patternBrushAnchorForegroundColor = s.foregroundColor;
      }
      return patch;
    }),



  toggleSymmetryHorizontal: () =>
    set((s) => ({
      symmetry: { ...s.symmetry, horizontal: !s.symmetry.horizontal },
    })),

  toggleSymmetryVertical: () =>
    set((s) => ({
      symmetry: { ...s.symmetry, vertical: !s.symmetry.vertical },
    })),

  resetSymmetryToCenter: () => {
    const { project } = get();
    if (!project) return;
    const origin = createCenteredOrigin(
      getActiveCanvas(project).width,
      getActiveCanvas(project).height,
    );
    set({
      symmetry: {
        ...get().symmetry,
        originX: origin.originX,
        originY: origin.originY,
      },
    });
  },

  setSymmetryOrigin: (originX, originY) => {
    const { symmetry } = get();
    if (!Number.isFinite(originX) || !Number.isFinite(originY)) return;
    set({
      symmetry: {
        ...symmetry,
        originX: snapSymmetryOrigin(originX),
        originY: snapSymmetryOrigin(originY),
      },
    });
  },

  beginSymmetryAxisDrag: (axis) => set({ symmetryAxisDrag: axis }),

  endSymmetryAxisDrag: () => set({ symmetryAxisDrag: null }),



  setForegroundColor: (color) => set({ foregroundColor: color }),

  setBackgroundColor: (color) => set({ backgroundColor: color }),

  setColorSlot: (slot, color) => {
    set(slot === "foreground" ? { foregroundColor: color } : { backgroundColor: color });
    syncLuminanceLiveEditFromColorPicker(get, set, color);
  },



  setZoom: (zoom) => set({ zoom: clampEditorZoom(zoom) }),

  requestFitActiveCanvasInViewport: () => {
    const { project, cropEditorLayerId } = get();
    if (!project || cropEditorLayerId) return;
    set({ fitActiveCanvasNonce: get().fitActiveCanvasNonce + 1 });
  },

  toggleGrid: () =>

    set((s) => ({

      project: s.project

        ? { ...s.project, grid: { ...s.project.grid, visible: !s.project.grid.visible } }

        : null,

    })),

  setOrthographicViewEnabled: (enabled) =>
    set((s) => ({
      project: s.project ? withOrthographicView(s.project, { enabled }) : null,
    })),

  setOrthographicCameraAngle: (angle) =>
    set((s) => ({
      project: s.project
        ? withOrthographicView(s.project, { cameraAngle: clampCameraAngle(angle) })
        : null,
    })),

  toggleMousePositionOverlay: () =>
    set((s) => ({ mousePositionOverlayVisible: !s.mousePositionOverlayVisible })),

  toggleCanvasDisplayMode: () =>
    set((s) => ({
      canvasDisplayMode: s.canvasDisplayMode === "oklchLightness" ? "normal" : "oklchLightness",
    })),

  toggleNavigator: () =>

    set((s) => {

      const nextVisible = !s.navigator.visible;

      if (!nextVisible) {

        return { navigator: { ...s.navigator, visible: false } };

      }

      const container = s.viewportContainer;

      if (!container) {

        return { navigator: { ...s.navigator, visible: true } };

      }

      const panelWidth = s.navigator.size.width;

      const panelHeight = s.navigator.size.height + NAVIGATOR_HEADER_HEIGHT;

      const isDefaultPosition =

        s.navigator.position.x === 16 && s.navigator.position.y === 16;

      const position = isDefaultPosition

        ? {

            x: Math.max(0, container.clientWidth - panelWidth - 16),

            y: Math.max(0, container.clientHeight - panelHeight - 16),

          }

        : s.navigator.position;

      const edgeAnchor = isDefaultPosition

        ? { horizontal: "right" as const, vertical: "bottom" as const }

        : s.navigator.edgeAnchor;

      return {

        navigator: {

          ...s.navigator,

          visible: true,

          edgeAnchor,

          position: {

            x: Math.min(position.x, Math.max(0, container.clientWidth - panelWidth)),

            y: Math.min(position.y, Math.max(0, container.clientHeight - panelHeight)),

          },

        },

      };

    }),



  detachColorPicker: (slot, position, panelSize) =>
    set((s) => {
      const container = s.viewportContainer;
      const orientation = s.colorPickerLayoutOrientation;
      const estimated = getFloatingColorPickerPanelDimensions(orientation);
      const width = panelSize?.width ?? estimated.width;
      const height = panelSize?.height ?? estimated.height;
      const containerSize = getContainerDimensions(container);
      const panelDimensions = { width, height };
      const clamped = clampPanelPosition(
        position.x,
        position.y,
        width,
        height,
        containerSize?.width ?? null,
        containerSize?.height ?? null,
      );
      const edgeAnchor = containerSize
        ? detectEdgeAnchor(clamped, panelDimensions, containerSize)
        : DEFAULT_PANEL_EDGE_ANCHOR;
      return {
        floatingColorPicker: {
          visible: true,
          activeSlot: slot,
          position: clamped,
          panelWidth: width,
          panelHeight: height,
          edgeAnchor,
        },
      };
    }),

  setFloatingColorPickerPosition: (x, y) =>
    set((s) => {
      const containerSize = getContainerDimensions(s.viewportContainer);
      const panelSize = {
        width: s.floatingColorPicker.panelWidth,
        height: s.floatingColorPicker.panelHeight,
      };
      const position = containerSize
        ? applyMagneticSnap({ x, y }, panelSize, containerSize).position
        : clampPanelPosition(
            x,
            y,
            panelSize.width,
            panelSize.height,
            null,
            null,
          );
      return {
        floatingColorPicker: {
          ...s.floatingColorPicker,
          position,
        },
      };
    }),

  setFloatingColorPickerPositionWithAnchor: (x, y, anchor) =>
    set((s) => {
      const containerSize = getContainerDimensions(s.viewportContainer);
      const panelSize = {
        width: s.floatingColorPicker.panelWidth,
        height: s.floatingColorPicker.panelHeight,
      };

      if (!containerSize) {
        return {
          floatingColorPicker: {
            ...s.floatingColorPicker,
            position: { x, y },
            ...(anchor ? { edgeAnchor: anchor } : {}),
          },
        };
      }

      const snapped = applyMagneticSnap({ x, y }, panelSize, containerSize);
      return {
        floatingColorPicker: {
          ...s.floatingColorPicker,
          position: snapped.position,
          edgeAnchor: anchor ?? snapped.anchor,
        },
      };
    }),

  setFloatingColorPickerPanelSize: (width, height) =>
    set((s) => {
      const containerSize = getContainerDimensions(s.viewportContainer);
      const panelSize = { width, height };
      const position = containerSize
        ? adaptPanelPositionOnResize(
            s.floatingColorPicker.position,
            panelSize,
            s.floatingColorPicker.edgeAnchor,
            containerSize,
          )
        : clampPanelPosition(
            s.floatingColorPicker.position.x,
            s.floatingColorPicker.position.y,
            width,
            height,
            null,
            null,
          );
      return {
        floatingColorPicker: {
          ...s.floatingColorPicker,
          panelWidth: width,
          panelHeight: height,
          position,
        },
      };
    }),

  setFloatingColorPickerSlot: (slot) =>
    set((s) => ({
      floatingColorPicker: {
        ...s.floatingColorPicker,
        activeSlot: slot,
      },
    })),

  closeFloatingColorPicker: () =>
    set((s) => ({
      floatingColorPicker: {
        ...s.floatingColorPicker,
        visible: false,
      },
    })),

  finalizeFloatingColorPickerDrag: () =>
    set((s) => {
      const containerSize = getContainerDimensions(s.viewportContainer);
      if (!containerSize) return {};

      const panelSize = {
        width: s.floatingColorPicker.panelWidth,
        height: s.floatingColorPicker.panelHeight,
      };
      const edgeAnchor = detectEdgeAnchor(
        s.floatingColorPicker.position,
        panelSize,
        containerSize,
      );

      return {
        floatingColorPicker: {
          ...s.floatingColorPicker,
          edgeAnchor,
        },
      };
    }),

  setNavigatorPosition: (x, y) =>
    set((s) => {
      const containerSize = getContainerDimensions(s.viewportContainer);
      const panelSize = getNavigatorPanelSize(s.navigator);
      const position = containerSize
        ? applyMagneticSnap({ x, y }, panelSize, containerSize).position
        : clampPanelPosition(
            x,
            y,
            panelSize.width,
            panelSize.height,
            null,
            null,
          );
      return {
        navigator: {
          ...s.navigator,
          position,
        },
      };
    }),

  setNavigatorPositionWithAnchor: (x, y, anchor) =>
    set((s) => {
      const containerSize = getContainerDimensions(s.viewportContainer);
      const panelSize = getNavigatorPanelSize(s.navigator);

      if (!containerSize) {
        return {
          navigator: {
            ...s.navigator,
            position: { x, y },
            ...(anchor ? { edgeAnchor: anchor } : {}),
          },
        };
      }

      const snapped = applyMagneticSnap({ x, y }, panelSize, containerSize);
      return {
        navigator: {
          ...s.navigator,
          position: snapped.position,
          edgeAnchor: anchor ?? snapped.anchor,
        },
      };
    }),

  finalizeNavigatorDrag: () =>
    set((s) => {
      const containerSize = getContainerDimensions(s.viewportContainer);
      if (!containerSize) return {};

      const edgeAnchor = detectEdgeAnchor(
        s.navigator.position,
        getNavigatorPanelSize(s.navigator),
        containerSize,
      );

      return {
        navigator: {
          ...s.navigator,
          edgeAnchor,
        },
      };
    }),

  bringFloatingPanelToFront: (id) =>
    set((s) => {
      const next = bringPanelToFront(s.floatingPanelStack, id);
      if (
        next.length === s.floatingPanelStack.length &&
        next[next.length - 1] === s.floatingPanelStack[s.floatingPanelStack.length - 1]
      ) {
        return {};
      }
      return { floatingPanelStack: next };
    }),

  adaptFloatingPanelsToViewport: () =>
    set((s) => {
      const containerSize = getContainerDimensions(s.viewportContainer);
      if (!containerSize) return {};

      const updates: Partial<
        Pick<AppState, "navigator" | "floatingColorPicker" | "luminancePalettePanel">
      > = {};

      if (s.navigator.visible) {
        updates.navigator = {
          ...s.navigator,
          position: adaptPanelPositionOnResize(
            s.navigator.position,
            getNavigatorPanelSize(s.navigator),
            s.navigator.edgeAnchor,
            containerSize,
          ),
        };
      }

      if (s.floatingColorPicker.visible) {
        updates.floatingColorPicker = {
          ...s.floatingColorPicker,
          position: adaptPanelPositionOnResize(
            s.floatingColorPicker.position,
            {
              width: s.floatingColorPicker.panelWidth,
              height: s.floatingColorPicker.panelHeight,
            },
            s.floatingColorPicker.edgeAnchor,
            containerSize,
          ),
        };
      }

      if (s.luminancePalettePanel.visible) {
        updates.luminancePalettePanel = {
          ...s.luminancePalettePanel,
          position: adaptPanelPositionOnResize(
            s.luminancePalettePanel.position,
            {
              width: s.luminancePalettePanel.panelWidth,
              height: s.luminancePalettePanel.panelHeight,
            },
            s.luminancePalettePanel.edgeAnchor,
            containerSize,
          ),
        };
      }

      return updates;
    }),



  setNavigatorSize: (width, height) =>

    set((s) => {

      const container = s.viewportContainer;

      const maxWidth = container

        ? Math.max(NAVIGATOR_MIN_WIDTH, container.clientWidth * 0.6)

        : width;

      const maxHeight = container

        ? Math.max(NAVIGATOR_MIN_HEIGHT, container.clientHeight * 0.6)

        : height;

      const nextWidth = Math.max(

        NAVIGATOR_MIN_WIDTH,

        Math.min(maxWidth, width),

      );

      const nextHeight = Math.max(

        NAVIGATOR_MIN_HEIGHT,

        Math.min(maxHeight, height),

      );

      const panelWidth = nextWidth;

      const panelHeight = nextHeight + NAVIGATOR_HEADER_HEIGHT;

      const maxX = container

        ? Math.max(0, container.clientWidth - panelWidth)

        : s.navigator.position.x;

      const maxY = container

        ? Math.max(0, container.clientHeight - panelHeight)

        : s.navigator.position.y;

      return {

        navigator: {

          ...s.navigator,

          size: { width: nextWidth, height: nextHeight },

          position: {

            x: Math.min(s.navigator.position.x, maxX),

            y: Math.min(s.navigator.position.y, maxY),

          },

        },

      };

    }),



  setNavigatorBounds: (x, y, width, height) =>

    set((s) => {

      const container = s.viewportContainer;

      const constraints = getNavigatorResizeConstraints(container);

      const nextWidth = Math.max(

        constraints.minWidth,

        Math.min(constraints.maxWidth, width),

      );

      const nextHeight = Math.max(

        constraints.minHeight,

        Math.min(constraints.maxHeight, height),

      );

      const panelWidth = nextWidth;

      const panelHeight = nextHeight + NAVIGATOR_HEADER_HEIGHT;

      const maxX = container

        ? Math.max(0, container.clientWidth - panelWidth)

        : x;

      const maxY = container

        ? Math.max(0, container.clientHeight - panelHeight)

        : y;

      return {

        navigator: {

          ...s.navigator,

          size: { width: nextWidth, height: nextHeight },

          position: {

            x: Math.max(0, Math.min(maxX, x)),

            y: Math.max(0, Math.min(maxY, y)),

          },

        },

      };

    }),



  setNavigatorPreviewScale: (scale) =>

    set((s) => ({

      navigator: {

        ...s.navigator,

        previewScale: clampPreviewScale(scale),

        followViewport: false,

      },

    })),



  zoomNavigatorPreviewAtPoint: (previewX, previewY, newScale) => {

    const { viewportSnapshot, navigator } = get();

    if (!viewportSnapshot) return;

    const { previewScale, previewPan } = zoomNavigatorPreviewAtPointUseCase(

      previewX,

      previewY,

      newScale,

      viewportSnapshot,

      toNavigatorLayout(navigator),

    );

    set({

      navigator: {

        ...navigator,

        previewScale,

        previewPan: { x: previewPan.panX, y: previewPan.panY },

        followViewport: false,

      },

    });

  },



  panNavigatorPreview: (deltaX, deltaY) =>

    set((s) => {

      const nextPan = applyPreviewPanDelta(

        s.navigator.previewPan.x,

        s.navigator.previewPan.y,

        deltaX,

        deltaY,

      );

      return {

        navigator: {

          ...s.navigator,

          previewPan: { x: nextPan.panX, y: nextPan.panY },

          followViewport: false,

        },

      };

    }),



  syncNavigatorToViewport: () => {

    const { viewportSnapshot, navigator } = get();

    if (!viewportSnapshot) return;

    const synced = applyNavigatorViewportSync(navigator, viewportSnapshot);

    if (!synced) return;

    set({ navigator: synced });

  },



  setNavigatorFollowViewport: (follow) => {

    const { viewportSnapshot, navigator } = get();

    if (!follow) {

      set({ navigator: { ...navigator, followViewport: false } });

      return;

    }

    const synced = viewportSnapshot

      ? applyNavigatorViewportSync(navigator, viewportSnapshot)

      : null;

    set({

      navigator: synced

        ? { ...synced, followViewport: true }

        : { ...navigator, followViewport: true },

    });

  },



  setViewportContainer: (el) => set({ viewportContainer: el }),



  syncViewportSnapshot: (options) => {

    const container = get().viewportContainer;

    if (!container) {

      set({ viewportSnapshot: null });

      return;

    }

    const canvasEl = options?.canvasEl ?? container.querySelector("canvas");

    if (!canvasEl && !options?.boardContent) return;

    const containerRect = container.getBoundingClientRect();

    const boardContent = options?.boardContent;
    const canvasRect = canvasEl?.getBoundingClientRect();

    const snapshot: ViewportSnapshot = boardContent
      ? {
          scrollX: container.scrollLeft,
          scrollY: container.scrollTop,
          containerWidth: container.clientWidth,
          containerHeight: container.clientHeight,
          canvasDisplayWidth: boardContent.width,
          canvasDisplayHeight: boardContent.height,
          canvasOffsetX: boardContent.left,
          canvasOffsetY: boardContent.top,
          pixelGridRect: options?.pixelGridRect,
        }
      : {
          scrollX: container.scrollLeft,
          scrollY: container.scrollTop,
          containerWidth: container.clientWidth,
          containerHeight: container.clientHeight,
          canvasDisplayWidth: canvasRect!.width,
          canvasDisplayHeight: canvasRect!.height,
          canvasOffsetX:
            canvasRect!.left - containerRect.left + container.scrollLeft,
          canvasOffsetY:
            canvasRect!.top - containerRect.top + container.scrollTop,
        };

    const { navigator } = get();
    if (navigator.followViewport) {
      const synced = applyNavigatorViewportSync(navigator, snapshot);
      if (synced) {
        set({ viewportSnapshot: snapshot, navigator: synced });
        return;
      }
    }

    set({ viewportSnapshot: snapshot });

  },



  navigateToPreviewPoint: (previewX, previewY) => {

    const { viewportSnapshot, viewportContainer, navigator } = get();

    if (!viewportSnapshot || !viewportContainer) return;

    const target = navigateToPreviewPointUseCase(

      previewX,

      previewY,

      viewportSnapshot,

      toNavigatorLayout(navigator),

      Math.max(0, viewportContainer.scrollWidth - viewportContainer.clientWidth),

      Math.max(0, viewportContainer.scrollHeight - viewportContainer.clientHeight),

    );

    if (!target) return;

    viewportContainer.scrollLeft = target.scrollX;

    viewportContainer.scrollTop = target.scrollY;

    const prev = get().viewportSnapshot;
    get().syncViewportSnapshot(
      prev
        ? {
            boardContent: {
              left: prev.canvasOffsetX,
              top: prev.canvasOffsetY,
              width: prev.canvasDisplayWidth,
              height: prev.canvasDisplayHeight,
            },
            pixelGridRect: prev.pixelGridRect,
          }
        : undefined,
    );

  },



  toggleAlwaysOnTop: async () => {

    const softwareDataPath = get().softwareDataPath ?? softwareDataPathStore.getPath();
    if (!softwareDataPath) return;

    const next = !get().alwaysOnTop;

    await windowService.setAlwaysOnTop(next, softwareDataPath);

    set({ alwaysOnTop: next });

  },



  setManualScale: (scale) => set({ manualScaleOverride: scale }),



  reapplyScale: () => {
    // Reference layers no longer use pixel downscaling; scaleFactor is legacy metadata.
  },



  screenCapture: async () => {

    try {

      const monitors = await captureService.listMonitors();

      if (monitors.length === 0) {

        set({ captureError: "未找到可用显示器" });

        return;

      }

      set({ captureError: null });

      if (monitors.length === 1) {

        await get().captureMonitor(monitors[0].id);

      } else {

        set({ availableMonitors: monitors, monitorPickerOpen: true });

      }

    } catch {

      set({ captureError: "获取显示器列表失败" });

    }

  },



  captureMonitor: async (monitorId) => {

    const { project } = get();

    if (!project) return;

    set({ isCapturing: true, captureError: null, monitorPickerOpen: false });

    try {

      const result = await replaceProjectFromScreenCapture(

        projectRepository,

        project,

        captureService,

        imageProcessor,

        monitorId,

        `屏幕截图 ${new Date().toLocaleString()}`,

        promptSaveAs,

      );

      if (result) {
        invalidateReferenceLayerPixelCache(result.layerId);

        set({

          project: result.project,

          cropEditorLayerId: result.openCropEditor ? result.layerId : null,

        });

      }

    } catch {

      set({ captureError: "截图失败，请重试" });

    } finally {

      set({ isCapturing: false });

    }

  },



  closeMonitorPicker: () => set({ monitorPickerOpen: false }),



  clearCaptureError: () => set({ captureError: null }),



  windowCapture: async (windowId) => {

    const { project } = get();

    if (!project) return;

    set({ isCapturing: true, captureError: null });

    try {

      const result = await replaceProjectFromWindowCapture(

        projectRepository,

        project,

        captureService,

        imageProcessor,

        windowId,

        `窗口截图 ${new Date().toLocaleString()}`,

        promptSaveAs,

      );

      if (result) {
        invalidateReferenceLayerPixelCache(result.layerId);

        set({

          project: result.project,

          cropEditorLayerId: result.openCropEditor ? result.layerId : null,

        });

      }

    } catch {

      set({ captureError: "窗口截图失败，请重试" });

    } finally {

      set({ isCapturing: false });

    }

  },



  importImage: async () => {

    const selected = await open({

      multiple: false,

      filters: [

        { name: "图片", extensions: ["png", "jpg", "jpeg", "bmp", "gif", "webp"] },

      ],

    });

    if (!selected || typeof selected !== "string") return;



    const { project } = get();

    if (!project) return;

    set({ isCapturing: true, captureError: null });

    try {

      const result = await replaceProjectFromImagePath(

        projectRepository,

        project,

        imageProcessor,

        selected,

        `导入图片 ${new Date().toLocaleString()}`,

        promptSaveAs,

      );

      if (result) {
        invalidateReferenceLayerPixelCache(result.layerId);

        set({

          project: result.project,

          cropEditorLayerId: result.openCropEditor ? result.layerId : null,

        });

      }

    } catch {

      set({ captureError: "导入图片失败，请重试" });

    } finally {

      set({ isCapturing: false });

    }

  },



  pointerDown: (point, button, modifiers = { shiftKey: false, altKey: false, ctrlKey: false, spaceKey: false }) => {

    const {
      project,
      activeTool,
      foregroundColor,
      backgroundColor,
      toolSettings,
      selection,
      historyStack,
      brushLineAnchor,
      symmetry,
    } = get();

    if (!project) return;

    const activeLayer = getActiveLayer(project);
    if (isReferenceLayer(activeLayer)) return;

    const grid = getActiveLayerProjectedSurfaceFromProject(project);
    if (!grid) return;

    if (activeTool === "select") {
      const result = handleSelectPointerDown({
        project,
        grid,
        point,
        settings: toolSettings,
        selection,
        modifiers,
        historyStack,
        getReferencePixelCache: getReferenceLayerPixelCache,
      });
      let nextProject = project;
      if (result.selectionDrag?.mode === "move" && result.selection?.floating) {
        nextProject = withFloatingSelectionLayerExpand(project, result.selection);
      }
      if (result.grid) get().syncActiveLayer(result.grid);
      set({
        ...(nextProject !== project ? { project: nextProject } : {}),
        selection: result.selection,
        selectionDrag: result.selectionDrag,
        lassoPoints: result.lassoPoints,
        selectionPreviewRect: result.selectionPreviewRect,
        isDrawing: true,
        drawingButton: button,
        drawStart: point,
        lastPoint: point,
      });
      return;
    }

    if (activeTool === "transform") {
      const result = handleTransformPointerDown({
        project,
        grid,
        point,
        selection,
        historyStack,
        transformMode: toolSettings.transformMode,
        zoom: get().zoom,
      });
      if (result.grid) get().syncActiveLayer(result.grid);
      set({
        selection: result.selection,
        selectionDrag: result.selectionDrag,
        isDrawing: result.selectionDrag !== null,
        drawingButton: result.selectionDrag ? button : null,
        drawStart: point,
        lastPoint: point,
      });
      return;
    }

    if (activeTool === "repeatTile") {
      const { tileSession } = get();

      if (tileSession.phase === "creating") {
        const drag = handleTileCreatePointerDown(point);
        const { previewRect } = handleTileCreatePointerMove(drag, point);
        set({
          tileCreateDrag: drag,
          tilePreviewRect: previewRect,
          isDrawing: true,
          drawingButton: button,
          drawStart: point,
          lastPoint: point,
        });
      }

      return;
    }

    const tileSession = get().tileSession;
    const tileDraw = resolveTileDrawParams(tileSession, activeTool, grid, point);

    let selectionMask =
      selection && !isSelectionEmpty(selection) ? selection.mask : null;
    let activeSymmetry = isSymmetryActive(symmetry) ? symmetry : null;

    if (tileDraw) {
      selectionMask = tileDraw.selectionMask;
      activeSymmetry = null;
    }

    if (
      activeTool === "brush" &&
      toolSettings.brushShape !== "pattern" &&
      modifiers.shiftKey &&
      brushLineAnchor
    ) {
      const drawProject = prepareActiveLayerProjectForDrawing(
        project,
        activeTool,
        toolSettings,
        brushLineAnchor,
        point,
      );
      if (drawProject !== project) set({ project: drawProject });
      const drawGrid = getActiveLayerProjectedSurfaceFromProject(drawProject);

      pushHistory(historyStack, project, selection);
      const selectedColor = button === "primary" ? foregroundColor : backgroundColor;
      applyBrushStraightLine(
        drawGrid,
        selectedColor,
        toolSettings,
        brushLineAnchor,
        point,
        selectionMask,
        activeSymmetry,
        mergeDrawOptions(undefined, tileDraw?.tileRegion),
      );
      get().syncActiveLayer(drawGrid);
      set({ brushLineAnchor: point });
      return;
    }

    pushHistory(historyStack, project, selection);

    const selectedColor = button === "primary" ? foregroundColor : backgroundColor;
    const color = activeTool === "eraser" ? TRANSPARENT : selectedColor;

    if (!isDrawingToolType(activeTool)) return;

    if (isPatternBrushActive(get())) {
      const patternGrid = get().getActivePatternBrushGrid();
      if (!patternGrid) {
        toast.info("请先在图案笔刷库中选择笔刷");
        return;
      }
      if (toolSettings.patternBrushScale === 0) {
        return;
      }
    }

    const drawProject = prepareActiveLayerProjectForDrawing(
      project,
      activeTool,
      toolSettings,
      point,
    );
    if (drawProject !== project) set({ project: drawProject });
    const drawSession = beginDrawingStroke(drawProject);
    if (!drawSession) return;

    const drawOptions = mergeDrawOptions(
      buildPatternDrawOptions(get(), button),
      tileDraw?.tileRegion,
    );

    applyToolPointerDown(
      drawSession.surface,
      activeTool,
      color,
      toolSettings,
      point,
      selectionMask,
      activeSymmetry,
      drawOptions,
    );

    if (activeTool === "fill") {
      get().syncActiveLayer(drawSession.surface);
      set({
        isDrawing: true,
        drawStart: point,
        lastPoint: point,
        drawingButton: button,
        drawingColor: color,
        drawingStrokeSession: null,
      });
      return;
    }

    set({
      drawingStrokeSession: drawSession,
      isDrawing: true,
      drawStart: point,
      lastPoint: point,
      drawingButton: button,
      drawingColor: color,
      canvasRenderNonce: get().canvasRenderNonce + 1,
    });

  },



  pointerMove: (point, button, modifiers = { shiftKey: false, altKey: false, ctrlKey: false, spaceKey: false }) => {

    const {
      project,
      activeTool,
      toolSettings,
      isDrawing,
      drawStart,
      lastPoint,
      drawingButton,
      drawingColor,
      selection,
      selectionDrag,
      lassoPoints,
      symmetry,
      drawingStrokeSession,
    } = get();

    if (!project) return;

    if (isReferenceLayer(getActiveLayer(project))) return;

    if (activeTool === "select" && selectionDrag) {
      let workingProject = project;
      if (selectionDrag.mode === "move" && selection?.floating) {
        workingProject = withFloatingSelectionLayerExpand(project, selection);
      }
      const grid = getActiveLayerProjectedSurfaceFromProject(workingProject);
      if (!grid) return;

      const result = handleSelectPointerMove({
        project: workingProject,
        point,
        settings: toolSettings,
        selection,
        selectionDrag,
        lassoPoints,
        grid,
        modifiers,
        historyStack: get().historyStack,
      });
      if (result.grid) get().syncActiveLayer(result.grid);
      const expandedProject =
        result.selection?.floating && selectionDrag.mode === "move"
          ? withFloatingSelectionLayerExpand(workingProject, result.selection)
          : workingProject;
      set({
        ...(expandedProject !== project ? { project: expandedProject } : {}),
        selection: result.selection,
        selectionDrag: result.selectionDrag,
        lassoPoints: result.lassoPoints,
        selectionPreviewRect: result.selectionPreviewRect,
        lastPoint: point,
      });
      return;
    }

    const grid = getActiveLayerProjectedSurfaceFromProject(project);
    if (!grid) return;

    if (activeTool === "transform" && selectionDrag) {
      if (selectionDrag.mode === "layerPosition") {
        const activeLayer = getActiveLayer(project);
        if (isDrawingLayer(activeLayer)) {
          const nextPosition = resolveLayerPositionFromDrag(selectionDrag, point);
          if (nextPosition) {
            const updated = moveDrawingLayerInProjectUseCase(
              project,
              activeLayer.id,
              nextPosition,
            );
            if (updated) {
              set({
                project: updated,
                selectionDrag: { ...selectionDrag, current: point },
                lastPoint: point,
              });
            }
          }
        }
        return;
      }

      if (selection) {
      const result = handleTransformPointerMove({
        point,
        selection,
        selectionDrag,
        grid,
        shiftKey: modifiers.shiftKey,
        altKey: modifiers.altKey,
      });
      const expandedProject = result.selection.floating
        ? withFloatingSelectionLayerExpand(project, result.selection)
        : project;
      set({
        ...(expandedProject !== project ? { project: expandedProject } : {}),
        selection: result.selection,
        selectionDrag: result.selectionDrag,
      });
      }
      return;
    }

    if (activeTool === "repeatTile") {
      const { tileSession, tileCreateDrag } = get();

      if (tileSession.phase === "creating" && tileCreateDrag) {
        const { drag, previewRect } = handleTileCreatePointerMove(tileCreateDrag, point);
        set({
          tileCreateDrag: drag,
          tilePreviewRect: previewRect,
          lastPoint: point,
        });
      }

      return;
    }

    if (!isDrawing || !lastPoint || drawingButton !== button || drawingColor === null) return;

    if (activeTool === "fill") return;

    const tileSession = get().tileSession;
    const tileDraw = resolveTileDrawParams(tileSession, activeTool, grid);

    let selectionMask = getEffectiveSelectionMask(selection);
    let activeSymmetry = isSymmetryActive(symmetry) ? symmetry : null;

    if (tileDraw) {
      selectionMask = tileDraw.selectionMask;
      activeSymmetry = null;
    }

    if (!isDrawingToolType(activeTool)) return;

    const pointerModifiers = toPointerModifiers(modifiers);
    const layerExpandStart = activeTool === "shape" && drawStart ? drawStart : lastPoint;
    let workingProject = project;
    let session = drawingStrokeSession;
    const drawProject = prepareActiveLayerProjectForDrawing(
      workingProject,
      activeTool,
      toolSettings,
      layerExpandStart,
      point,
      activeTool === "shape" ? pointerModifiers : undefined,
    );

    if (session) {
      if (drawProject !== workingProject) {
        workingProject = commitDrawingStroke(workingProject, session);
        const expandedProject = prepareActiveLayerProjectForDrawing(
          workingProject,
          activeTool,
          toolSettings,
          layerExpandStart,
          point,
          activeTool === "shape" ? pointerModifiers : undefined,
        );
        session = beginDrawingStroke(expandedProject);
        set({ project: expandedProject, drawingStrokeSession: session });
      }
    } else if (drawProject !== workingProject) {
      set({ project: drawProject });
    }

    const drawGrid = session
      ? session.surface
      : getActiveLayerProjectedSurfaceFromProject(drawProject);

    const drawOptions = mergeDrawOptions(
      buildPatternDrawOptions(get(), drawingButton),
      tileDraw?.tileRegion,
      activeTool === "shape" ? pointerModifiers : undefined,
    );

    applyToolPointerMove(
      drawGrid,
      activeTool,
      drawingColor,
      toolSettings,
      lastPoint,
      point,
      selectionMask,
      activeSymmetry,
      drawOptions,
    );

    if (session) {
      set({ lastPoint: point, canvasRenderNonce: get().canvasRenderNonce + 1 });
      return;
    }

    get().syncActiveLayer(drawGrid);

    set({ lastPoint: point });

  },



  pointerUp: (point, button, modifiers = { shiftKey: false, altKey: false, ctrlKey: false, spaceKey: false }) => {

    const {
      project,
      activeTool,
      toolSettings,
      isDrawing,
      drawStart,
      lastPoint,
      drawingButton,
      drawingColor,
      selection,
      selectionDrag,
      lassoPoints,
      historyStack,
      symmetry,
      drawingStrokeSession,
    } = get();

    if (!project) return;

    if (isReferenceLayer(getActiveLayer(project))) return;

    const grid = getActiveLayerProjectedSurfaceFromProject(project);
    if (!grid) return;

    if (activeTool === "select" && selectionDrag) {
      const result = handleSelectPointerUp({
        project,
        point,
        settings: toolSettings,
        selection,
        selectionDrag,
        lassoPoints,
        modifiers,
        historyStack,
        grid,
      });
      if (result.project) {
        set({ project: result.project });
      } else if (result.grid) {
        get().syncActiveLayer(result.grid);
      }
      set({
        selection: result.selection,
        selectionDrag: result.selectionDrag,
        lassoPoints: result.lassoPoints,
        selectionPreviewRect: result.selectionPreviewRect,
        isDrawing: false,
        drawingButton: null,
        drawStart: null,
        lastPoint: null,
      });
      return;
    }

    if (activeTool === "transform" && selectionDrag) {
      const result = handleTransformPointerUp({
        grid,
        selection,
        selectionDrag,
      });
      if (result.grid) get().syncActiveLayer(result.grid);
      set({
        selection: result.selection,
        selectionDrag: result.selectionDrag,
        isDrawing: false,
        drawingButton: null,
        drawStart: null,
        lastPoint: null,
      });
      return;
    }

    if (activeTool === "repeatTile") {
      const { tileSession, tileCreateDrag } = get();

      if (tileSession.phase === "creating" && tileCreateDrag) {
        const { session, previewRect } = handleTileCreatePointerUp(grid, tileCreateDrag, point);
        if (session.phase === "drawing") {
          get().syncActiveLayer(grid);
        }
        set({
          tileSession: session,
          tilePreviewRect: previewRect,
          tileCreateDrag: null,
          isDrawing: false,
          drawingButton: null,
          drawStart: null,
          lastPoint: null,
          ...(session.phase === "drawing" ? { activeTool: "brush" as ToolType } : {}),
        });
      }

      return;
    }

    if (!isDrawing || !drawStart || drawingButton !== button || drawingColor === null) return;

    const tileSession = get().tileSession;
    const tileDraw = resolveTileDrawParams(tileSession, activeTool, grid);

    if (activeTool === "shape") {
      const pointerModifiers = toPointerModifiers(modifiers);
      let selectionMask =
        selection && !isSelectionEmpty(selection) ? selection.mask : null;
      let activeSymmetry = isSymmetryActive(symmetry) ? symmetry : null;
      const drawOptions = mergeDrawOptions(undefined, tileDraw?.tileRegion, pointerModifiers);

      if (tileDraw) {
        selectionMask = tileDraw.selectionMask;
        activeSymmetry = null;
      }

      if (isDrawingToolType(activeTool)) {
        const drawProject = prepareActiveLayerProjectForDrawing(
          project,
          activeTool,
          toolSettings,
          drawStart,
          point,
          pointerModifiers,
        );
        if (drawProject !== project) set({ project: drawProject });
        const drawGrid = drawingStrokeSession
          ? drawingStrokeSession.surface
          : getActiveLayerProjectedSurfaceFromProject(drawProject);

        applyToolPointerUp(
          drawGrid,
          activeTool,
          drawingColor,
          toolSettings,
          drawStart,
          point,
          selectionMask,
          activeSymmetry,
          drawOptions,
        );
      }
    }

    if (drawingStrokeSession) {
      compositeRenderCache.invalidate();
      const committedProject = commitDrawingStroke(project, drawingStrokeSession);
      set({
        project: committedProject,
        drawingStrokeSession: null,
        canvasRenderNonce: get().canvasRenderNonce + 1,
      });
    }

    set({
      isDrawing: false,
      drawStart: null,
      lastPoint: null,
      drawingButton: null,
      drawingColor: null,
      ...(activeTool === "brush" && lastPoint ? { brushLineAnchor: lastPoint } : {}),
    });

  },



  pickColorAt: async (point, slot) => {

    const { project } = get();

    if (!project) return;

    const color = await resolveColorAtCanvasPointAsync(
      project,
      point,
      getReferenceLayerPixelCache,
      ensureReferenceLayerPixelCache,
    );

    get().setColorSlot(slot, color);

  },

  undo: () => {
    const state = get();
    const {
      project,
      selection,
      symmetry,
      tileSession,
      historyStack,
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    } = state;
    if (!project) return;

    const savedMaps = saveActiveCanvasSession(project, selection, symmetry, tileSession, {
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    });

    const result = undoHistory(historyStack, project, selection);
    if (!result) return;
    if (result.structural) {
      clearReferenceLayerPixelCache();
    }

    const focusId = result.focusCanvasId ?? getActiveCanvas(result.project).id;
    const updatedMaps = reconcileCanvasSessionMaps(
      result.project,
      savedMaps,
      result.selection,
      focusId,
    );
    const session = loadActiveCanvasSession(result.project, updatedMaps);

    set({
      project: result.project,
      ...updatedMaps,
      selection: result.selection,
      symmetry: session.symmetry,
      tileSession: session.tileSession,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
      brushLineAnchor: null,
      drawingStrokeSession: null,
      isDrawing: false,
      drawStart: null,
      lastPoint: null,
      drawingButton: null,
      drawingColor: null,
    });
  },

  redo: () => {
    const state = get();
    const {
      project,
      selection,
      symmetry,
      tileSession,
      historyStack,
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    } = state;
    if (!project) return;

    const savedMaps = saveActiveCanvasSession(project, selection, symmetry, tileSession, {
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    });

    const result = redoHistory(historyStack, project, selection);
    if (!result) return;
    if (result.structural) {
      clearReferenceLayerPixelCache();
    }

    const focusId = result.focusCanvasId ?? getActiveCanvas(result.project).id;
    const updatedMaps = reconcileCanvasSessionMaps(
      result.project,
      savedMaps,
      result.selection,
      focusId,
    );
    const session = loadActiveCanvasSession(result.project, updatedMaps);

    set({
      project: result.project,
      ...updatedMaps,
      selection: result.selection,
      symmetry: session.symmetry,
      tileSession: session.tileSession,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
      brushLineAnchor: null,
      drawingStrokeSession: null,
      isDrawing: false,
      drawStart: null,
      lastPoint: null,
      drawingButton: null,
      drawingColor: null,
    });
  },

  canUndo: () => get().historyStack.canUndo,

  canRedo: () => get().historyStack.canRedo,

  selectAllCanvas: () => {
    const { project } = get();
    if (!project) return;
    const canvas = getActiveCanvas(project);
    set({
      selection: selectAll(canvas.width, canvas.height),
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
    });
  },

  activateTransformTool: () => {
    const { project, selection } = get();
    if (!project) return;

    const resolved = resolveSelectionForTransform(project, selection);
    if (resolved !== selection) {
      set({
        selection: resolved,
        selectionDrag: null,
        lassoPoints: [],
        selectionPreviewRect: null,
      });
    }
    get().setActiveTool("transform");
  },

  deselectCanvas: () => {
    const { project, selection } = get();
    if (selection?.floating && project) {
      const { project: committedProject } = commitFloatingSelectionInProject(
        project,
        selection,
      );
      set({ project: committedProject });
    }
    set({
      selection: deselectSelection(),
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
    });
  },

  invertCanvasSelection: () => {
    const { project, selection, historyStack } = get();
    if (!project || !selection) return;
    pushHistory(historyStack, project, selection);
    set({ selection: invertSelection(selection) });
  },

  copySelection: async () => {
    const { project, selection } = get();
    if (!project || !selection || isSelectionEmpty(selection)) return;
    const grid = getActiveLayerProjectedSurfaceFromProject(project);
    if (!grid) return;
    const copied = await copySelectionToClipboard(clipboardService, grid, selection);
    if (!copied) {
      toast.error("无法复制选区");
      return;
    }
    set({ internalClipboard: copied });
    toast.info("已复制到剪贴板");
  },

  cutSelection: async () => {
    const { project, selection, historyStack, internalClipboard } = get();
    if (!project || !selection || isSelectionEmpty(selection)) return;
    const grid = getActiveLayerProjectedSurfaceFromProject(project);
    if (!grid) return;
    pushHistory(historyStack, project, selection);
    const copied = await copySelectionToClipboard(clipboardService, grid, selection);
    const floated = createFloatingFromCut(grid, selection);
    if (!floated) {
      toast.error("无法剪切选区");
      return;
    }
    get().syncActiveLayer(floated.grid);
    set({
      internalClipboard: copied ?? internalClipboard,
      selection: floated.selection,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
      activeTool: "select",
    });
    toast.info("已剪切到剪贴板");
  },

  pasteSelection: async () => {
    const { project, internalClipboard, historyStack, selection } = get();
    if (!project) return;
    pushHistory(historyStack, project, selection);
    if (selection?.floating) {
      const { project: committedProject, selection: committedSelection } =
        commitFloatingSelectionInProject(project, selection);
      set({ project: committedProject, selection: committedSelection });
    }
    const canvas = getActiveCanvas(project);
    const pasted = await pasteFromClipboard(
      clipboardService,
      canvas.width,
      canvas.height,
      internalClipboard,
    );
    if (!pasted) return;
    const currentProject = get().project ?? project;
    const expandedProject = withFloatingSelectionLayerExpand(currentProject, pasted);
    set({
      project: expandedProject,
      selection: pasted,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
      activeTool: "select",
    });
  },

  clearSelectionContent: () => {
    const { project, selection, historyStack } = get();
    if (!project || !selection || isSelectionEmpty(selection)) return;
    const grid = getActiveLayerProjectedSurfaceFromProject(project);
    if (!grid) return;
    pushHistory(historyStack, project, selection);
    clearSelectionPixels(grid, selection);
    get().syncActiveLayer(grid);
  },

  commitSelection: () => {
    const { project, selection } = get();
    if (!project || !selection?.floating) return;
    const { project: committedProject, selection: committedSelection } =
      commitFloatingSelectionInProject(project, selection);
    set({ project: committedProject, selection: committedSelection, selectionDrag: null });
  },

  cancelSelection: () => {
    const { project, selection } = get();
    if (!project || !selection?.floating) {
      get().deselectCanvas();
      return;
    }
    const source = selection.floating.source;
    const { project: restoredProject, selection: restoredSelection } =
      cancelFloatingSelectionInProject(project, selection);
    if (source === "paste") {
      set({ project: restoredProject, selection: null, selectionDrag: null });
    } else {
      set({ project: restoredProject, selection: restoredSelection, selectionDrag: null });
    }
  },

  nudgeSelectionBy: (dx, dy) => {
    const { project, selection, historyStack } = get();
    if (!project || !selection || isSelectionEmpty(selection)) return;
    const grid = getActiveLayerProjectedSurfaceFromProject(project);
    if (!grid) return;
    const wasFloating = selection.floating != null;
    if (!wasFloating) {
      pushHistory(historyStack, project, selection);
    }
    const result = nudgeSelection(grid, selection, dx, dy);
    const expandedProject = withFloatingSelectionLayerExpand(project, result.selection);
    if (!wasFloating) {
      get().syncActiveLayer(grid);
    }
    set({
      ...(expandedProject !== project ? { project: expandedProject } : {}),
      selection: result.selection,
    });
  },

  rotateSelection90: (steps) => {
    const { project, selection, historyStack } = get();
    if (!project || !selection || isSelectionEmpty(selection)) return;
    const grid = getActiveLayerProjectedSurfaceFromProject(project);
    if (!grid) return;
    pushHistory(historyStack, project, selection);
    let state = selection;
    if (!state.floating) {
      state = beginMoveSelection(grid, state);
      get().syncActiveLayer(grid);
    }
    const rotated = rotateFloatingSelection90(state, steps);
    const expandedProject = withFloatingSelectionLayerExpand(project, rotated);
    set({
      ...(expandedProject !== project ? { project: expandedProject } : {}),
      selection: rotated,
    });
  },

  flipSelectionHorizontal: () => {
    const { project, selection, historyStack } = get();
    if (!project || !selection || isSelectionEmpty(selection)) return;
    const grid = getActiveLayerProjectedSurfaceFromProject(project);
    if (!grid) return;
    pushHistory(historyStack, project, selection);
    let state = selection;
    if (!state.floating) {
      state = beginMoveSelection(grid, state);
      get().syncActiveLayer(grid);
    }
    const flipped = flipFloatingHorizontal(state);
    const expandedProject = withFloatingSelectionLayerExpand(project, flipped);
    set({
      ...(expandedProject !== project ? { project: expandedProject } : {}),
      selection: flipped,
    });
  },

  flipSelectionVertical: () => {
    const { project, selection, historyStack } = get();
    if (!project || !selection || isSelectionEmpty(selection)) return;
    const grid = getActiveLayerProjectedSurfaceFromProject(project);
    if (!grid) return;
    pushHistory(historyStack, project, selection);
    let state = selection;
    if (!state.floating) {
      state = beginMoveSelection(grid, state);
      get().syncActiveLayer(grid);
    }
    const flipped = flipFloatingVertical(state);
    const expandedProject = withFloatingSelectionLayerExpand(project, flipped);
    set({
      ...(expandedProject !== project ? { project: expandedProject } : {}),
      selection: flipped,
    });
  },

  togglePatternBrushFlipHorizontal: () => {
    if (!isPatternBrushActive(get())) return;
    const { toolSettings } = get();
    set({
      toolSettings: {
        ...toolSettings,
        patternBrushFlipHorizontal: !toolSettings.patternBrushFlipHorizontal,
      },
    });
  },

  togglePatternBrushFlipVertical: () => {
    if (!isPatternBrushActive(get())) return;
    const { toolSettings } = get();
    set({
      toolSettings: {
        ...toolSettings,
        patternBrushFlipVertical: !toolSettings.patternBrushFlipVertical,
      },
    });
  },



  setLayersPanelTab: (tab) => set({ layersPanelTab: tab }),

  importReferenceLayerFromClipboardAction: async () => {
    const { project } = get();
    if (!project) {
      toast.info("请先打开项目");
      return;
    }
    try {
      const result = await importReferenceLayerFromClipboard(clipboardService, project);
      if (!result) {
        toast.info("剪贴板中没有图像");
        return;
      }
      invalidateReferenceLayerPixelCache(result.layerId);
      set({
        project: setActiveReferenceLayer(result.project, result.layerId),
        cropEditorLayerId: result.openCropEditor ? result.layerId : null,
      });
      toast.info("已导入到参考层");
    } catch {
      toast.error("从剪贴板导入失败");
    }
  },

  setPaletteViewMode: (mode) => set({ paletteViewMode: mode }),

  setColorPickerMode: (mode) => set({ colorPickerMode: mode }),

  setColorPickerLayoutOrientation: (orientation) =>
    set((s) => {
      const containerSize = getContainerDimensions(s.viewportContainer);
      const panelSize = getFloatingColorPickerPanelDimensions(orientation);

      let position = s.floatingColorPicker.position;
      if (s.floatingColorPicker.visible) {
        position = containerSize
          ? adaptPanelPositionOnResize(
              s.floatingColorPicker.position,
              panelSize,
              s.floatingColorPicker.edgeAnchor,
              containerSize,
            )
          : clampPanelPosition(
              s.floatingColorPicker.position.x,
              s.floatingColorPicker.position.y,
              panelSize.width,
              panelSize.height,
              null,
              null,
            );
      }

      return {
        colorPickerLayoutOrientation: orientation,
        floatingColorPicker: {
          ...s.floatingColorPicker,
          panelWidth: panelSize.width,
          panelHeight: panelSize.height,
          position,
        },
      };
    }),

  setSidebarWidth: (width) => {
    const viewportMax = Math.floor(window.innerWidth * 0.45);
    const upper = Math.min(SIDEBAR_MAX_WIDTH, viewportMax);
    set({ sidebarWidth: Math.min(Math.max(width, SIDEBAR_MIN_WIDTH), upper) });
  },

  setSplitPaneRatio: (ratio) =>
    set({
      splitPaneRatio: Math.min(
        Math.max(ratio, SPLIT_PANE_MIN_RATIO),
        SPLIT_PANE_MAX_RATIO,
      ),
    }),

  addColorToPalette: (color) => {

    const { project } = get();

    if (!project) return;

    set({ project: addColorToPaletteUseCase(project, color) });

  },



  removeColorsFromPalette: (hexes) => {

    const { project } = get();

    if (!project) return;

    set({ project: removeColorsFromPaletteUseCase(project, hexes) });

  },

  clearPalette: () => {

    const { project } = get();

    if (!project) return;

    set({ project: clearPaletteUseCase(project) });

  },

  importReferenceLayerColors: async (layerId, scope) => {

    const { project } = get();

    if (!project) return;

    const found = getActiveCanvas(project).layers.find((l) => l.id === layerId);
    const layer = found && isReferenceLayer(found) ? found : null;

    if (!layer?.imageData) return;

    const loadPixels = async (
      refLayer: ReferenceLayer,
      importScope: ReferenceColorImportScope,
    ) => {
      const cache =
        importScope === "full"
          ? await ensureReferenceLayerFullPixelCache(refLayer)
          : await ensureReferenceLayerPixelCache(refLayer);
      return cache?.pixels ?? null;
    };

    const nextProject = await importReferenceLayerColorsToPalette(
      project,
      layer,
      scope,
      loadPixels,
    );

    set({ project: nextProject });

  },

  importAssetToNewDrawingLayer: async (assetId) => {
    const { project, softwareDataPath, assetLibrary } = get();
    if (!project) {
      toast.info("请先打开项目");
      return;
    }
    if (!softwareDataPath || !assetLibrary) {
      toast.error("无法访问资产库");
      return;
    }
    const asset = findAssetById(assetLibrary, assetId);
    if (!asset) {
      toast.error("资产不存在");
      return;
    }
    if (!isImageAsset(asset)) {
      toast.info("笔记资产无法导入到项目");
      return;
    }
    const imageData = await loadAssetImageAsImageData(
      softwareDataPath,
      asset.imageFile,
    );
    if (!imageData) {
      toast.error("无法加载资产图像");
      return;
    }
    try {
      const grid = imageDataToPixelGrid(imageData);
      const updated = importAssetGridToNewDrawingLayer(project, grid, asset.title);
      set({ project: updated });
      toast.info("已导入到新图层");
    } catch {
      toast.error("导入到图层失败");
    }
  },

  importAssetToNewReferenceLayer: async (assetId) => {
    const { project, softwareDataPath, assetLibrary } = get();
    if (!project) {
      toast.info("请先打开项目");
      return;
    }
    if (!softwareDataPath || !assetLibrary) {
      toast.error("无法访问资产库");
      return;
    }
    const asset = findAssetById(assetLibrary, assetId);
    if (!asset) {
      toast.error("资产不存在");
      return;
    }
    if (!isImageAsset(asset)) {
      toast.info("笔记资产无法导入到项目");
      return;
    }
    const imageData = await loadAssetImageAsImageData(
      softwareDataPath,
      asset.imageFile,
    );
    if (!imageData) {
      toast.error("无法加载资产图像");
      return;
    }
    try {
      const result = importAssetImageDataToNewReferenceLayer(
        project,
        imageData,
        asset.title,
      );
      invalidateReferenceLayerPixelCache(result.layerId);
      set({
        project: setActiveReferenceLayer(result.project, result.layerId),
        cropEditorLayerId: result.openCropEditor ? result.layerId : null,
      });
      toast.info("已导入到参考图层");
    } catch {
      toast.error("导入到参考图层失败");
    }
  },

  importImageDataToDrawingLayer: (imageData, name) => {
    const { project } = get();
    if (!project) {
      toast.info("请先打开项目");
      return;
    }
    try {
      const grid = imageDataToPixelGrid(imageData);
      const updated = importAssetGridToNewDrawingLayer(project, grid, name);
      set({ project: updated });
      toast.info("已导入到新图层");
    } catch {
      toast.error("导入到图层失败");
    }
  },

  importDroppedImageAtCanvasPoint: async (source, canvasId, canvasPoint, asReference = false) => {
    const state = get();
    let { project } = state;
    if (!project) {
      toast.info("请先打开项目");
      return;
    }
    try {
      const imageData =
        "file" in source
          ? await imageProcessor.loadImageFromFile(source.file)
          : await imageProcessor.loadImageFromPath(source.path);
      const layerName = `导入图片 ${new Date().toLocaleString()}`;

      let sessionPatch: Partial<{
        project: Project;
        selectionByCanvas: Record<string, SelectionState | null>;
        symmetryByCanvas: Record<string, SymmetryConfig>;
        tileSessionByCanvas: Record<string, TileSessionState>;
        selection: SelectionState | null;
        symmetry: SymmetryConfig;
        tileSession: TileSessionState;
        selectionDrag: null;
        lassoPoints: [];
        selectionPreviewRect: null;
        brushLineAnchor: null;
      }> = {};

      if (project.board.activeCanvasId !== canvasId) {
        const {
          selection,
          symmetry,
          tileSession,
          selectionByCanvas,
          symmetryByCanvas,
          tileSessionByCanvas,
        } = state;
        const savedMaps = saveActiveCanvasSession(project, selection, symmetry, tileSession, {
          selectionByCanvas,
          symmetryByCanvas,
          tileSessionByCanvas,
        });
        project = withActiveCanvasId(project, canvasId);
        const session = loadActiveCanvasSession(project, savedMaps);
        sessionPatch = {
          project,
          selectionByCanvas: savedMaps.selectionByCanvas,
          symmetryByCanvas: savedMaps.symmetryByCanvas,
          tileSessionByCanvas: savedMaps.tileSessionByCanvas,
          selection: session.selection,
          symmetry: session.symmetry,
          tileSession: session.tileSession,
          selectionDrag: null,
          lassoPoints: [],
          selectionPreviewRect: null,
          brushLineAnchor: null,
        };
      }

      if (asReference) {
        const result = dropImageAsReferenceLayerOntoCanvas(
          project,
          imageData,
          canvasId,
          canvasPoint,
          layerName,
        );
        invalidateReferenceLayerPixelCache(result.layerId);
        set({
          ...sessionPatch,
          project: setActiveReferenceLayer(result.project, result.layerId),
          cropEditorLayerId: result.openCropEditor ? result.layerId : null,
        });
        toast.info("已导入到新参考图层");
        return;
      }

      const grid = imageDataToPixelGrid(imageData);
      const updated = dropImageAsDrawingLayerOntoCanvas(
        project,
        grid,
        canvasId,
        canvasPoint,
        layerName,
      );
      set({
        ...sessionPatch,
        project: updated,
      });
      toast.info("已导入到新图层");
    } catch {
      toast.error("导入到图层失败");
    }
  },

  importDroppedImageAtBoardPoint: async (source, boardPoint) => {
    const {
      project,
      selection,
      symmetry,
      tileSession,
      historyStack,
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    } = get();
    if (!project) {
      toast.info("请先打开项目");
      return;
    }
    try {
      const imageData =
        "file" in source
          ? await imageProcessor.loadImageFromFile(source.file)
          : await imageProcessor.loadImageFromPath(source.path);
      const layerName = `导入图片 ${new Date().toLocaleString()}`;

      const savedMaps = saveActiveCanvasSession(project, selection, symmetry, tileSession, {
        selectionByCanvas,
        symmetryByCanvas,
        tileSessionByCanvas,
      });
      pushBoardStructureHistory(historyStack, project, selection);

      const grid = imageDataToPixelGrid(imageData);
      const nextProject = createCanvasWithDroppedDrawingLayer(
        project,
        grid,
        {
          x: Math.floor(boardPoint.x),
          y: Math.floor(boardPoint.y),
        },
        layerName,
      );
      const newCanvas = getActiveCanvas(nextProject);
      const origin = createCenteredOrigin(newCanvas.width, newCanvas.height);
      const newSymmetry = {
        ...createDefaultSymmetryConfig(),
        originX: origin.originX,
        originY: origin.originY,
      };
      const nextMaps = {
        selectionByCanvas: { ...savedMaps.selectionByCanvas, [newCanvas.id]: null },
        symmetryByCanvas: { ...savedMaps.symmetryByCanvas, [newCanvas.id]: newSymmetry },
        tileSessionByCanvas: {
          ...savedMaps.tileSessionByCanvas,
          [newCanvas.id]: createIdleTileSession(),
        },
      };

      set({
        project: nextProject,
        ...nextMaps,
        selection: null,
        symmetry: newSymmetry,
        tileSession: createIdleTileSession(),
        selectionDrag: null,
        lassoPoints: [],
        selectionPreviewRect: null,
        brushLineAnchor: null,
      });
      toast.info("已创建画板并导入");
    } catch {
      toast.error("导入到图层失败");
    }
  },

  importImageDataToReferenceLayer: (imageData, name) => {
    const { project } = get();
    if (!project) {
      toast.info("请先打开项目");
      return;
    }
    try {
      const result = importAssetImageDataToNewReferenceLayer(project, imageData, name);
      invalidateReferenceLayerPixelCache(result.layerId);
      set({
        project: setActiveReferenceLayer(result.project, result.layerId),
        cropEditorLayerId: result.openCropEditor ? result.layerId : null,
      });
      toast.info("已导入到参考图层");
    } catch {
      toast.error("导入到参考图层失败");
    }
  },

  copyImageToClipboard: async (pngBlob) => {
    try {
      await clipboardService.copyImage(pngBlob);
      toast.info("已复制到剪贴板");
    } catch {
      toast.error("复制到剪贴板失败");
    }
  },

  importAssetColorsToPalette: async (assetId) => {
    const { project, softwareDataPath, assetLibrary } = get();
    if (!project) {
      toast.info("请先打开项目");
      return;
    }
    if (!softwareDataPath || !assetLibrary) {
      toast.error("无法访问资产库");
      return;
    }
    const asset = findAssetById(assetLibrary, assetId);
    if (!asset) {
      toast.error("资产不存在");
      return;
    }
    if (!isImageAsset(asset)) {
      toast.info("笔记资产无法导入到项目");
      return;
    }
    const imageData = await loadAssetImageAsImageData(
      softwareDataPath,
      asset.imageFile,
    );
    if (!imageData) {
      toast.error("无法加载资产图像");
      return;
    }
    try {
      const grid = imageDataToPixelGrid(imageData);
      const { project: updated, addedCount } = importAssetColorsToPalette(project, grid);
      set({ project: updated });
      if (addedCount > 0) {
        toast.info(`已导入 ${addedCount} 个颜色到色板`);
      } else {
        toast.info("色板中已包含这些颜色");
      }
    } catch {
      toast.error("导入颜色失败");
    }
  },



  setActiveLayer: (layerId) => {

    const { project } = get();

    if (!project) return;

    set({
      project: setActiveLayer(project, layerId),
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
      brushLineAnchor: null,
    });

  },



  setActiveReferenceLayer: (layerId) => {

    const { project } = get();

    if (!project) return;

    set({ project: setActiveReferenceLayer(project, layerId) });

  },



  toggleLayerVisibility: (layerId) => {

    const { project } = get();

    if (!project) return;

    set({ project: toggleLayerVisibilityInProject(project, layerId) });

  },



  setDrawingLayerOpacity: (layerId, opacityPercent) => {

    const { project } = get();

    if (!project) return;

    const opacity = Math.round((opacityPercent / 100) * 255);

    set({ project: setDrawingLayerOpacityInProject(project, layerId, opacity) });

  },



  toggleDrawingLayerLock: (layerId) => {

    const { project } = get();

    if (!project) return;

    set({ project: toggleDrawingLayerLockInProject(project, layerId) });

  },



  renameLayer: (layerId, name) => {

    const { project } = get();

    if (!project || !name.trim()) return;

    set({ project: renameLayerInProject(project, layerId, name) });

  },



  addDrawingLayer: () => {

    const { project } = get();

    if (!project) return;

    set({ project: addDrawingLayer(project) });

  },



  addReferenceLayer: () => {

    const { project } = get();

    if (!project) return;

    set({ project: addReferenceLayer(project) });

  },



  moveReferenceLayer: (layerId, position) => {

    const { project } = get();

    if (!project) return;

    const updated = moveReferenceLayerInProject(project, layerId, position);

    if (updated) set({ project: updated });

  },



  setReferenceCrop: (layerId, crop) => {

    const { project } = get();

    if (!project) return;

    const updated = setReferenceCropInProject(project, layerId, crop);

    if (updated) {
      const layer = getActiveCanvas(updated).layers.find((l) => l.id === layerId);
      if (layer && isReferenceLayer(layer) && layer.crop) {
        removeStaleReferenceLayerCropCaches(layerId, referenceLayerCropKey(layer.crop));
      }
      set({ project: updated });
    }

  },



  toggleReferenceGrid: (layerId) => {

    const { project } = get();

    if (!project) return;

    const updated = toggleReferenceGridInProject(project, layerId);

    if (updated) set({ project: updated });

  },



  resizeReferenceLayer: (layerId, { scale, position }) => {

    const { project } = get();

    if (!project) return;

    const updated = scaleReferenceLayerInProject(project, layerId, scale, position);

    if (updated) set({ project: updated });

  },



  resetReferenceScale: (layerId) => {

    const { project } = get();

    if (!project) return;

    const updated = resetReferenceScaleInProject(project, layerId);

    if (updated) set({ project: updated });

  },



  toggleReferencePalette: (layerId) => {

    const { project } = get();

    if (!project) return;

    const updated = toggleReferencePaletteInProject(project, layerId);

    if (updated) set({ project: updated });

  },



  openCropEditor: (layerId) => {
    const { project } = get();
    if (!project) {
      set({ cropEditorLayerId: layerId });
      return;
    }
    set({
      cropEditorLayerId: layerId,
      project: setActiveReferenceLayer(project, layerId),
    });
  },



  closeCropEditor: () => set({ cropEditorLayerId: null }),



  openCanvasSizeModal: () => {
    const { project } = get();
    if (!project) return;
    set({ canvasSizeModalOpen: true });
  },

  closeCanvasSizeModal: () => set({ canvasSizeModalOpen: false }),

  openExportImageModal: () => {
    const { project } = get();
    if (!project) {
      toast.info("请先打开项目");
      return;
    }
    set({ exportImageModalOpen: true });
  },

  closeExportImageModal: () => set({ exportImageModalOpen: false }),

  executeExportImage: async (input) => {
    const { project, selection, softwareDataPath, imageExportPreferences } = get();
    if (!project) return null;
    const activeSoftwareDataPath = softwareDataPath ?? softwareDataPathStore.getPath();
    if (!activeSoftwareDataPath) {
      toast.info("请先选择软件数据路径");
      return null;
    }

    const defaultDirectory =
      imageExportPreferences.lastExportDirectory ?? activeSoftwareDataPath;
    const defaultPath = buildDefaultExportSavePath(
      defaultDirectory,
      project.name,
      input.format,
    );
    const extension = getImageExportExtension(input.format);
    const filePath = await save({
      defaultPath,
      filters: [
        {
          name: "图片",
          extensions: extension === "jpg" ? ["jpg", "jpeg"] : [extension],
        },
      ],
    });
    if (!filePath) return "cancelled";

    try {
      const result = await exportImage({
        project,
        selection,
        filePath,
        format: input.format,
        scope: input.scope,
        scalePreset: input.scalePreset,
        customLongestEdge: input.customLongestEdge,
        softwareDataPath: activeSoftwareDataPath,
        preferencesRepository: imageExportPreferencesRepository,
      });
      if (!result) return null;
      const imageExportRaw = await imageExportPreferencesRepository.load(activeSoftwareDataPath);
      set({ imageExportPreferences: parseImageExportPreferences(imageExportRaw) });
      toast.info(`已导出至 ${result.filePath}`);
      return result;
    } catch {
      toast.error("导出失败，请重试");
      return null;
    }
  },

  applyCanvasSize: (width, height) => {
    const { project } = get();
    if (!project) return;
    get().historyStack.clear();
    set({
      project: resizeCanvas(project, width, height),
      selection: null,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
    });
    get().resetSymmetryToCenter();
  },

  pushCanvasResizeHistory: () => {
    const { project, historyStack, selection } = get();
    if (!project) return;
    pushStructureHistory(historyStack, project, selection);
  },

  applyCanvasEdgeResize: (edge, delta, anchorSize) => {
    const { project } = get();
    if (!project) return;
    const currentSize = getCanvasSize(project);
    const updated = resizeCanvasByEdge(project, edge, delta, anchorSize);
    const newSize = getCanvasSize(updated);
    if (
      newSize.width === currentSize.width &&
      newSize.height === currentSize.height
    ) {
      return;
    }
    set({
      project: updated,
      selection: null,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
    });
    get().resetSymmetryToCenter();
  },



  importImageToReferenceLayer: async (layerId) => {

    const selected = await open({

      multiple: false,

      filters: [

        { name: "图片", extensions: ["png", "jpg", "jpeg", "bmp", "gif", "webp"] },

      ],

    });

    if (!selected || typeof selected !== "string") return;



    const { project } = get();

    if (!project) return;

    set({ isCapturing: true, captureError: null });

    try {

      const result = await replaceProjectFromImagePath(

        projectRepository,

        project,

        imageProcessor,

        selected,

        `导入图片 ${new Date().toLocaleString()}`,

        promptSaveAs,

        undefined,

        layerId,

      );

      if (result) {
        invalidateReferenceLayerPixelCache(result.layerId);

        set({

          project: setActiveReferenceLayer(result.project, result.layerId),

          cropEditorLayerId: result.openCropEditor ? result.layerId : null,

        });

      }

    } catch {

      set({ captureError: "导入图片失败，请重试" });

    } finally {

      set({ isCapturing: false });

    }

  },



  openPixelRestorePage: () => {
    closeOtherPluginPages("pixelRestore");
    usePixelRestoreStore.getState().openPage();
  },

  openColorEditPage: () => {
    closeOtherPluginPages("colorEdit");
    useColorEditStore.getState().openPage();
  },

  openColorVariationPage: () => {
    closeOtherPluginPages("colorVariation");
    useColorVariationAnalysisStore.getState().openPage();
  },

  openWorldPage: () => {
    closeOtherPluginPages("world");
    useWorldStore.getState().openPage();
  },

  openComfyUiPage: () => {
    closeOtherPluginPages("comfyui");
    useComfyUiStore.getState().openPage();
  },

  sendAssetToPlugin: async (assetId, pluginId) => {
    const { softwareDataPath, assetLibrary } = get();
    if (!softwareDataPath || !assetLibrary) {
      toast.error("无法访问资产库");
      return;
    }
    const asset = findAssetById(assetLibrary, assetId);
    if (!asset) {
      toast.error("资产不存在");
      return;
    }
    if (!isImageAsset(asset)) {
      toast.info("笔记资产无法发送到插件");
      return;
    }
    const imageData = await loadAssetImageAsImageData(
      softwareDataPath,
      asset.imageFile,
    );
    if (!imageData) {
      toast.error("无法加载资产图像");
      return;
    }

    if (pluginId === "pixelRestore") {
      closeOtherPluginPages("pixelRestore");
      const store = usePixelRestoreStore.getState();
      store.reset();
      store.openPage();
      store.importFromImageData(imageData);
      return;
    }

    if (pluginId === "colorVariation") {
      const grid = PixelGrid.fromRgba(imageData.width, imageData.height, imageData.data);
      const entries = buildColorEntriesInScanOrder(grid.toUint32Array());
      if (entries.length === 0) {
        toast.info("图像中没有可分析的颜色");
        return;
      }
      closeOtherPluginPages("colorVariation");
      useColorVariationAnalysisStore.getState().openPageWithColorEntries(entries);
      toast.info(`已发送 ${entries.length} 个颜色到颜色变化分析`);
      return;
    }

    closeOtherPluginPages("colorEdit");
    const store = useColorEditStore.getState();
    store.reset();
    store.openPage();
    store.importFromImageData(imageData);
  },

  revealAssetInFolder: async (assetId) => {
    const { softwareDataPath, assetLibrary } = get();
    if (!softwareDataPath || !assetLibrary) {
      toast.error("无法访问资产库");
      return;
    }
    const asset = findAssetById(assetLibrary, assetId);
    if (!asset) {
      toast.error("资产不存在");
      return;
    }
    try {
      await revealAssetFileInFolder(
        softwareDataPath,
        getAssetRelativeFilePath(asset),
      );
    } catch {
      toast.error("打开文件夹失败");
    }
  },

  sendPixelRestoreResultToColorEdit: (imageData) => {
    usePixelRestoreStore.getState().closePage();
    closeOtherPluginPages("colorEdit");
    const colorEdit = useColorEditStore.getState();
    colorEdit.openPage();
    colorEdit.importFromImageData(cloneImageData(imageData));
    toast.info("已发送到颜色编辑");
  },

  sendSelectionColorsToColorVariationAnalysis: () => {
    const { project, selection } = get();
    if (!project) {
      toast.info("请先打开项目");
      return;
    }
    if (!selection || isSelectionEmpty(selection)) {
      toast.info("请先创建选区");
      return;
    }

    const entries = extractSelectionColorsForAnalysis(project, selection);
    if (entries.length === 0) {
      toast.info("选区内没有可分析的颜色");
      return;
    }

    closeOtherPluginPages("colorVariation");
    useColorVariationAnalysisStore.getState().openPageWithColorEntries(entries);
    if (selection.floating) {
      get().commitSelection();
    }
    get().deselectCanvas();
    toast.info(`已发送 ${entries.length} 个颜色到颜色变化分析`);
  },



  exportRestoredImageToAssetLibrary: async (imageData) => {
    const path = get().softwareDataPath ?? softwareDataPathStore.getPath();
    if (!path) {
      toast.info("请先选择软件数据路径");
      return;
    }
    const accessible = await ensureSoftwareDataPathAccess(softwareDataPathStore);
    if (!accessible) {
      toast.error("无法访问项目目录，请重新授权");
      return;
    }

    let library = get().assetLibrary;
    if (!library) {
      library = await loadAssetLibrary(assetLibraryRepository, accessible);
    }

    try {
      const result = await importAssetFromImageData(
        assetLibraryRepository,
        accessible,
        library,
        ROOT_FOLDER_ID,
        imageData,
        `像素还原 ${new Date().toLocaleString()}`,
      );
      set({
        assetLibrary: result.library,
        selectedAssetId: result.asset.id,
        selectedAssetFolderId: null,
        assetLibraryDrawerExpanded: true,
      });
      toast.info("已导出到资产库");
      usePixelRestoreStore.getState().closePage();
    } catch {
      toast.error("导出到资产库失败，请重试");
    }
  },

  saveImageToAssetLibrary: async (imageData, title) => {
    const path = get().softwareDataPath ?? softwareDataPathStore.getPath();
    if (!path) {
      toast.info("请先选择软件数据路径");
      return;
    }
    const accessible = await ensureSoftwareDataPathAccess(softwareDataPathStore);
    if (!accessible) {
      toast.error("无法访问项目目录，请重新授权");
      return;
    }

    let library = get().assetLibrary;
    if (!library) {
      library = await loadAssetLibrary(assetLibraryRepository, accessible);
    }

    try {
      const result = await importAssetFromImageData(
        assetLibraryRepository,
        accessible,
        library,
        ROOT_FOLDER_ID,
        imageData,
        title,
      );
      set({
        assetLibrary: result.library,
        selectedAssetId: result.asset.id,
        selectedAssetFolderId: null,
        assetLibraryDrawerExpanded: true,
      });
      toast.info("已导入到资产库");
    } catch {
      toast.error("导入资产库失败，请重试");
    }
  },



  removeLayer: (layerId) => {

    const { project, selection, historyStack } = get();

    if (!project) return;
    const removedLayer = getActiveCanvas(project).layers.find((layer) => layer.id === layerId);

    const updated = removeLayerFromProject(project, layerId);
    if (!updated) return;

    // 删除成功后才记录结构快照，避免被领域规则拒绝时污染历史栈。
    pushStructureHistory(historyStack, project, selection);

    if (removedLayer && isReferenceLayer(removedLayer)) {
      invalidateReferenceLayerPixelCache(layerId);
    }
    set({ project: updated });

  },

  copyDrawingLayer: (layerId) => {
    const { project } = get();
    if (!project) return;

    const targetId = layerId ?? getActiveCanvas(project).activeLayerId;
    const clipboard = copyDrawingLayerInProject(project, targetId);
    if (!clipboard) return;

    set({ drawingLayerClipboard: clipboard });
  },

  pasteDrawingLayer: () => {
    const { project, selection, historyStack, drawingLayerClipboard } = get();
    if (!project || !drawingLayerClipboard) return;

    pushStructureHistory(historyStack, project, selection);
    set({ project: pasteDrawingLayerInProject(project, drawingLayerClipboard) });
  },

  mergeDrawingLayerDown: (layerId) => {
    const { project, selection, historyStack } = get();
    if (!project) return;

    const targetId = layerId ?? getActiveCanvas(project).activeLayerId;
    const updated = mergeDrawingLayerDownInProject(project, targetId);
    if (!updated) return;

    pushStructureHistory(historyStack, project, selection);
    set({ project: updated });
  },

  reorderLayer: (fromIndex, toIndex) => {

    const { project } = get();

    if (!project) return;

    set({ project: reorderLayerInProject(project, fromIndex, toIndex) });

  },

  setActiveCanvas: (canvasId) => {
    const state = get();
    const {
      project,
      selection,
      symmetry,
      tileSession,
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    } = state;
    if (!project || project.board.activeCanvasId === canvasId) return;
    if (!project.board.canvases.some((c) => c.id === canvasId)) return;

    const savedMaps = saveActiveCanvasSession(project, selection, symmetry, tileSession, {
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    });
    const nextProject = withActiveCanvasId(project, canvasId);
    const session = loadActiveCanvasSession(nextProject, savedMaps);

    set({
      project: nextProject,
      selectionByCanvas: savedMaps.selectionByCanvas,
      symmetryByCanvas: savedMaps.symmetryByCanvas,
      tileSessionByCanvas: savedMaps.tileSessionByCanvas,
      selection: session.selection,
      symmetry: session.symmetry,
      tileSession: session.tileSession,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
      brushLineAnchor: null,
    });
  },

  addCanvas: (name) => {
    const {
      project,
      selection,
      symmetry,
      tileSession,
      historyStack,
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    } = get();
    if (!project) return;

    const savedMaps = saveActiveCanvasSession(project, selection, symmetry, tileSession, {
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    });
    pushBoardStructureHistory(historyStack, project, selection);

    const nextBoard = addPixelCanvasToBoard(project.board, name);
    const nextProject = withBoard(project, nextBoard);
    const newCanvas = getActiveCanvas(nextProject);
    const origin = createCenteredOrigin(newCanvas.width, newCanvas.height);
    const newSymmetry = {
      ...createDefaultSymmetryConfig(),
      originX: origin.originX,
      originY: origin.originY,
    };
    const nextMaps = {
      selectionByCanvas: { ...savedMaps.selectionByCanvas, [newCanvas.id]: null },
      symmetryByCanvas: { ...savedMaps.symmetryByCanvas, [newCanvas.id]: newSymmetry },
      tileSessionByCanvas: {
        ...savedMaps.tileSessionByCanvas,
        [newCanvas.id]: createIdleTileSession(),
      },
    };

    set({
      project: nextProject,
      ...nextMaps,
      selection: null,
      symmetry: newSymmetry,
      tileSession: createIdleTileSession(),
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
      brushLineAnchor: null,
    });
  },

  removeCanvas: (canvasId) => {
    const {
      project,
      selection,
      symmetry,
      tileSession,
      historyStack,
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    } = get();
    if (!project) return;

    const savedMaps = saveActiveCanvasSession(project, selection, symmetry, tileSession, {
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    });
    const nextBoard = removePixelCanvasFromBoard(project.board, canvasId);
    if (!nextBoard) return;

    pushBoardStructureHistory(historyStack, project, selection);
    const nextProject = withBoard(project, nextBoard);
    const { [canvasId]: _s, ...restSelection } = savedMaps.selectionByCanvas;
    const { [canvasId]: _y, ...restSymmetry } = savedMaps.symmetryByCanvas;
    const { [canvasId]: _t, ...restTile } = savedMaps.tileSessionByCanvas;
    const nextMaps = {
      selectionByCanvas: restSelection,
      symmetryByCanvas: restSymmetry,
      tileSessionByCanvas: restTile,
    };
    const session = loadActiveCanvasSession(nextProject, nextMaps);

    set({
      project: nextProject,
      ...nextMaps,
      selection: session.selection,
      symmetry: session.symmetry,
      tileSession: session.tileSession,
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
      brushLineAnchor: null,
    });
  },

  moveCanvasOnBoard: (canvasId, boardPosition) => {
    const { project, selection, historyStack } = get();
    if (!project) return;

    pushBoardStructureHistory(historyStack, project, selection);
    set({
      project: withBoard(
        project,
        movePixelCanvasOnBoard(project.board, canvasId, boardPosition),
      ),
    });
  },

  beginCanvasBoardMove: () => {
    const { project, selection, historyStack } = get();
    if (!project) return;

    pushBoardStructureHistory(historyStack, project, selection);
  },

  previewCanvasOnBoard: (canvasId, boardPosition) => {
    const { project } = get();
    if (!project) return;

    set({
      project: withBoard(
        project,
        movePixelCanvasOnBoard(project.board, canvasId, boardPosition),
      ),
    });
  },

  renameCanvas: (canvasId, name) => {
    const { project, selection, historyStack } = get();
    if (!project) return;

    pushBoardStructureHistory(historyStack, project, selection);
    set({
      project: withBoard(project, renamePixelCanvas(project.board, canvasId, name)),
    });
  },

  duplicateCanvas: (canvasId) => {
    const {
      project,
      selection,
      symmetry,
      tileSession,
      historyStack,
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    } = get();
    if (!project) return;

    const savedMaps = saveActiveCanvasSession(project, selection, symmetry, tileSession, {
      selectionByCanvas,
      symmetryByCanvas,
      tileSessionByCanvas,
    });
    pushBoardStructureHistory(historyStack, project, selection);

    const nextBoard = duplicatePixelCanvasOnBoard(project.board, canvasId);
    const nextProject = withBoard(project, nextBoard);
    const newCanvas = getActiveCanvas(nextProject);
    const origin = createCenteredOrigin(newCanvas.width, newCanvas.height);
    const newSymmetry = {
      ...createDefaultSymmetryConfig(),
      originX: origin.originX,
      originY: origin.originY,
    };
    const nextMaps = {
      selectionByCanvas: { ...savedMaps.selectionByCanvas, [newCanvas.id]: null },
      symmetryByCanvas: { ...savedMaps.symmetryByCanvas, [newCanvas.id]: newSymmetry },
      tileSessionByCanvas: {
        ...savedMaps.tileSessionByCanvas,
        [newCanvas.id]: createIdleTileSession(),
      },
    };

    set({
      project: nextProject,
      ...nextMaps,
      selection: null,
      symmetry: newSymmetry,
      tileSession: createIdleTileSession(),
      selectionDrag: null,
      lassoPoints: [],
      selectionPreviewRect: null,
      brushLineAnchor: null,
    });
  },

  autoLayoutBoardCanvases: () => {
    const { project, selection, historyStack } = get();
    if (!project || project.board.canvases.length <= 1) return;

    pushBoardStructureHistory(historyStack, project, selection);
    set({
      project: autoLayoutBoardCanvasesUseCase(project),
    });
  },



  getCompositeGrid: () => {

    const { project } = get();

    if (!project) return null;

    return compositeProjectLayers(project);

  },

  getCompositeGridForRender: () => {
    const { project, drawingStrokeSession } = get();
    if (!project) return null;

    const canvas = getActiveCanvas(project);
    const size = getCanvasSize(project, canvas.id);
    const activeLayer = getActiveLayer(project);
    const activeIndex = canvas.layers.findIndex((layer) => layer.id === activeLayer.id);

    if (
      drawingStrokeSession &&
      activeIndex >= 0 &&
      isDrawingLayer(activeLayer)
    ) {
      const base = compositeRenderCache.getBelowActiveLayers(
        canvas.layers,
        size,
        activeIndex,
      );
      return compositeActiveLayerOverBase(
        base,
        drawingStrokeSession.surface.underlyingGrid,
        drawingStrokeSession.surface.layerPosition,
        activeLayer.opacity,
      );
    }

    compositeRenderCache.invalidate();
    return compositeProjectLayers(project);
  },

  requestCanvasRender: () => {
    set({ canvasRenderNonce: get().canvasRenderNonce + 1 });
  },



  getActiveLayerGrid: () => {

    const { project } = get();

    if (!project) return null;

    try {
      return getActiveLayerGridFromProject(project);
    } catch {
      return null;
    }

  },



  syncActiveLayer: (grid) => {

    const { project } = get();

    if (!project) return;

    compositeRenderCache.invalidate();
    const updated = syncActiveLayerPixels(project, resolveLayerLocalGrid(grid));

    set({ project: updated });

  },



  getRecentProjects: () => [],



  openProjectManager: () => {

    set({

      projectManagerOpen: true,

      softwareDataPath: softwareDataPathStore.getPath(),

      projectManagerError: null,

      deleteConfirmTarget: null,

    });

  },



  closeProjectManager: () => {

    set({

      projectManagerOpen: false,

      deleteConfirmTarget: null,

      projectManagerError: null,

    });

  },



  pickSoftwareDataPath: async () => {

    const current = softwareDataPathStore.getPath();

    const selected = await open({

      directory: true,

      multiple: false,

      recursive: true,

      defaultPath: current ?? undefined,

      title: "选择软件数据路径",

    });

    if (!selected || typeof selected !== "string") return;



    softwareDataPathStore.setPath(selected);
    setActiveSoftwareDataPath(selected);
    markSoftwareDataPathAccessGranted(selected);

    setUserDataHydrating(true);
    const llmSettingsStore = await loadLlmSettings(llmSettingsRepository, selected);

    set({

      softwareDataPath: selected,

      projectManagerError: null,

      llmSettingsStore,

    });
    setUserDataHydrating(false);

    await get().refreshProjectList();

  },



  refreshProjectList: async () => {

    const workspacePath = softwareDataPathStore.getPath();

    if (!workspacePath) {

      set({ projectSummaries: [], projectListLoading: false });

      return;

    }



    set({ projectListLoading: true, projectManagerError: null });

    const accessiblePath = await ensureSoftwareDataPathAccess(softwareDataPathStore);

    if (!accessiblePath) {

      set({

        projectSummaries: [],

        projectListLoading: false,

        projectManagerError: "无法访问项目目录，请点击「更改目录」重新选择文件夹",

        softwareDataPath: softwareDataPathStore.getPath(),

      });

      return;

    }



    set({ softwareDataPath: accessiblePath });



    try {

      const summaries = await listProjectsInSoftwareDataPath(projectRepository, softwareDataPathStore);

      set({ projectSummaries: summaries, projectListLoading: false });

    } catch {

      set({

        projectSummaries: [],

        projectListLoading: false,

        projectManagerError: "无法读取项目列表，请检查目录权限",

      });

    }

  },



  openProjectByPath: async (path) => {

    try {

      const softwareDataPath = get().softwareDataPath ?? softwareDataPathStore.getPath();
      const project = await loadProject(projectRepository, path, softwareDataPath);

      if (softwareDataPath) {
        await saveLastOpenedProject(lastOpenedProjectStore, softwareDataPath, path);
      }

      get().historyStack.clear();

      const sessionMaps = initializeCanvasSessionMaps(project);
      const session = loadActiveCanvasSession(project, sessionMaps);

      set({

        project,

        manualScaleOverride: null,

        detectedScale: getActiveCanvas(project).scaleFactor,

        projectManagerOpen: false,

        deleteConfirmTarget: null,

        projectManagerError: null,

        ...sessionMaps,

        selection: session.selection,

        symmetry: session.symmetry,

        tileSession: session.tileSession,

        selectionDrag: null,

        lassoPoints: [],

        selectionPreviewRect: null,

      });

    } catch {

      set({ projectManagerError: "打开项目失败，文件可能已损坏或不存在" });

    }

  },



  requestDeleteProject: (summary) => {

    set({ deleteConfirmTarget: summary });

  },



  renameProjectFromList: async (filePath, newName) => {

    try {

      const result = await renameProjectInSoftwareDataPath(

        projectRepository,

        softwareDataPathStore,

        filePath,

        newName,

      );

      if (!result) return;



      const { project } = get();

      if (project?.filePath === filePath) {

        set({ project: result.project });

      }



      set({ projectManagerError: null });

      await get().refreshProjectList();

    } catch {

      set({ projectManagerError: "重命名失败，请检查文件权限或名称是否冲突" });

      throw new Error("rename failed");

    }

  },



  cancelDeleteProject: () => {

    set({ deleteConfirmTarget: null });

  },



  confirmDeleteProject: async () => {

    const { deleteConfirmTarget, project } = get();

    if (!deleteConfirmTarget) return;



    try {

      const softwareDataPath = get().softwareDataPath ?? softwareDataPathStore.getPath();
      const result = await deleteProject(

        projectRepository,

        deleteConfirmTarget.filePath,

        softwareDataPath,

        project,

        lastOpenedProjectStore,

      );

      if (result.shouldReset) {

        get().createBlankProject();
        get().openProjectManager();

      }

      set({ deleteConfirmTarget: null, projectManagerError: null });

      await get().refreshProjectList();

    } catch {

      set({

        deleteConfirmTarget: null,

        projectManagerError: "删除项目失败，请检查文件权限",

      });

    }

  },

  };

});

useAppStore.subscribe(() => {
  if (isHydratingPreferences) return;

  if (preferencesSaveTimer) {
    clearTimeout(preferencesSaveTimer);
  }

  preferencesSaveTimer = setTimeout(() => {
    const softwareDataPath = getActiveSoftwareDataPath();
    if (!softwareDataPath) return;
    void saveEditorPreferences(
      editorPreferencesRepository,
      softwareDataPath,
      extractEditorPreferences(useAppStore.getState()),
    );
    preferencesSaveTimer = null;
  }, 300);
});

useAppStore.subscribe(() => {
  subscribeAppSettingsPersistence(
    () => ({ appSettings: useAppStore.getState().appSettings }),
    appSettingsRepository,
  );
});

useAppStore.subscribe(() => {
  subscribeLlmSettingsPersistence(
    () => ({ llmSettingsStore: useAppStore.getState().llmSettingsStore }),
    llmSettingsRepository,
  );
});

