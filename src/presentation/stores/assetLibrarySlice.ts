import type { IClipboardService } from "@/application/ports/IClipboardService";
import type { IAssetLibraryRepository } from "@/application/ports/IAssetLibraryRepository";
import type { IImageProcessor } from "@/application/ports/IImageProcessor";
import type { IProjectsWorkspaceStore } from "@/application/ports/IProjectsWorkspaceStore";
import {
  createAssetCategory,
  createAssetFolder,
  createAssetTag,
  deleteAssetFolderTree,
  renameAssetFolderUseCase,
} from "@/application/use-cases/AssetFolderUseCases";
import {
  deleteAssetRecord,
  updateAssetRecord,
} from "@/application/use-cases/AssetRecordUseCases";
import { createMarkdownAsset } from "@/application/use-cases/CreateMarkdownAsset";
import { ensureWorkspaceAccess } from "@/application/use-cases/EnsureWorkspaceAccess";
import { importAssetFromCanvasRegion } from "@/application/use-cases/ImportAssetFromCanvasRegion";
import { importAssetFromClipboard } from "@/application/use-cases/ImportAssetFromClipboard";
import { importAssetFromFileDialog } from "@/application/use-cases/ImportAssetFromFile";
import { loadAssetLibrary } from "@/application/use-cases/LoadAssetLibrary";
import { normalizeCaptureRect } from "@/domain/asset/AssetCaptureRect";
import type {
  AssetCapturePhase,
  AssetCaptureSource,
} from "@/domain/asset/AssetCaptureRect";
import {
  adjustCaptureRectBottomRight,
  adjustCaptureRectTopLeft,
} from "@/domain/asset/AssetCaptureRect";
import {
  ROOT_FOLDER_ID,
  countAssetsInFolders,
  findAssetById,
  findFolderById,
  getFolderPathLabel,
  listDescendantFolderIds,
  type AssetFolderDeletionDisposition,
  type AssetLibraryIndex,
} from "@/domain/asset/AssetLibrary";
import type { SelectionRect } from "@/domain/selection/SelectionRect";
import type { Point } from "@/domain/tool/ITool";
import { toast } from "@/presentation/stores/toastStore";

import {
  DEFAULT_ASSET_DRAWER_HEIGHT,
  DEFAULT_ASSET_FOLDER_TREE_WIDTH,
} from "@/domain/preferences/EditorPreferences";

export interface AssetFolderDeleteTarget {
  folderId: string;
  folderName: string;
  assetCount: number;
  childFolderCount: number;
}

export interface AssetDeleteTarget {
  assetId: string;
  title: string;
}

export interface AssetMoveTarget {
  assetId: string;
  title: string;
  fromFolderId: string;
  toFolderId: string;
  fromFolderLabel: string;
  toFolderLabel: string;
}

export interface AssetLibrarySliceState {
  assetLibraryModalOpen: boolean;
  assetLibraryDrawerExpanded: boolean;
  assetLibraryDrawerHeight: number;
  assetFolderTreeWidth: number;
  assetLibrary: AssetLibraryIndex | null;
  assetLibraryLoading: boolean;
  selectedAssetFolderId: string;
  selectedAssetId: string | null;
  assetCapturePhase: AssetCapturePhase;
  assetCaptureFolderId: string;
  assetCaptureStart: Point | null;
  assetCaptureRect: SelectionRect | null;
  assetCaptureSource: AssetCaptureSource;
  deleteAssetFolderTarget: AssetFolderDeleteTarget | null;
  deleteAssetTarget: AssetDeleteTarget | null;
  moveAssetTarget: AssetMoveTarget | null;
  assetImageViewerAssetId: string | null;
}

