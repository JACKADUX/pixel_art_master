import type { ReactNode } from "react";

import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Save,
} from "../icons/ActionIcons";
import { SHORTCUT_LABELS } from "../config/menuConfig";
import { PomodoroTimer } from "./PomodoroTimer";
import { useAppStore } from "../stores/appStore";

function StatusBarIconButton({
  title,
  disabled,
  onClick,
  children,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
    >
      {children}
    </button>
  );
}

export function StatusBar() {
  const project = useAppStore((s) => s.project);
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const toggleGrid = useAppStore((s) => s.toggleGrid);
  const navigator = useAppStore((s) => s.navigator);
  const toggleNavigator = useAppStore((s) => s.toggleNavigator);
  const mousePositionOverlayVisible = useAppStore((s) => s.mousePositionOverlayVisible);
  const toggleMousePositionOverlay = useAppStore((s) => s.toggleMousePositionOverlay);
  const canvasDisplayMode = useAppStore((s) => s.canvasDisplayMode);
  const toggleCanvasDisplayMode = useAppStore((s) => s.toggleCanvasDisplayMode);
  const undo = useAppStore((s) => s.undo);
  const redo = useAppStore((s) => s.redo);
  const saveCurrentProject = useAppStore((s) => s.saveCurrentProject);
  const toggleAssetLibraryDrawer = useAppStore((s) => s.toggleAssetLibraryDrawer);
  const assetLibraryDrawerExpanded = useAppStore((s) => s.assetLibraryDrawerExpanded);
  const canUndo = useAppStore((s) => s.historyStack.canUndo);
  const canRedo = useAppStore((s) => s.historyStack.canRedo);
  const pomodoroVisible = useAppStore((s) => s.appSettings.pomodoroVisible);

  if (!project) return null;

  const handleSave = () => {
    void saveCurrentProject();
  };

  return (
    <footer className="flex items-center gap-4 border-t border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-400">
      <span>
        画布: {project.canvas.width}×{project.canvas.height}
      </span>

      <label className="flex items-center gap-1.5">
        缩放:
        <input
          type="range"
          min={1}
          max={32}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-20"
        />
        <span className="w-8">{zoom}×</span>
      </label>

      <button
        type="button"
        onClick={toggleGrid}
        className={`rounded px-2 py-0.5 ${
          project.grid.visible ? "bg-zinc-700" : "bg-zinc-800 text-zinc-600"
        }`}
      >
        网格 {project.grid.primary}/{project.grid.secondary}{" "}
        {project.grid.visible ? "开" : "关"}
      </button>

      <button
        type="button"
        onClick={toggleNavigator}
        className={`rounded px-2 py-0.5 ${
          navigator.visible ? "bg-zinc-700" : "bg-zinc-800 text-zinc-600"
        }`}
      >
        导航 {navigator.visible ? "开" : "关"}
      </button>

      <button
        type="button"
        onClick={toggleMousePositionOverlay}
        className={`rounded px-2 py-0.5 ${
          mousePositionOverlayVisible ? "bg-zinc-700" : "bg-zinc-800 text-zinc-600"
        }`}
      >
        坐标 {mousePositionOverlayVisible ? "开" : "关"}
      </button>

      <button
        type="button"
        onClick={toggleCanvasDisplayMode}
        className={`rounded px-2 py-0.5 ${
          canvasDisplayMode === "oklchLightness" ? "bg-zinc-700" : "bg-zinc-800 text-zinc-600"
        }`}
      >
        OKLCH 明度 {canvasDisplayMode === "oklchLightness" ? "开" : "关"}
      </button>

      <button
        type="button"
        onClick={toggleAssetLibraryDrawer}
        className={`rounded px-2 py-0.5 ${
          assetLibraryDrawerExpanded ? "bg-zinc-700" : "bg-zinc-800 text-zinc-600"
        }`}
      >
        资产库 {assetLibraryDrawerExpanded ? "开" : "关"}
      </button>

      <div className="ml-auto flex items-center gap-3">
        {pomodoroVisible && <PomodoroTimer />}
        <div className="flex items-center gap-0.5 border-l border-zinc-700 pl-2">
          <StatusBarIconButton
            title={`撤销 (${SHORTCUT_LABELS.undo})`}
            disabled={!canUndo}
            onClick={undo}
          >
            <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
          </StatusBarIconButton>
          <StatusBarIconButton
            title={`重做 (${SHORTCUT_LABELS.redo})`}
            disabled={!canRedo}
            onClick={redo}
          >
            <ArrowUturnRightIcon className="h-3.5 w-3.5" />
          </StatusBarIconButton>
          <StatusBarIconButton
            title={`保存 (${SHORTCUT_LABELS.saveCurrentProject})`}
            onClick={handleSave}
          >
            <Save className="h-3.5 w-3.5" />
          </StatusBarIconButton>
        </div>
      </div>
    </footer>
  );
}
