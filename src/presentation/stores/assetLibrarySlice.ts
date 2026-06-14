import type { IClipboardService } from "@/application/ports/IClipboardService";
import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import type { IImageProcessor } from "@/application/ports/IImageProcessor";
import type { IProjectsWorkspaceStore } from "@/application/ports/IProjectsWorkspaceStore";
import {
  createAssetCategory,
  createAssetFolder,
  createAssetTag,
  renameAssetFolderUseCase,
} from "@/application/use-cases/AssetFolderUseCases";
import {
  deleteAssetRecord,
  updateAssetRecord,
} from "@/application/use-cases/AssetRecordUseCases";
import { ensureWorkspaceAccess } from "@/application/use-cases/EnsureWorkspaceAccess";
import { importAssetFromCanvasRegion } from "@/application/use-cases/ImportAssetFromCanvasRegion";
import { importAssetFromClipboard } from "@/application/use-cases/ImportAssetFromClipboard";
import { importAssetFromFileDialog } from "@/application/use-cases/ImportAssetFromFile";
import { loadAssetLibrary } from "@/application/use-cases/LoadAssetLibrary";
import { normalizeCaptureRect } from "@/domain/asset/AssetCaptureRect";
import {
  ROOT_FOLDER_ID,
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
import type { SelectionRect } from "@/domain/selection/SelectionRect";
import type { Point } from "@/domain/tool/ITool";
import { toast } from "@/presentation/stores/toastStore";

import { DEFAULT_ASSET_DRAWER_HEIGHT } from "@/domain/preferences/EditorPreferences";

export interface AssetLibrarySliceState {
  assetLibraryModalOpen: boolean;
  assetLibraryDrawerExpanded: boolean;
  assetLibraryDrawerHeight: number;
  assetLibrary: AssetLibraryIndex | null;
  assetLibraryLoading: boolean;
  selectedAssetFolderId: string;
  selectedAssetId: string | null;
  assetCaptureMode: boolean;
  assetCaptureFolderId: string;
  assetCaptureStart: Point | null;
  assetCapturePreviewRect: SelectionRect | null;
}

export interface AssetLibrarySliceActions {
  openAssetLibraryModal: () => void;
  closeAssetLibraryModal: () => void;
  toggleAssetLibraryDrawer: () => void;
  setAssetLibraryDrawerHeight: (height: number) => void;
  refreshAssetLibrary: () => Promise<void>;
  setSelectedAssetFolder: (folderId: string) => void;
  setSelectedAsset: (assetId: string) => void;
  createAssetFolderAction: (parentId: string | null) => Promise<void>;
  renameAssetFolderAction: (folderId: string, name: string) => Promise<void>;
  importAssetFromClipboardAction: () => Promise<void>;
  importAssetFromFileAction: () => Promise<void>;
  startAssetCanvasCapture: () => void;
  cancelAssetCanvasCapture: () => void;
  assetCapturePointerDown: (point: Point) => void;
  assetCapturePointerMove: (point: Point) => void;
  assetCapturePointerUp: (point: Point) => Promise<void>;
  updateAssetRecordAction: (
    assetId: string,
    updates: {
      title?: string;
      notes?: string;
      categoryId?: string | null;
      tagIds?: string[];
    },
  ) => Promise<void>;
  deleteAssetRecordAction: (assetId: string) => Promise<void>;
  createAssetCategoryAction: (name: string) => Promise<void>;
  createAssetTagAction: (name: string) => Promise<void>;
}

type AssetLibrarySet = (
  partial:
    | Partial<AssetLibrarySliceState>
    | ((state: AssetLibrarySliceState) => Partial<AssetLibrarySliceState>),
) => void;

type AssetLibraryGet = () => AssetLibrarySliceState & {
  projectsWorkspacePath: string | null;
  getCompositeGrid: () => import("@/domain/canvas/PixelGrid").PixelGrid | null;
};

export function createAssetLibraryInitialState(): AssetLibrarySliceState {
  return {
    assetLibraryModalOpen: false,
    assetLibraryDrawerExpanded: false,
    assetLibraryDrawerHeight: DEFAULT_ASSET_DRAWER_HEIGHT,
    assetLibrary: null,
    assetLibraryLoading: false,
    selectedAssetFolderId: ROOT_FOLDER_ID,
    selectedAssetId: null,
    assetCaptureMode: false,
    assetCaptureFolderId: ROOT_FOLDER_ID,
    assetCaptureStart: null,
    assetCapturePreviewRect: null,
  };
}

export function createAssetLibrarySlice(
  set: AssetLibrarySet,
  get: AssetLibraryGet,
  deps: {
    workspaceStore: IProjectsWorkspaceStore;
    assetRepository: IAssetLibraryRepository;
    clipboard: IClipboardService;
    imageProcessor: IImageProcessor;
  },
): AssetLibrarySliceState & AssetLibrarySliceActions {
  const resolveWorkspace = async (): Promise<string | null> => {
    const path = get().projectsWorkspacePath ?? deps.workspaceStore.getPath();
    if (!path) {
      toast.info("请先选择项目文件夹");
      return null;
    }
    const accessible = await ensureWorkspaceAccess(deps.workspaceStore);
    if (!accessible) {
      toast.error("无法访问项目目录，请重新授权");
      return null;
    }
    return accessible;
  };

  return {
    ...createAssetLibraryInitialState(),

    openAssetLibraryModal: () => set({ assetLibraryModalOpen: true }),

    closeAssetLibraryModal: () => set({ assetLibraryModalOpen: false }),

    toggleAssetLibraryDrawer: () =>
      set((s) => ({ assetLibraryDrawerExpanded: !s.assetLibraryDrawerExpanded })),

    setAssetLibraryDrawerHeight: (height) =>
      set({ assetLibraryDrawerHeight: height }),

    refreshAssetLibrary: async () => {
      const workspacePath = await resolveWorkspace();
      if (!workspacePath) return;
      set({ assetLibraryLoading: true });
      try {
        const library = await loadAssetLibrary(deps.assetRepository, workspacePath);
        set({ assetLibrary: library, assetLibraryLoading: false });
      } catch {
        set({ assetLibraryLoading: false });
        toast.error("加载资产库失败");
      }
    },

    setSelectedAssetFolder: (folderId) =>
      set({ selectedAssetFolderId: folderId, selectedAssetId: null }),

    setSelectedAsset: (assetId) => set({ selectedAssetId: assetId }),

    createAssetFolderAction: async (parentId) => {
      const workspacePath = await resolveWorkspace();
      const library = get().assetLibrary;
      if (!workspacePath || !library) return;
      try {
        const updated = await createAssetFolder(
          deps.assetRepository,
          workspacePath,
          library,
          "新建文件夹",
          parentId,
        );
        set({ assetLibrary: updated });
      } catch {
        toast.error("创建文件夹失败");
      }
    },

    renameAssetFolderAction: async (folderId, name) => {
      const workspacePath = await resolveWorkspace();
      const library = get().assetLibrary;
      if (!workspacePath || !library) return;
      try {
        const updated = await renameAssetFolderUseCase(
          deps.assetRepository,
          workspacePath,
          library,
          folderId,
          name,
        );
        set({ assetLibrary: updated });
      } catch {
        toast.error("重命名文件夹失败");
      }
    },

    importAssetFromClipboardAction: async () => {
      const workspacePath = await resolveWorkspace();
      let library = get().assetLibrary;
      if (!workspacePath) return;
      if (!library) {
        library = await loadAssetLibrary(deps.assetRepository, workspacePath);
        set({ assetLibrary: library });
      }
      try {
        const result = await importAssetFromClipboard(
          deps.clipboard,
          deps.assetRepository,
          workspacePath,
          library,
          get().selectedAssetFolderId,
        );
        if (!result) {
          toast.info("剪贴板中没有图像");
          return;
        }
        set({
          assetLibrary: result.library,
          selectedAssetId: result.asset.id,
        });
        toast.info("已导入到资产库");
      } catch {
        toast.error("从剪贴板导入失败");
      }
    },

    importAssetFromFileAction: async () => {
      const workspacePath = await resolveWorkspace();
      let library = get().assetLibrary;
      if (!workspacePath) return;
      if (!library) {
        library = await loadAssetLibrary(deps.assetRepository, workspacePath);
        set({ assetLibrary: library });
      }
      try {
        const result = await importAssetFromFileDialog(
          deps.assetRepository,
          deps.imageProcessor,
          workspacePath,
          library,
          get().selectedAssetFolderId,
        );
        if (!result) return;
        set({
          assetLibrary: result.library,
          selectedAssetId: result.asset.id,
        });
        toast.info("已导入到资产库");
      } catch {
        toast.error("从文件导入失败");
      }
    },

    startAssetCanvasCapture: () => {
      const folderId = get().selectedAssetFolderId;
      set({
        assetLibraryModalOpen: false,
        assetCaptureMode: true,
        assetCaptureFolderId: folderId,
        assetCaptureStart: null,
        assetCapturePreviewRect: null,
      });
      toast.info("在画布上拖拽框选区域，Esc 取消");
    },

    cancelAssetCanvasCapture: () =>
      set({
        assetCaptureMode: false,
        assetCaptureStart: null,
        assetCapturePreviewRect: null,
      }),

    assetCapturePointerDown: (point) => {
      set({
        assetCaptureStart: point,
        assetCapturePreviewRect: {
          x: point.x,
          y: point.y,
          width: 1,
          height: 1,
        },
      });
    },

    assetCapturePointerMove: (point) => {
      const start = get().assetCaptureStart;
      if (!start) return;
      set({
        assetCapturePreviewRect: normalizeCaptureRect(
          start.x,
          start.y,
          point.x,
          point.y,
        ),
      });
    },

    assetCapturePointerUp: async (point) => {
      const start = get().assetCaptureStart;
      if (!start) return;
      const rect = normalizeCaptureRect(start.x, start.y, point.x, point.y);
      set({
        assetCaptureMode: false,
        assetCaptureStart: null,
        assetCapturePreviewRect: null,
      });

      const workspacePath = await resolveWorkspace();
      let library = get().assetLibrary;
      const composite = get().getCompositeGrid();
      if (!workspacePath || !composite) {
        toast.error("无法保存截图");
        return;
      }
      if (!library) {
        library = await loadAssetLibrary(deps.assetRepository, workspacePath);
      }

      try {
        const result = await importAssetFromCanvasRegion(
          deps.assetRepository,
          workspacePath,
          library,
          get().assetCaptureFolderId,
          composite,
          rect,
        );
        if (!result) {
          toast.error("框选区域无效");
          return;
        }
        set({
          assetLibrary: result.library,
          selectedAssetId: result.asset.id,
          selectedAssetFolderId: get().assetCaptureFolderId,
          assetLibraryDrawerExpanded: true,
        });
        toast.info("已保存到资产库");
      } catch {
        toast.error("保存截图失败");
      }
    },

    updateAssetRecordAction: async (assetId, updates) => {
      const workspacePath = await resolveWorkspace();
      const library = get().assetLibrary;
      if (!workspacePath || !library) return;
      try {
        const updated = await updateAssetRecord(
          deps.assetRepository,
          workspacePath,
          library,
          assetId,
          updates,
        );
        set({ assetLibrary: updated });
      } catch {
        toast.error("更新资产失败");
      }
    },

    deleteAssetRecordAction: async (assetId) => {
      const workspacePath = await resolveWorkspace();
      const library = get().assetLibrary;
      if (!workspacePath || !library) return;
      try {
        const updated = await deleteAssetRecord(
          deps.assetRepository,
          workspacePath,
          library,
          assetId,
        );
        set({
          assetLibrary: updated,
          selectedAssetId:
            get().selectedAssetId === assetId ? null : get().selectedAssetId,
        });
        toast.info("已删除资产");
      } catch {
        toast.error("删除资产失败");
      }
    },

    createAssetCategoryAction: async (name) => {
      const workspacePath = await resolveWorkspace();
      const library = get().assetLibrary;
      if (!workspacePath || !library) return;
      try {
        let updated = await createAssetCategory(
          deps.assetRepository,
          workspacePath,
          library,
          name,
        );
        const newCategory = updated.categories.find((c) => c.name === name.trim());
        const selectedAssetId = get().selectedAssetId;
        if (newCategory && selectedAssetId) {
          updated = await updateAssetRecord(
            deps.assetRepository,
            workspacePath,
            updated,
            selectedAssetId,
            { categoryId: newCategory.id },
          );
        }
        set({ assetLibrary: updated });
      } catch {
        toast.error("创建分类失败");
      }
    },

    createAssetTagAction: async (name) => {
      const workspacePath = await resolveWorkspace();
      const library = get().assetLibrary;
      if (!workspacePath || !library) return;
      try {
        let updated = await createAssetTag(
          deps.assetRepository,
          workspacePath,
          library,
          name,
        );
        const newTag = updated.tags.find((t) => t.name === name.trim());
        const selectedAssetId = get().selectedAssetId;
        const asset = selectedAssetId
          ? updated.assets.find((a) => a.id === selectedAssetId)
          : null;
        if (newTag && asset && !asset.tagIds.includes(newTag.id)) {
          updated = await updateAssetRecord(
            deps.assetRepository,
            workspacePath,
            updated,
            selectedAssetId!,
            { tagIds: [...asset.tagIds, newTag.id] },
          );
        }
        set({ assetLibrary: updated });
      } catch {
        toast.error("创建标签失败");
      }
    },
  };
}
