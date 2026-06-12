import {

  applyToolPointerDown,

  applyToolPointerMove,

  applyToolPointerUp,

} from "@/application/use-cases/DrawStroke";

import type { CapturableMonitor } from "@/application/ports/ICaptureService";

import {

  replaceProjectFromImagePath,

  replaceProjectFromScreenCapture,

  replaceProjectFromWindowCapture,

} from "@/application/use-cases/ReplaceProjectFromImage";

import {

  addDrawingLayer,

  getActiveLayerGridFromProject,

  removeLayerFromProject,

  renameLayerInProject,

  reorderLayerInProject,

  setActiveLayer,

  syncActiveLayerPixels,

  toggleLayerVisibilityInProject,

} from "@/application/use-cases/LayerUseCases";

import { loadProject } from "@/application/use-cases/LoadProject";

import { deleteProject } from "@/application/use-cases/DeleteProject";

import { ensureWorkspaceAccess } from "@/application/use-cases/EnsureWorkspaceAccess";
import { listProjectsInWorkspace } from "@/application/use-cases/ListProjectsInWorkspace";

import {

  resolveDefaultSavePath,

  resolveProjectSavePath,

} from "@/application/use-cases/ResolveProjectSavePath";

import {

  addNote,

  deleteNote,

  updateProjectNote,

} from "@/application/use-cases/NoteUseCases";

import { saveProject } from "@/application/use-cases/SaveProject";

import { rgba, TRANSPARENT } from "@/domain/canvas/PixelColor";

import { PixelGrid } from "@/domain/canvas/PixelGrid";

import {

  getFirstReferenceLayer,

  getLayerGrid,

  resizeAllLayers,

} from "@/domain/layer/LayerOperations";

import type { Note } from "@/domain/note/Note";

import type { ProjectSummary } from "@/domain/project/ProjectSummary";

import {

  createEmptyProject,

  getCanvasSize,

  getCompositeGrid as compositeProjectLayers,

  touchProject,

  withCanvasSize,

  withLayers,

  type Project,

} from "@/domain/project/Project";

import type { Point } from "@/domain/tool/ITool";

import {

  DEFAULT_TOOL_SETTINGS,

  type ToolSettings,

  type ToolType,

} from "@/domain/tool/ToolType";

import { imageProcessor } from "@/infrastructure/image/CanvasImageProcessor";

import { extractPaletteFromGrids } from "@/infrastructure/image/PaletteExtractor";

import { downscaleImage, detectPixelScale } from "@/infrastructure/image/PixelDownscaler";

import { projectRepository } from "@/infrastructure/storage/JsonProjectRepository";

import { projectsWorkspaceStore } from "@/infrastructure/storage/LocalProjectsWorkspaceStore";

import { captureService } from "@/infrastructure/tauri/TauriCaptureService";

import { windowService } from "@/infrastructure/tauri/TauriWindowService";

import { navigateToPreviewPoint as navigateToPreviewPointUseCase } from "@/application/use-cases/NavigateToPoint";

import { zoomNavigatorPreviewAtPoint as zoomNavigatorPreviewAtPointUseCase } from "@/application/use-cases/ZoomNavigatorPreviewAtPoint";

import {
  applyPreviewPanDelta,
  clampPreviewScale,
  type ViewportSnapshot,
} from "@/domain/viewport/NavigatorViewport";

import { resolveNavigatorResizeConstraints } from "@/domain/viewport/NavigatorPanelResize";

import { open, save } from "@tauri-apps/plugin-dialog";

import { create } from "zustand";

const NAVIGATOR_HEADER_HEIGHT = 28;
const NAVIGATOR_MIN_WIDTH = 100;
const NAVIGATOR_MIN_HEIGHT = 80;
const NAVIGATOR_DEFAULT_WIDTH = 160;
const NAVIGATOR_DEFAULT_HEIGHT = 120;

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

