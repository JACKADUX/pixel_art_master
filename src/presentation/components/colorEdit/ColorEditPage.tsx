import { useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { MonitorPicker } from "../MonitorPicker";
import { useAppStore } from "../../stores/appStore";
import { useColorEditStore } from "../../stores/colorEditStore";
import { ColorEditResultPreview } from "./ColorEditResultPreview";
import { ColorEditSourcePreview } from "./ColorEditSourcePreview";
import { ColorEditToolPanel } from "./ColorEditToolPanel";

export function ColorEditPage() {
  const openPage = useColorEditStore((s) => s.open);
  const resultImageData = useColorEditStore((s) => s.resultImageData);
  const loading = useColorEditStore((s) => s.loading);
  const monitorPickerOpen = useColorEditStore((s) => s.monitorPickerOpen);
  const availableMonitors = useColorEditStore((s) => s.availableMonitors);
  const closePage = useColorEditStore((s) => s.closePage);
  const importFromPath = useColorEditStore((s) => s.importFromPath);
  const importFromClipboard = useColorEditStore((s) => s.importFromClipboard);
  const screenCapture = useColorEditStore((s) => s.screenCapture);
  const captureFromMonitor = useColorEditStore((s) => s.captureFromMonitor);
  const closeMonitorPicker = useColorEditStore((s) => s.closeMonitorPicker);

  const projectsWorkspacePath = useAppStore((s) => s.projectsWorkspacePath);
  const exportRestoredImageToAssetLibrary = useAppStore(
    (s) => s.exportRestoredImageToAssetLibrary,
  );

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
      }
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
    void exportRestoredImageToAssetLibrary(resultImageData);
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
          <h1 className="text-sm font-medium text-zinc-200">颜色编辑工具</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] text-zinc-600">Ctrl+V 粘贴 · 滚轮缩放 · 中键平移</span>
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
            <ColorEditSourcePreview />
            <ColorEditResultPreview imageData={resultImageData} />
          </div>

          <ColorEditToolPanel
            canExport={projectsWorkspacePath !== null && resultImageData !== null}
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
