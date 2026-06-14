import { useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { MonitorPicker } from "../MonitorPicker";
import { usePixelRestoreStore } from "../../stores/pixelRestoreStore";
import { useAppStore } from "../../stores/appStore";
import { FixedScaleControls } from "./FixedScaleControls";
import { PixelRestorePreview } from "./PixelRestorePreview";

export function PixelRestorePage() {
  const openPage = usePixelRestoreStore((s) => s.open);
  const sourceImageData = usePixelRestoreStore((s) => s.sourceImageData);
  const detectedScale = usePixelRestoreStore((s) => s.detectedScale);
  const selectedScale = usePixelRestoreStore((s) => s.selectedScale);
  const resultImageData = usePixelRestoreStore((s) => s.resultImageData);
  const loading = usePixelRestoreStore((s) => s.loading);
  const error = usePixelRestoreStore((s) => s.error);
  const monitorPickerOpen = usePixelRestoreStore((s) => s.monitorPickerOpen);
  const availableMonitors = usePixelRestoreStore((s) => s.availableMonitors);
  const closePage = usePixelRestoreStore((s) => s.closePage);
  const importFromPath = usePixelRestoreStore((s) => s.importFromPath);
  const importFromClipboard = usePixelRestoreStore((s) => s.importFromClipboard);
  const screenCapture = usePixelRestoreStore((s) => s.screenCapture);
  const captureFromMonitor = usePixelRestoreStore((s) => s.captureFromMonitor);
  const closeMonitorPicker = usePixelRestoreStore((s) => s.closeMonitorPicker);
  const setScale = usePixelRestoreStore((s) => s.setScale);

  const project = useAppStore((s) => s.project);
  const exportRestoredImageToReference = useAppStore(
    (s) => s.exportRestoredImageToReference,
  );

  useEffect(() => {
    if (!openPage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const ctrl = event.ctrlKey || event.metaKey;
      if (!ctrl || (event.key !== "v" && event.key !== "V")) return;
      if (event.target instanceof HTMLInputElement) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      void importFromClipboard();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [openPage, importFromClipboard]);

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
    void exportRestoredImageToReference(resultImageData);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100">
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
            <span className="text-[10px] text-zinc-600">Ctrl+V 粘贴图像</span>
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
          <div className="grid min-h-0 grid-rows-2 divide-y divide-zinc-800 border-r border-zinc-800">
            <PixelRestorePreview
              imageData={sourceImageData}
              label="原图"
            />
            <PixelRestorePreview
              imageData={resultImageData}
              label="结果"
              pixelated
            />
          </div>

          <FixedScaleControls
            detectedScale={detectedScale}
            selectedScale={selectedScale}
            sourceWidth={sourceImageData?.width ?? 0}
            sourceHeight={sourceImageData?.height ?? 0}
            error={error}
            canExport={project !== null && resultImageData !== null}
            onScaleChange={setScale}
            onExport={handleExport}
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