export interface NavigatorState {
  visible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  previewScale: number;
  previewPan: { x: number; y: number };
}

interface AppState {

  project: Project | null;

  activeTool: ToolType;

  toolSettings: ToolSettings;

  currentColor: number;

  zoom: number;

  alwaysOnTop: boolean;

  isDrawing: boolean;

  drawStart: Point | null;

  lastPoint: Point | null;

  manualScaleOverride: number | null;

  detectedScale: number;

  rightPanelTab: "palette" | "notes";

  paletteViewMode: "grid" | "oklabMap";

  editingNoteId: string | null;

  draftNote: string;

  isCapturing: boolean;

  captureError: string | null;

  monitorPickerOpen: boolean;

  availableMonitors: CapturableMonitor[];

  projectManagerOpen: boolean;

  projectsWorkspacePath: string | null;

  projectSummaries: ProjectSummary[];

  projectListLoading: boolean;

  deleteConfirmTarget: ProjectSummary | null;

  projectManagerError: string | null;

  navigator: NavigatorState;

  viewportSnapshot: ViewportSnapshot | null;

  viewportContainer: HTMLDivElement | null;



  init: () => Promise<void>;

  newProject: () => void;

  openProject: () => Promise<void>;

  saveCurrentProject: () => Promise<void>;

  saveProjectAs: () => Promise<void>;

  setActiveTool: (tool: ToolType) => void;

  setToolSettings: (settings: Partial<ToolSettings>) => void;

  setCurrentColor: (color: number) => void;

  setZoom: (zoom: number) => void;

  toggleGrid: () => void;

  toggleNavigator: () => void;

  setNavigatorPosition: (x: number, y: number) => void;

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

  setViewportContainer: (el: HTMLDivElement | null) => void;

  syncViewportSnapshot: (canvasEl?: HTMLCanvasElement | null) => void;

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

  pointerDown: (point: Point) => void;

  pointerMove: (point: Point) => void;

  pointerUp: (point: Point) => void;

  pickColorAt: (point: Point) => void;

  setRightPanelTab: (tab: "palette" | "notes") => void;

  setPaletteViewMode: (mode: "grid" | "oklabMap") => void;

  setActiveLayer: (layerId: string) => void;

  toggleLayerVisibility: (layerId: string) => void;

  renameLayer: (layerId: string, name: string) => void;

  addDrawingLayer: () => void;

  removeLayer: (layerId: string) => void;

  reorderLayer: (fromIndex: number, toIndex: number) => void;

  setDraftNote: (content: string) => void;

  saveDraftNote: () => void;

  selectNote: (note: Note) => void;

  updateSelectedNote: () => void;

  removeNote: (noteId: string) => void;

  newNoteDraft: () => void;

  getCompositeGrid: () => PixelGrid | null;

  getActiveLayerGrid: () => PixelGrid | null;

  syncActiveLayer: (grid: PixelGrid) => void;

  getRecentProjects: () => string[];

  openProjectManager: () => void;

  closeProjectManager: () => void;

  pickProjectsWorkspace: () => Promise<void>;

  refreshProjectList: () => Promise<void>;

  openProjectByPath: (path: string) => Promise<void>;

  requestDeleteProject: (summary: ProjectSummary) => void;

  cancelDeleteProject: () => void;

  confirmDeleteProject: () => Promise<void>;

}



async function promptSaveAs(defaultName: string): Promise<string | null> {

  const defaultPath = await resolveDefaultSavePath(projectsWorkspaceStore, defaultName);

  const selected = await save({

    filters: [{ name: "像素画项目", extensions: ["pixelart.json"] }],

    defaultPath: defaultPath ?? `${defaultName}.pixelart.json`,

  });

  return selected ?? null;

}



function syncPalette(project: Project): Project {

  const size = getCanvasSize(project);

  const grids = project.canvas.layers.map((l) => getLayerGrid(l, size));

  return {

    ...project,

    palette: extractPaletteFromGrids(...grids),

  };

}



