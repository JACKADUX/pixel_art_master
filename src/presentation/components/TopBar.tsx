import { useMemo } from "react";
import { isRecoveryPath } from "@/infrastructure/storage/RecoveryPath";
import { buildMenuGroups } from "../config/menuConfig";
import { useAppStore } from "../stores/appStore";
import { MenuBar } from "./MenuBar";

export function TopBar() {
  const newProject = useAppStore((s) => s.newProject);
  const openProject = useAppStore((s) => s.openProject);
  const saveCurrentProject = useAppStore((s) => s.saveCurrentProject);
  const saveProjectAs = useAppStore((s) => s.saveProjectAs);
  const importImage = useAppStore((s) => s.importImage);
  const openCanvasSizeModal = useAppStore((s) => s.openCanvasSizeModal);
  const openProjectManager = useAppStore((s) => s.openProjectManager);
  const toggleAlwaysOnTop = useAppStore((s) => s.toggleAlwaysOnTop);
  const alwaysOnTop = useAppStore((s) => s.alwaysOnTop);
  const toggleCanvasDisplayMode = useAppStore((s) => s.toggleCanvasDisplayMode);
  const canvasDisplayMode = useAppStore((s) => s.canvasDisplayMode);
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
  const openAiChatTestPage = useAppStore((s) => s.openAiChatTestPage);
  const openAiVisionTestPage = useAppStore((s) => s.openAiVisionTestPage);
  const openAssetLibraryModal = useAppStore((s) => s.openAssetLibraryModal);
  const openSettingsModal = useAppStore((s) => s.openSettingsModal);
  const project = useAppStore((s) => s.project);

  const menus = useMemo(
    () =>
      buildMenuGroups({
        newProject,
        openProject: () => void openProject(),
        saveCurrentProject: () => void saveCurrentProject(),
        saveProjectAs: () => void saveProjectAs(),
        importImage: () => void importImage(),
        openCanvasSizeModal,
        openProjectManager,
        toggleAlwaysOnTop: () => void toggleAlwaysOnTop(),
        alwaysOnTop,
        toggleCanvasDisplayMode,
        canvasDisplayMode,
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
        openAiChatTestPage,
        openAiVisionTestPage,
        openAssetLibrary: openAssetLibraryModal,
        openSettingsModal,
      }),
    [
      newProject,
      openProject,
      saveCurrentProject,
      saveProjectAs,
      importImage,
      openCanvasSizeModal,
      openProjectManager,
      toggleAlwaysOnTop,
      alwaysOnTop,
      toggleCanvasDisplayMode,
      canvasDisplayMode,
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
      openAiChatTestPage,
      openAiVisionTestPage,
      openAssetLibraryModal,
      openSettingsModal,
    ],
  );

  const saveLabel = (() => {
    if (!project) return "";
    if (!project.filePath) return " (未保存)";
    if (isRecoveryPath(project.filePath)) return " (自动保存)";
    return "";
  })();

  return (
    <header className="flex items-center gap-1 border-b border-zinc-700 bg-zinc-900 px-3 py-2">
      <span className="mr-3 text-sm font-semibold text-zinc-100">PixelArt Master</span>
      <MenuBar menus={menus} />

      {project && (
        <span className="ml-auto truncate text-xs text-zinc-500">
          {project.name}
          {saveLabel}
        </span>
      )}
    </header>
  );
}
