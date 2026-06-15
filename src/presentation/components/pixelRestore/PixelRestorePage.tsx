import { useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { MonitorPicker } from "../MonitorPicker";
import { usePixelRestoreStore } from "../../stores/pixelRestoreStore";
import { useAppStore } from "../../stores/appStore";
import { useImageFileDrop } from "../../hooks/useImageFileDrop";
import { ImageDropOverlay } from "../toolPage/ImageDropOverlay";
import { ToolPagePreviewSplit } from "../toolPage/ToolPagePreviewSplit";
import { GridRestoreSourcePreview } from "./GridRestoreSourcePreview";
import { PixelRestorePreview } from "./PixelRestorePreview";
import { RestoreToolPanel } from "./RestoreToolPanel";

export function PixelRestorePage() {
  const openPage = usePixelRestoreStore((s) => s.open);
  const resultImageData = usePixelRestoreStore((s) => s.resultImageData);
  const loading = usePixelRestoreStore((s) => s.loading);
  const monitorPickerOpen = usePixelRestoreStore((s) => s.monitorPickerOpen);
  const availableMonitors = usePixelRestoreStore((s) => s.availableMonitors);
  const restoreMode = usePixelRestoreStore((s) => s.restoreMode);
  const gridScaleType = usePixelRestoreStore((s) => s.gridScaleType);
  const gridSeedCell = usePixelRestoreStore((s) => s.gridSeedCell);
  const gridRegion = usePixelRestoreStore((s) => s.gridRegion);
  const closePage = usePixelRestoreStore((s) => s.closePage);
  const importFromPath = usePixelRestoreStore((s) => s.importFromPath);
  const importFromFile = usePixelRestoreStore((s) => s.importFromFile);
  const importFromClipboard = usePixelRestoreStore((s) => s.importFromClipboard);
  const screenCapture = usePixelRestoreStore((s) => s.screenCapture);
  const captureFromMonitor = usePixelRestoreStore((s) => s.captureFromMonitor);
  const closeMonitorPicker = usePixelRestoreStore((s) => s.closeMonitorPicker);
  const adjustGridSeed = usePixelRestoreStore((s) => s.adjustGridSeed);
  const adjustGridRegion = usePixelRestoreStore((s) => s.adjustGridRegion);
  const applyGridRestoreResult = usePixelRestoreStore((s) => s.applyGridRestoreResult);

  const projectsWorkspacePath = useAppStore((s) => s.projectsWorkspacePath);
  const exportRestoredImageToAssetLibrary = useAppStore(
    (s) => s.exportRestoredImageToAssetLibrary,
  );
  const sendPixelRestoreResultToColorEdit = useAppStore(
    (s) => s.sendPixelRestoreResultToColorEdit,
  );

  const hasGridSelection =
    gridScaleType === "singleCell" ? gridSeedCell !== null : gridRegion !== null;

  const { isDraggingOver, dropZoneProps } = useImageFileDrop({
    enabled: openPage,
    disabled: loading,
    onImportPath: importFromPath,
    onImportFile: importFromFile,
  });

  useEffect(() => {
    if (!openPage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
        return;
      }

      const ctrl = event.ctrlKey || event.metaKey;
      if (ctrl && (event.key === "v" || event.key === "V")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        void importFromClipboard();
        return;
      }

      if (restoreMode !== "gridScale" || !hasGridSelection) return;

      const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
      if (arrowKeys.includes(event.key)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        const dx = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
        const dy = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
        if (gridScaleType === "region") {
          adjustGridRegion(dx, dy, event.shiftKey);
        } else {
          adjustGridSeed(dx, dy, event.shiftKey);
        }
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        applyGridRestoreResult();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [
    openPage,
    importFromClipboard,
    restoreMode,
    gridScaleType,
    hasGridSelection,
    adjustGridSeed,
    adjustGridRegion,
    applyGridRestoreResult,
  ]);

  if (!openPage) return null;

  const handleImport = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        { name: "图片", extensions: ["png", "jpg", "jpeg", "bmp", "gif", "webp"] },
      ],
    });
    if (!selected || typeof selected !== "string") return;
    await importFromPath(selected);
  };

  const handleExport = () => {
    if (!resultImageData) return;
    void exportRestoredImageToAssetLibrary(resultImageData);
  };

  const handleSendToColorEdit = () => {
    if (!resultImageData) return;
    sendPixelRestoreResultToColorEdit(resultImageData);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100"
        {...dropZoneProps}
      >
        <ImageDropOverlay visible={isDraggingOver} />
        <header className="flex shrink-0 items-center gap-3 border-b border-zinc-700 bg-zinc-900 px-4 py-2.5">
          <button
            type="button"
            onClick={closePage}
            className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            ← 返回编辑器
          </button>
          <h1 className="text-sm font-medium text-zinc-200">像素还原工具</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-zinc-600">
              拖放图片 · Ctrl+V 粘贴 · 滚轮缩放 · 中键平移
            </span>
            <button
              type="button"
              onClick={() => void screenCapture()}
              disabled={loading}
              className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              屏幕截图
            </button>
            <button
              type="button"
              onClick={() => void handleImport()}
              disabled={loading}
              className="rounded bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
            >
              {loading ? "导入中…" : "导入图片"}
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[1fr_16rem] overflow-hidden">
          <ToolPagePreviewSplit
            source={<GridRestoreSourcePreview />}
            result={<PixelRestorePreview imageData={resultImageData} label="结果" />}
          />

          <RestoreToolPanel
            canExport={projectsWorkspacePath !== null && resultImageData !== null}
            canSendToColorEdit={resultImageData !== null}
            onExport={handleExport}
            onSendToColorEdit={handleSendToColorEdit}
          />
        </div>
      </div>

      <MonitorPicker
        open={monitorPickerOpen}
        monitors={availableMonitors}
        onClose={closeMonitorPicker}
        onSelect={(monitorId) => {
          void captureFromMonitor(monitorId);
        }}
      />
    </>
  );
}