export interface AssetLibrarySliceActions {
  openAssetLibraryModal: () => void;
  closeAssetLibraryModal: () => void;
  toggleAssetLibraryDrawer: () => void;
  setAssetLibraryDrawerHeight: (height: number) => void;
  setAssetFolderTreeWidth: (width: number) => void;
  refreshAssetLibrary: () => Promise<void>;
  setSelectedAssetFolder: (folderId: string) => void;
  setSelectedAsset: (assetId: string | null) => void;
  createAssetFolderAction: (parentId: string | null) => Promise<void>;
  renameAssetFolderAction: (folderId: string, name: string) => Promise<void>;
  importAssetFromClipboardAction: () => Promise<void>;
  importAssetFromFileAction: () => Promise<void>;
  createMarkdownAssetAction: () => Promise<void>;
  startAssetCanvasCapture: () => void;
  cancelAssetCanvasCapture: () => void;
  assetCapturePointerDown: (point: Point) => void;
  assetCapturePointerMove: (point: Point) => void;
  assetCapturePointerUp: (point: Point) => void;
  adjustAssetCaptureRect: (
    dx: number,
    dy: number,
    corner: "topLeft" | "bottomRight",
  ) => void;
  setAssetCaptureSource: (source: AssetCaptureSource) => void;
  confirmAssetCanvasCapture: () => Promise<void>;
  updateAssetRecordAction: (
    assetId: string,
    updates: {
      title?: string;
      notes?: string;
      content?: string;
      categoryId?: string | null;
      tagIds?: string[];
      folderId?: string;
    },
  ) => Promise<void>;
  deleteAssetRecordAction: (assetId: string) => Promise<void>;
  requestDeleteAssetRecord: (assetId: string) => void;
  cancelDeleteAssetRecord: () => void;
  confirmDeleteAssetRecord: () => Promise<void>;
  requestMoveAssetRecord: (assetId: string, targetFolderId: string) => void;
  cancelMoveAssetRecord: () => void;
  confirmMoveAssetRecord: () => Promise<void>;
  createAssetCategoryAction: (name: string) => Promise<void>;
  createAssetTagAction: (name: string) => Promise<void>;
  requestDeleteAssetFolder: (folderId: string) => void;
  cancelDeleteAssetFolder: () => void;
  confirmDeleteAssetFolder: (disposition: AssetFolderDeletionDisposition) => Promise<void>;
  openAssetImageViewer: (assetId: string) => void;
  closeAssetImageViewer: () => void;
}

type AssetLibrarySet = (
  partial:
    | Partial<AssetLibrarySliceState>
    | ((state: AssetLibrarySliceState) => Partial<AssetLibrarySliceState>),
) => void;

type AssetLibraryGet = () => AssetLibrarySliceState & {
  projectsWorkspacePath: string | null;
  getCompositeGrid: () => import("@/domain/canvas/PixelGrid").PixelGrid | null;
  getActiveLayerGrid: () => import("@/domain/canvas/PixelGrid").PixelGrid | null;
  deleteAssetRecordAction: (assetId: string) => Promise<void>;
};