export const useAppStore = create<AppState>((set, get) => ({

  project: createEmptyProject(),

  activeTool: "brush",

  toolSettings: { ...DEFAULT_TOOL_SETTINGS },

  currentColor: rgba(255, 0, 0),

  zoom: 8,

  alwaysOnTop: false,

  isDrawing: false,

  drawStart: null,

  lastPoint: null,

  manualScaleOverride: null,

  detectedScale: 1,

  rightPanelTab: "palette",

  paletteViewMode: "grid",

  editingNoteId: null,

  draftNote: "",

  isCapturing: false,

  captureError: null,

  monitorPickerOpen: false,

  availableMonitors: [],

  projectManagerOpen: false,

  projectsWorkspacePath: projectsWorkspaceStore.getPath(),

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
  },

  viewportSnapshot: null,

  viewportContainer: null,



  init: async () => {

    set({ projectsWorkspacePath: projectsWorkspaceStore.getPath() });

    const stored = windowService.getStoredPreference();

    if (stored) {

      await windowService.setAlwaysOnTop(true);

      set({ alwaysOnTop: true });

    }

  },



  newProject: () => {

    set({

      project: createEmptyProject(),

      manualScaleOverride: null,

      detectedScale: 1,

      editingNoteId: null,

      draftNote: "",

    });

  },



  openProject: async () => {

    const selected = await open({

      multiple: false,

      filters: [{ name: "像素画项目", extensions: ["pixelart.json", "json"] }],

    });

    if (!selected || typeof selected !== "string") return;

    const project = await loadProject(projectRepository, selected);

    set({

      project,

      manualScaleOverride: null,

      detectedScale: project.canvas.scaleFactor,

      editingNoteId: null,

      draftNote: "",

    });

  },



  saveCurrentProject: async () => {

    const { project } = get();

    if (!project) return;

    if (project.filePath) {

      const saved = await saveProject(projectRepository, project, project.filePath);

      set({ project: saved });

    } else if (projectsWorkspaceStore.getPath()) {

      try {

        const targetPath = await resolveProjectSavePath(projectsWorkspaceStore, project.name);

        if (!targetPath) {

          await get().saveProjectAs();

          return;

        }

        const saved = await saveProject(projectRepository, project, targetPath);

        set({ project: saved });

      } catch {

        await get().saveProjectAs();

      }

    } else {

      await get().saveProjectAs();

    }

  },



  saveProjectAs: async () => {

    const { project } = get();

    if (!project) return;

    const defaultPath = await resolveDefaultSavePath(projectsWorkspaceStore, project.name);

    const selected = await save({

      filters: [{ name: "像素画项目", extensions: ["pixelart.json"] }],

      defaultPath: defaultPath ?? `${project.name}.pixelart.json`,

    });

    if (!selected) return;

    const saved = await saveProject(projectRepository, project, selected);

    set({ project: saved });

  },



  setActiveTool: (tool) => set({ activeTool: tool }),



  setToolSettings: (settings) =>

    set((s) => ({ toolSettings: { ...s.toolSettings, ...settings } })),



  setCurrentColor: (color) => set({ currentColor: color }),



  setZoom: (zoom) => set({ zoom: Math.max(1, Math.min(32, zoom)) }),



  toggleGrid: () =>

    set((s) => ({

      project: s.project

        ? { ...s.project, grid: { ...s.project.grid, visible: !s.project.grid.visible } }

        : null,

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

      return {

        navigator: {

          ...s.navigator,

          visible: true,

          position: {

            x: Math.min(position.x, Math.max(0, container.clientWidth - panelWidth)),

            y: Math.min(position.y, Math.max(0, container.clientHeight - panelHeight)),

          },

        },

      };

    }),



  setNavigatorPosition: (x, y) =>

    set((s) => {

      const container = s.viewportContainer;

      const panelWidth = s.navigator.size.width;

      const panelHeight = s.navigator.size.height + NAVIGATOR_HEADER_HEIGHT;

      const maxX = container ? Math.max(0, container.clientWidth - panelWidth) : x;

      const maxY = container ? Math.max(0, container.clientHeight - panelHeight) : y;

      return {

        navigator: {

          ...s.navigator,

          position: {

            x: Math.max(0, Math.min(maxX, x)),

            y: Math.max(0, Math.min(maxY, y)),

          },

        },

      };

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

        },

      };

    }),



  setViewportContainer: (el) => set({ viewportContainer: el }),



  syncViewportSnapshot: (canvasEl) => {

    const container = get().viewportContainer;

    if (!container) {

      set({ viewportSnapshot: null });

      return;

    }

    const canvas = canvasEl ?? container.querySelector("canvas");

    if (!canvas) return;

    const containerRect = container.getBoundingClientRect();

    const canvasRect = canvas.getBoundingClientRect();

    const snapshot: ViewportSnapshot = {

      scrollX: container.scrollLeft,

      scrollY: container.scrollTop,

      containerWidth: container.clientWidth,

      containerHeight: container.clientHeight,

      canvasDisplayWidth: canvasRect.width,

      canvasDisplayHeight: canvasRect.height,

      canvasOffsetX: canvasRect.left - containerRect.left + container.scrollLeft,

      canvasOffsetY: canvasRect.top - containerRect.top + container.scrollTop,

    };

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

    get().syncViewportSnapshot();

  },



  toggleAlwaysOnTop: async () => {

    const next = !get().alwaysOnTop;

    await windowService.setAlwaysOnTop(next);

    set({ alwaysOnTop: next });

  },



  setManualScale: (scale) => set({ manualScaleOverride: scale }),



  reapplyScale: () => {

    const { project, manualScaleOverride } = get();

    if (!project) return;



    const refLayer = getFirstReferenceLayer(project.canvas.layers);

    if (!refLayer) return;



    const size = getCanvasSize(project);

    const refGrid = getLayerGrid(refLayer, size);

    const scale = project.canvas.scaleFactor;

    const upscaled = upscaleGrid(refGrid, scale);

    const upscaledRgba = upscaled.toRgba();

    const upscaledImage = new ImageData(

      new Uint8ClampedArray(upscaledRgba),

      upscaled.width,

      upscaled.height,

    );

    const detected = detectPixelScale(upscaledImage);

    const applied = manualScaleOverride ?? detected;

    const newRefGrid = downscaleImage(upscaledImage, applied);



    const oldSize = size;

    const newSize = { width: newRefGrid.width, height: newRefGrid.height };

    let layers = project.canvas.layers.map((l) =>

      l.id === refLayer.id

        ? { ...l, pixels: newRefGrid.toUint32Array() }

        : l,

    );

    layers = resizeAllLayers(layers, oldSize, newSize);



    const grids = layers.map((l) => getLayerGrid(l, newSize));

    const updated = touchProject({

      ...withLayers(withCanvasSize(project, newSize.width, newSize.height), layers),

      canvas: {

        ...project.canvas,

        width: newSize.width,

        height: newSize.height,

        scaleFactor: applied,

        layers,

      },

      palette: extractPaletteFromGrids(...grids),

    });



    set({

      project: updated,

      detectedScale: detected,

    });

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

    const { project, manualScaleOverride } = get();

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

        manualScaleOverride ?? undefined,

      );

      if (result) {

        set({

          project: result.project,

          detectedScale: result.detectedScale,

          manualScaleOverride: null,

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

    const { project, manualScaleOverride } = get();

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

        manualScaleOverride ?? undefined,

      );

      if (result) {

        set({

          project: result.project,

          detectedScale: result.detectedScale,

          manualScaleOverride: null,

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



    const { project, manualScaleOverride } = get();

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

        manualScaleOverride ?? undefined,

      );

      if (result) {

        set({

          project: result.project,

          detectedScale: result.detectedScale,

          manualScaleOverride: null,

        });

      }

    } catch {

      set({ captureError: "导入图片失败，请重试" });

    } finally {

      set({ isCapturing: false });

    }

  },



  pointerDown: (point) => {

    const { project, activeTool, currentColor, toolSettings } = get();

    if (!project) return;

    const grid = getActiveLayerGridFromProject(project);

    const color = activeTool === "eraser" ? TRANSPARENT : currentColor;

    applyToolPointerDown(grid, activeTool, color, toolSettings, point);

    get().syncActiveLayer(grid);

    set({ isDrawing: true, drawStart: point, lastPoint: point });

  },



  pointerMove: (point) => {

    const { project, activeTool, currentColor, toolSettings, isDrawing, lastPoint } = get();

    if (!project || !isDrawing || !lastPoint) return;

    if (activeTool === "fill") return;

    const grid = getActiveLayerGridFromProject(project);

    const color = activeTool === "eraser" ? TRANSPARENT : currentColor;

    applyToolPointerMove(grid, activeTool, color, toolSettings, lastPoint, point);

    get().syncActiveLayer(grid);

    set({ lastPoint: point });

  },



  pointerUp: (point) => {

    const { project, activeTool, currentColor, toolSettings, isDrawing, drawStart } = get();

    if (!project || !isDrawing || !drawStart) return;

    if (activeTool === "shape") {

      const grid = getActiveLayerGridFromProject(project);

      const color = currentColor;

      applyToolPointerUp(grid, activeTool, color, toolSettings, drawStart, point);

      get().syncActiveLayer(grid);

    }

    set({ isDrawing: false, drawStart: null, lastPoint: null });

  },



  pickColorAt: (point) => {

    const composite = get().getCompositeGrid();

    if (!composite) return;

    const color = composite.getPixel(point.x, point.y);

    if (((color >>> 24) & 0xff) > 0) {

      set({ currentColor: color | 0xff000000 });

    }

  },



  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  setPaletteViewMode: (mode) => set({ paletteViewMode: mode }),



  setActiveLayer: (layerId) => {

    const { project } = get();

    if (!project) return;

    set({ project: setActiveLayer(project, layerId) });

  },



  toggleLayerVisibility: (layerId) => {

    const { project } = get();

    if (!project) return;

    set({ project: toggleLayerVisibilityInProject(project, layerId) });

  },



  renameLayer: (layerId, name) => {

    const { project } = get();

    if (!project || !name.trim()) return;

    set({ project: renameLayerInProject(project, layerId, name) });

  },



  addDrawingLayer: () => {

    const { project } = get();

    if (!project) return;

    set({ project: syncPalette(addDrawingLayer(project)) });

  },



  removeLayer: (layerId) => {

    const { project } = get();

    if (!project) return;

    const updated = removeLayerFromProject(project, layerId);

    if (updated) set({ project: syncPalette(updated) });

  },



  reorderLayer: (fromIndex, toIndex) => {

    const { project } = get();

    if (!project) return;

    set({ project: reorderLayerInProject(project, fromIndex, toIndex) });

  },



  setDraftNote: (content) => set({ draftNote: content }),



  saveDraftNote: () => {

    const { project, draftNote, editingNoteId } = get();

    if (!project || !draftNote.trim()) return;

    let updated: Project;

    if (editingNoteId) {

      updated = updateProjectNote(project, editingNoteId, draftNote);

    } else {

      updated = addNote(project, draftNote);

    }

    set({ project: updated, draftNote: "", editingNoteId: null });

  },



  selectNote: (note) =>

    set({ editingNoteId: note.id, draftNote: note.content, rightPanelTab: "notes" }),



  updateSelectedNote: () => get().saveDraftNote(),



  removeNote: (noteId) => {

    const { project, editingNoteId } = get();

    if (!project) return;

    set({

      project: deleteNote(project, noteId),

      editingNoteId: editingNoteId === noteId ? null : editingNoteId,

      draftNote: editingNoteId === noteId ? "" : get().draftNote,

    });

  },



  newNoteDraft: () => set({ editingNoteId: null, draftNote: "" }),



  getCompositeGrid: () => {

    const { project } = get();

    if (!project) return null;

    return compositeProjectLayers(project);

  },



  getActiveLayerGrid: () => {

    const { project } = get();

    if (!project) return null;

    return getActiveLayerGridFromProject(project);

  },



  syncActiveLayer: (grid) => {

    const { project } = get();

    if (!project) return;

    const updated = syncActiveLayerPixels(project, grid);

    set({ project: syncPalette(updated) });

  },



  getRecentProjects: () => projectRepository.getRecent(),



  openProjectManager: () => {

    set({

      projectManagerOpen: true,

      projectsWorkspacePath: projectsWorkspaceStore.getPath(),

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



  pickProjectsWorkspace: async () => {

    const current = projectsWorkspaceStore.getPath();

    const selected = await open({

      directory: true,

      multiple: false,

      recursive: true,

      defaultPath: current ?? undefined,

      title: "选择项目文件夹",

    });

    if (!selected || typeof selected !== "string") return;



    projectsWorkspaceStore.setPath(selected);

    set({

      projectsWorkspacePath: selected,

      projectManagerError: null,

    });

    await get().refreshProjectList();

  },



  refreshProjectList: async () => {

    const workspacePath = projectsWorkspaceStore.getPath();

    if (!workspacePath) {

      set({ projectSummaries: [], projectListLoading: false });

      return;

    }



    set({ projectListLoading: true, projectManagerError: null });

    const accessiblePath = await ensureWorkspaceAccess(projectsWorkspaceStore);

    if (!accessiblePath) {

      set({

        projectSummaries: [],

        projectListLoading: false,

        projectManagerError: "无法访问项目目录，请点击「更改目录」重新选择文件夹",

        projectsWorkspacePath: projectsWorkspaceStore.getPath(),

      });

      return;

    }



    set({ projectsWorkspacePath: accessiblePath });



    try {

      const summaries = await listProjectsInWorkspace(projectRepository, projectsWorkspaceStore);

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

      const project = await loadProject(projectRepository, path);

      set({

        project,

        manualScaleOverride: null,

        detectedScale: project.canvas.scaleFactor,

        editingNoteId: null,

        draftNote: "",

        projectManagerOpen: false,

        deleteConfirmTarget: null,

        projectManagerError: null,

      });

    } catch {

      set({ projectManagerError: "打开项目失败，文件可能已损坏或不存在" });

    }

  },



  requestDeleteProject: (summary) => {

    set({ deleteConfirmTarget: summary });

  },



  cancelDeleteProject: () => {

    set({ deleteConfirmTarget: null });

  },



  confirmDeleteProject: async () => {

    const { deleteConfirmTarget, project } = get();

    if (!deleteConfirmTarget) return;



    try {

      const result = await deleteProject(

        projectRepository,

        deleteConfirmTarget.filePath,

        project,

      );

      if (result.shouldReset) {

        get().newProject();

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

}));



function upscaleGrid(grid: PixelGrid, scale: number): PixelGrid {

  const w = grid.width * scale;

  const h = grid.height * scale;

  const result = PixelGrid.createEmpty(w, h);

  for (let y = 0; y < grid.height; y++) {

    for (let x = 0; x < grid.width; x++) {

      const color = grid.getPixel(x, y);

      for (let dy = 0; dy < scale; dy++) {

        for (let dx = 0; dx < scale; dx++) {

          result.setPixel(x * scale + dx, y * scale + dy, color);

        }

      }

    }

  }

  return result;

}


