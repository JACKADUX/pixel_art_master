import type { IPatternBrushRepository } from "@/application/ports/IPatternBrushRepository";
import type { ISoftwareDataPathStore } from "@/application/ports/ISoftwareDataPathStore";
import { ensureSoftwareDataPathAccess } from "@/application/use-cases/EnsureSoftwareDataPathAccess";
import { createPatternBrushFromGrid } from "@/application/use-cases/CreatePatternBrushFromGrid";
import {
  extractPatternBrushPixelsFromSelection,
  resolvePatternBrushSelectionState,
} from "@/application/use-cases/ResolvePatternBrushSelection";
import { deletePatternBrush } from "@/application/use-cases/DeletePatternBrush";
import { renamePatternBrush } from "@/application/use-cases/RenamePatternBrush";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import type { PixelGrid } from "@/domain/canvas/PixelGrid";
import {
  getPatternBrush,
  type PatternBrushLibrary,
} from "@/domain/patternBrush/PatternBrushLibrary";
import { loadOrCreatePatternBrushLibrary } from "@/infrastructure/storage/FilePatternBrushRepository";
import { loadPatternBrushImageAsPixelGrid } from "@/infrastructure/storage/PatternBrushImageLoader";
import { toast } from "@/presentation/stores/toastStore";

export interface PatternBrushDeleteTarget {
  id: string;
  title: string;
}

export interface PatternBrushSliceState {
  patternBrushLibrary: PatternBrushLibrary | null;
  patternBrushLibraryLoading: boolean;
  activePatternBrushId: string | null;
  patternBrushPixelsCache: Record<string, PixelGrid>;
  patternBrushAnchorForegroundColor: PixelColor | null;
  patternBrushPickerOpen: boolean;
  deletePatternBrushTarget: PatternBrushDeleteTarget | null;
}

export interface PatternBrushSliceActions {
  refreshPatternBrushLibrary: () => Promise<void>;
  selectPatternBrush: (id: string) => Promise<void>;
  createPatternBrushFromSelection: () => Promise<void>;
  requestDeletePatternBrush: (id: string) => void;
  cancelDeletePatternBrush: () => void;
  confirmDeletePatternBrush: () => Promise<void>;
  openPatternBrushPicker: () => void;
  closePatternBrushPicker: () => void;
  renamePatternBrushAction: (id: string, title: string) => Promise<void>;
  getActivePatternBrushGrid: () => PixelGrid | null;
  ensurePatternBrushPixelsCached: (id: string) => Promise<PixelGrid | null>;
}

type PatternBrushSet = (
  partial:
    | Partial<PatternBrushSliceState>
    | ((state: PatternBrushSliceState) => Partial<PatternBrushSliceState>),
) => void;

type PatternBrushGet = () => PatternBrushSliceState & {
  softwareDataPath: string | null;
  foregroundColor: PixelColor;
  selection: import("@/domain/selection/SelectionState").SelectionState | null;
  selectionDrag: import("@/presentation/controllers/canvasInteraction").SelectionDragState | null;
  selectionPreviewRect: import("@/domain/selection/SelectionRect").SelectionRect | null;
  lassoPoints: import("@/domain/tool/ITool").Point[];
  toolSettings: import("@/domain/tool/ToolType").ToolSettings;
  project: import("@/domain/project/Project").Project | null;
  setToolSettings: (settings: Partial<import("@/domain/tool/ToolType").ToolSettings>) => void;
  setActiveTool: (tool: import("@/domain/tool/ToolType").ToolType) => void;
  getActiveLayerGrid: () => PixelGrid | null;
  deselectCanvas: () => void;
};

export function createPatternBrushInitialState(): PatternBrushSliceState {
  return {
    patternBrushLibrary: null,
    patternBrushLibraryLoading: false,
    activePatternBrushId: null,
    patternBrushPixelsCache: {},
    patternBrushAnchorForegroundColor: null,
    patternBrushPickerOpen: false,
    deletePatternBrushTarget: null,
  };
}

