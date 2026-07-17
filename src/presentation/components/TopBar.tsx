import { useEffect, useMemo } from "react";
import { isRecoveryPath } from "@/infrastructure/storage/RecoveryPath";
import { Cog6ToothIcon, SquareArrowRightExit } from "../icons/ActionIcons";
import { buildMenuGroups } from "../config/menuConfig";
import { useAppStore } from "../stores/appStore";
import { useComfyAppStore } from "../stores/comfyAppStore";
import { MenuBar } from "./MenuBar";

export function TopBar() {
  const newProject = useAppStore((s) => s.newProject);
  const openProject = useAppStore((s) => s.openProject);
  const saveCurrentProject = useAppStore((s) => s.saveCurrentProject);
  const saveProjectAs = useAppStore((s) => s.saveProjectAs);
  const importImage = useAppStore((s) => s.importImage);
  const openExportImageModal = useAppStore((s) => s.openExportImageModal);
  const openCanvasSizeModal = useAppStore((s) => s.openCanvasSizeModal);
  const openProjectManager = useAppStore((s) => s.openProjectManager);
  const toggleAlwaysOnTop = useAppStore((s) => s.toggleAlwaysOnTop);
  const alwaysOnTop = useAppStore((s) => s.alwaysOnTop);
  const toggleCanvasDisplayMode = useAppStore((s) => s.toggleCanvasDisplayMode);
  const canvasDisplayMode = useAppStore((s) => s.canvasDisplayMode);
  const requestFitActiveCanvasInViewport = useAppStore((s) => s.requestFitActiveCanvasInViewport);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const canUndo = useAppStore((s) => s.canUndo);
  const canRedo = useAppStore((s) => s.canRedo);
  const selectAllCanvas = useAppStore((s) => s.selectAllCanvas);
  const deselectCanvas = useAppStore((s) => s.deselectCanvas);
  const invertCanvasSelection = useAppStore((s) => s.invertCanvasSelection);
  const copySelection = useAppStore((s) => s.copySelection);
  const cutSelection = useAppStore((s) => s.cutSelection);
  const pasteSelection = useAppStore((s) => s.pasteSelection);
  const openPixelRestorePage = useAppStore((s) => s.openPixelRestorePage);
  const openColorEditPage = useAppStore((s) => s.openColorEditPage);
  const openColorVariationPage = useAppStore((s) => s.openColorVariationPage);
  const openWorldPage = useAppStore((s) => s.openWorldPage);
  const openComfyUiPage = useAppStore((s) => s.openComfyUiPage);
  const openAssetLibraryModal = useAppStore((s) => s.openAssetLibraryModal);
  const openSettingsModal = useAppStore((s) => s.openSettingsModal);
  const openAboutModal = useAppStore((s) => s.openAboutModal);
  const openShortcutReferenceModal = useAppStore((s) => s.openShortcutReferenceModal);
  const project = useAppStore((s) => s.project);
  const quickExportActiveCanvas = useAppStore((s) => s.quickExportActiveCanvas);
  const pickQuickExportPath = useAppStore((s) => s.pickQuickExportPath);

  const comfyApps = useComfyAppStore((s) => s.apps);
  const refreshComfyApps = useComfyAppStore((s) => s.refreshApps);
  const openComfyAppWindow = useComfyAppStore((s) => s.openRunner);

  useEffect(() => {
    void refreshComfyApps();
  }, [refreshComfyApps]);

  const menus = useMemo(
    () =>
      buildMenuGroups({
        newProject: () => void newProject(),
        openProject: () => void openProject(),
        saveCurrentProject: () => void saveCurrentProject(),
        saveProjectAs: () => void saveProjectAs(),
        exportImage: openExportImageModal,
        hasOpenProject: () => project !== null,
        importImage: () => void importImage(),
        openCanvasSizeModal,
        openProjectManager,
        toggleAlwaysOnTop: () => void toggleAlwaysOnTop(),
        alwaysOnTop,
        toggleCanvasDisplayMode,
        canvasDisplayMode,
        fitActiveCanvasInViewport: requestFitActiveCanvasInViewport,
        undo,
        redo,
        canUndo,
        canRedo,
        selectAll: selectAllCanvas,
        deselect: deselectCanvas,
        invertSelection: invertCanvasSelection,
        copySelection: () => void copySelection(),
        cutSelection: () => void cutSelection(),
        pasteSelection: () => void pasteSelection(),
        openPixelRestorePage,
        openColorEditPage,
        openColorVariationPage,
        openWorldPage,
        openComfyUiPage,
        comfyApps: comfyApps.map((app) => ({ id: app.id, name: app.name })),
        openComfyAppWindow: (appId: string) => void openComfyAppWindow(appId, "canvas"),
        openAssetLibrary: openAssetLibraryModal,
        openSettingsModal,
        openAboutModal,
        openShortcutReferenceModal,
      }),
    [
      newProject,
      openProject,
      saveCurrentProject,
      saveProjectAs,
      openExportImageModal,
      project,
      importImage,
      openCanvasSizeModal,
      openProjectManager,
      toggleAlwaysOnTop,
      alwaysOnTop,
      toggleCanvasDisplayMode,
      canvasDisplayMode,
      requestFitActiveCanvasInViewport,
      undo,
      redo,
      canUndo,
      canRedo,
      selectAllCanvas,
      deselectCanvas,
      invertCanvasSelection,
      copySelection,
      cutSelection,
      pasteSelection,
      openPixelRestorePage,
      openColorEditPage,
      openColorVariationPage,
      openWorldPage,
      openComfyUiPage,
      comfyApps,
      openComfyAppWindow,
      openAssetLibraryModal,
      openSettingsModal,
      openAboutModal,
      openShortcutReferenceModal,
    ],
  );

  const saveLabel = (() => {
    if (!project) return "";
    if (!project.filePath) return " (未保存)";
    if (isRecoveryPath(project.filePath)) return " (自动保存)";
    return "";
  })();

  const quickExportTitle = project?.quickExportPath
    ? `快速导出到 ${project.quickExportPath}`
    : "快速导出（未绑定路径，将先选择文件夹）";

  return (
    <header className="flex items-center gap-1 border-b border-zinc-700 bg-zinc-900 px-3 py-2">
      <MenuBar menus={menus} />

      {project && (
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <span className="truncate text-xs text-zinc-500">
            {project.name}
            {saveLabel}
          </span>
          <div className="flex shrink-0 overflow-hidden rounded border border-zinc-700">
            <button
              type="button"
              title={quickExportTitle}
              className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => void quickExportActiveCanvas()}
            >
              <SquareArrowRightExit className="h-3.5 w-3.5" aria-hidden />
              <span>快速导出</span>
            </button>
            <button
              type="button"
              title={
                project.quickExportPath
                  ? `设置快速导出路径（当前：${project.quickExportPath}）`
                  : "设置快速导出路径"
              }
              className="flex items-center justify-center border-l border-zinc-700 px-1.5 py-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => void pickQuickExportPath()}
            >
              <Cog6ToothIcon className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">设置快速导出路径</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