export function createAssetLibraryInitialState(): AssetLibrarySliceState {
  return {
    assetLibraryModalOpen: false,
    assetLibraryDrawerExpanded: false,
    assetLibraryDrawerHeight: DEFAULT_ASSET_DRAWER_HEIGHT,
    assetFolderTreeWidth: DEFAULT_ASSET_FOLDER_TREE_WIDTH,
    assetLibrary: null,
    assetLibraryLoading: false,
    selectedAssetFolderId: ROOT_FOLDER_ID,
    selectedAssetId: null,
    assetCapturePhase: "idle",
    assetCaptureFolderId: ROOT_FOLDER_ID,
    assetCaptureStart: null,
    assetCaptureRect: null,
    assetCaptureSource: "activeLayer",
    deleteAssetFolderTarget: null,
    deleteAssetTarget: null,
    moveAssetTarget: null,
    assetImageViewerAssetId: null,
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

    setAssetFolderTreeWidth: (width) => set({ assetFolderTreeWidth: width }),

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

    createMarkdownAssetAction: async () => {
      const workspacePath = await resolveWorkspace();
      let library = get().assetLibrary;
      if (!workspacePath) return;
      if (!library) {
        library = await loadAssetLibrary(deps.assetRepository, workspacePath);
        set({ assetLibrary: library });
      }
      try {
        const result = await createMarkdownAsset(
          deps.assetRepository,
          workspacePath,
          library,
          get().selectedAssetFolderId,
        );
        set({
          assetLibrary: result.library,
          selectedAssetId: result.asset.id,
        });
        toast.info("已创建笔记");
      } catch {
        toast.error("创建笔记失败");
      }
    },

    startAssetCanvasCapture: () => {
      const folderId = get().selectedAssetFolderId;
      set({
        assetLibraryModalOpen: false,
        assetCapturePhase: "dragging",
        assetCaptureFolderId: folderId,
        assetCaptureStart: null,
        assetCaptureRect: null,
        assetCaptureSource: "activeLayer",
      });
      toast.info("在画布上拖拽框选区域，Esc 取消");
    },

    cancelAssetCanvasCapture: () =>
      set({
        assetCapturePhase: "idle",
        assetCaptureStart: null,
        assetCaptureRect: null,
      }),

    assetCapturePointerDown: (point) => {
      if (get().assetCapturePhase !== "dragging") return;
      set({
        assetCaptureStart: point,
        assetCaptureRect: {
          x: point.x,
          y: point.y,
          width: 1,
          height: 1,
        },
      });
    },

    assetCapturePointerMove: (point) => {
      const start = get().assetCaptureStart;
      if (!start || get().assetCapturePhase !== "dragging") return;
      set({
        assetCaptureRect: normalizeCaptureRect(
          start.x,
          start.y,
          point.x,
          point.y,
        ),
      });
    },

    assetCapturePointerUp: (point) => {
      const start = get().assetCaptureStart;
      if (!start || get().assetCapturePhase !== "dragging") return;
      const rect = normalizeCaptureRect(start.x, start.y, point.x, point.y);
      if (rect.width < 1 || rect.height < 1) {
        set({
          assetCapturePhase: "idle",
          assetCaptureStart: null,
          assetCaptureRect: null,
        });
        return;
      }
      set({
        assetCapturePhase: "adjusting",
        assetCaptureStart: null,
        assetCaptureRect: rect,
      });
    },

    adjustAssetCaptureRect: (dx, dy, corner) => {
      const { assetCapturePhase, assetCaptureRect } = get();
      if (assetCapturePhase !== "adjusting" || !assetCaptureRect) return;

      const composite = get().getCompositeGrid();
      if (!composite) return;

      const next =
        corner === "topLeft"
          ? adjustCaptureRectTopLeft(
              assetCaptureRect,
              dx,
              dy,
              composite.width,
              composite.height,
            )
          : adjustCaptureRectBottomRight(
              assetCaptureRect,
              dx,
              dy,
              composite.width,
              composite.height,
            );
      set({ assetCaptureRect: next });
    },

    setAssetCaptureSource: (source) => set({ assetCaptureSource: source }),

    confirmAssetCanvasCapture: async () => {
      const { assetCapturePhase, assetCaptureRect, assetCaptureSource } = get();
      if (assetCapturePhase !== "adjusting" || !assetCaptureRect) return;

      const grid =
        assetCaptureSource === "composite"
          ? get().getCompositeGrid()
          : get().getActiveLayerGrid();
      if (!grid) {
        toast.error("无法读取画布图层");
        return;
      }

      const workspacePath = await resolveWorkspace();
      let library = get().assetLibrary;
      if (!workspacePath) return;
      if (!library) {
        library = await loadAssetLibrary(deps.assetRepository, workspacePath);
      }

      try {
        const result = await importAssetFromCanvasRegion(
          deps.assetRepository,
          workspacePath,
          library,
          get().assetCaptureFolderId,
          grid,
          assetCaptureRect,
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
          assetCapturePhase: "idle",
          assetCaptureStart: null,
          assetCaptureRect: null,
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
          deleteAssetTarget: null,
        });
        toast.info("已删除资产");
      } catch {
        toast.error("删除资产失败");
      }
    },

    requestDeleteAssetRecord: (assetId) => {
      const library = get().assetLibrary;
      if (!library) return;
      const asset = findAssetById(library, assetId);
      if (!asset) return;
      set({
        deleteAssetTarget: { assetId, title: asset.title },
      });
    },

    cancelDeleteAssetRecord: () => set({ deleteAssetTarget: null }),

    confirmDeleteAssetRecord: async () => {
      const target = get().deleteAssetTarget;
      if (!target) return;
      await get().deleteAssetRecordAction(target.assetId);
    },

    requestMoveAssetRecord: (assetId, targetFolderId) => {
      const library = get().assetLibrary;
      if (!library) return;
      const asset = findAssetById(library, assetId);
      if (!asset) return;
      if (asset.folderId === targetFolderId) return;

      const formatFolderLabel = (folderId: string) =>
        folderId === ROOT_FOLDER_ID
          ? "根目录"
          : getFolderPathLabel(library, folderId);

      set({
        moveAssetTarget: {
          assetId,
          title: asset.title,
          fromFolderId: asset.folderId,
          toFolderId: targetFolderId,
          fromFolderLabel: formatFolderLabel(asset.folderId),
          toFolderLabel: formatFolderLabel(targetFolderId),
        },
      });
    },

    cancelMoveAssetRecord: () => set({ moveAssetTarget: null }),

    confirmMoveAssetRecord: async () => {
      const target = get().moveAssetTarget;
      if (!target) return;

      const workspacePath = await resolveWorkspace();
      const library = get().assetLibrary;
      if (!workspacePath || !library) return;

      try {
        const updated = await updateAssetRecord(
          deps.assetRepository,
          workspacePath,
          library,
          target.assetId,
          { folderId: target.toFolderId },
        );
        set({
          assetLibrary: updated,
          moveAssetTarget: null,
          selectedAssetFolderId: target.toFolderId,
        });
        toast.info("资产已移动");
      } catch {
        toast.error("移动资产失败");
        set({ moveAssetTarget: null });
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

    requestDeleteAssetFolder: (folderId) => {
      const library = get().assetLibrary;
      if (!library) return;
      const folder = findFolderById(library, folderId);
      if (!folder) return;
      const folderIds = listDescendantFolderIds(library, folderId);
      set({
        deleteAssetFolderTarget: {
          folderId,
          folderName: folder.name,
          assetCount: countAssetsInFolders(library, folderIds),
          childFolderCount: folderIds.length - 1,
        },
      });
    },

    cancelDeleteAssetFolder: () => set({ deleteAssetFolderTarget: null }),

    confirmDeleteAssetFolder: async (disposition) => {
      const target = get().deleteAssetFolderTarget;
      const library = get().assetLibrary;
      if (!target || !library) return;

      const workspacePath = await resolveWorkspace();
      if (!workspacePath) return;

      try {
        const updated = await deleteAssetFolderTree(
          deps.assetRepository,
          workspacePath,
          library,
          target.folderId,
          disposition,
        );
        const selectedFolderId = get().selectedAssetFolderId;
        const folderIds = listDescendantFolderIds(library, target.folderId);
        const nextFolderId = folderIds.includes(selectedFolderId)
          ? ROOT_FOLDER_ID
          : selectedFolderId;
        const selectedAssetId =
          disposition === "deleteAssets" &&
          get().selectedAssetId &&
          library.assets.some(
            (a) =>
              a.id === get().selectedAssetId &&
              folderIds.includes(a.folderId),
          )
            ? null
            : get().selectedAssetId;

        set({
          assetLibrary: updated,
          deleteAssetFolderTarget: null,
          selectedAssetFolderId: nextFolderId,
          selectedAssetId,
        });
        toast.info("文件夹已删除");
      } catch {
        toast.error("删除文件夹失败");
      }
    },

    openAssetImageViewer: (assetId) => set({ assetImageViewerAssetId: assetId }),

    closeAssetImageViewer: () => set({ assetImageViewerAssetId: null }),
  };
}