export function createPatternBrushSlice(
  set: PatternBrushSet,
  get: PatternBrushGet,
  deps: {
    pathStore: ISoftwareDataPathStore;
    patternBrushRepository: IPatternBrushRepository;
  },
): PatternBrushSliceState & PatternBrushSliceActions {
  const resolveWorkspace = async (): Promise<string | null> => {
    const path = get().softwareDataPath ?? deps.pathStore.getPath();
    if (!path) {
      toast.info("请先选择软件数据路径");
      return null;
    }
    const accessible = await ensureSoftwareDataPathAccess(deps.pathStore);
    if (!accessible) {
      toast.error("无法访问软件数据路径，请重新授权");
      return null;
    }
    return accessible;
  };

  const cachePatternPixels = (id: string, grid: PixelGrid) => {
    set((s) => ({
      patternBrushPixelsCache: { ...s.patternBrushPixelsCache, [id]: grid },
    }));
  };

  const loadPixelsForBrush = async (workspacePath: string, brushId: string): Promise<PixelGrid | null> => {
    const cached = get().patternBrushPixelsCache[brushId];
    if (cached) return cached;

    const library = get().patternBrushLibrary;
    if (!library) return null;
    const brush = getPatternBrush(library, brushId);
    if (!brush) return null;

    const grid = await loadPatternBrushImageAsPixelGrid(workspacePath, brush.imageFile);
    if (grid) {
      cachePatternPixels(brushId, grid);
    }
    return grid;
  };

  const activatePatternBrush = (id: string, foregroundColor: PixelColor) => {
    get().setActiveTool("brush");
    get().setToolSettings({ brushShape: "pattern" });
    set({
      activePatternBrushId: id,
      patternBrushAnchorForegroundColor: foregroundColor,
      patternBrushPickerOpen: false,
    });
  };

  return {
    ...createPatternBrushInitialState(),

    refreshPatternBrushLibrary: async () => {
      const workspacePath = await resolveWorkspace();
      if (!workspacePath) return;

      set({ patternBrushLibraryLoading: true });
      try {
        const library = await loadOrCreatePatternBrushLibrary(
          deps.patternBrushRepository,
          workspacePath,
        );
        set({ patternBrushLibrary: library, patternBrushLibraryLoading: false });

        const { activePatternBrushId } = get();
        if (activePatternBrushId && getPatternBrush(library, activePatternBrushId)) {
          await loadPixelsForBrush(workspacePath, activePatternBrushId);
        }
      } catch {
        set({ patternBrushLibraryLoading: false });
        toast.error("加载图案笔刷库失败");
      }
    },

    selectPatternBrush: async (id) => {
      const workspacePath = await resolveWorkspace();
      if (!workspacePath) return;

      let library = get().patternBrushLibrary;
      if (!library) {
        library = await loadOrCreatePatternBrushLibrary(
          deps.patternBrushRepository,
          workspacePath,
        );
        set({ patternBrushLibrary: library });
      }

      if (!getPatternBrush(library, id)) {
        toast.error("图案笔刷不存在");
        return;
      }

      await loadPixelsForBrush(workspacePath, id);
      activatePatternBrush(id, get().foregroundColor);
    },

    createPatternBrushFromSelection: async () => {
      const workspacePath = await resolveWorkspace();
      if (!workspacePath) return;

      const {
        selection,
        selectionDrag,
        lassoPoints,
        toolSettings,
        project,
        foregroundColor,
      } = get();
      if (!project) return;

      const grid = get().getActiveLayerGrid();
      if (!grid) return;

      const selectionState = resolvePatternBrushSelectionState({
        selection,
        selectionDrag,
        lassoPoints,
        toolSettings,
        canvasWidth: project.canvas.width,
        canvasHeight: project.canvas.height,
      });
      if (!selectionState) {
        toast.info("请先创建选区");
        return;
      }

      const cropped = extractPatternBrushPixelsFromSelection(grid, selectionState);
      if (!cropped) {
        toast.error("无法从选区创建图案笔刷");
        return;
      }

      let library = get().patternBrushLibrary;
      if (!library) {
        library = await loadOrCreatePatternBrushLibrary(
          deps.patternBrushRepository,
          workspacePath,
        );
      }

      try {
        const result = await createPatternBrushFromGrid(
          deps.patternBrushRepository,
          workspacePath,
          library,
          cropped,
        );

        cachePatternPixels(result.brush.id, cropped);
        get().deselectCanvas();
        set({ patternBrushLibrary: result.library });
        activatePatternBrush(result.brush.id, foregroundColor);
        toast.info(`已创建图案笔刷「${result.brush.title}」`);
      } catch {
        toast.error("创建图案笔刷失败");
      }
    },

    requestDeletePatternBrush: (id) => {
      const library = get().patternBrushLibrary;
      if (!library) return;
      const brush = getPatternBrush(library, id);
      if (!brush) return;
      set({ deletePatternBrushTarget: { id: brush.id, title: brush.title } });
    },

    cancelDeletePatternBrush: () => set({ deletePatternBrushTarget: null }),

    confirmDeletePatternBrush: async () => {
      const target = get().deletePatternBrushTarget;
      if (!target) return;

      const workspacePath = await resolveWorkspace();
      if (!workspacePath) return;

      const library = get().patternBrushLibrary;
      if (!library) {
        set({ deletePatternBrushTarget: null });
        return;
      }

      try {
        const updated = await deletePatternBrush(
          deps.patternBrushRepository,
          workspacePath,
          library,
          target.id,
        );

        const { [target.id]: _removed, ...restCache } = get().patternBrushPixelsCache;
        const wasActive = get().activePatternBrushId === target.id;

        set({
          patternBrushLibrary: updated,
          patternBrushPixelsCache: restCache,
          deletePatternBrushTarget: null,
          activePatternBrushId: wasActive ? null : get().activePatternBrushId,
          patternBrushAnchorForegroundColor: wasActive
            ? null
            : get().patternBrushAnchorForegroundColor,
        });

        if (wasActive) {
          toast.info("当前图案笔刷已删除");
        }
      } catch {
        toast.error("删除图案笔刷失败");
        set({ deletePatternBrushTarget: null });
      }
    },

    openPatternBrushPicker: () => set({ patternBrushPickerOpen: true }),

    closePatternBrushPicker: () => {
      if (get().deletePatternBrushTarget) {
        set({ patternBrushPickerOpen: false, deletePatternBrushTarget: null });
        return;
      }
      set({ patternBrushPickerOpen: false });
    },

    renamePatternBrushAction: async (id, title) => {
      const workspacePath = await resolveWorkspace();
      if (!workspacePath) return;

      const library = get().patternBrushLibrary;
      if (!library) return;

      try {
        const updated = await renamePatternBrush(
          deps.patternBrushRepository,
          workspacePath,
          library,
          id,
          title,
        );
        set({ patternBrushLibrary: updated });
      } catch {
        toast.error("重命名图案笔刷失败");
      }
    },

    getActivePatternBrushGrid: () => {
      const { activePatternBrushId, patternBrushPixelsCache } = get();
      if (!activePatternBrushId) return null;
      return patternBrushPixelsCache[activePatternBrushId] ?? null;
    },

    ensurePatternBrushPixelsCached: async (id) => {
      const workspacePath = await resolveWorkspace();
      if (!workspacePath) return null;
      return loadPixelsForBrush(workspacePath, id);
    },
  };
}
