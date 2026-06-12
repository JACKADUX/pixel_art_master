import type { CapturableWindow } from "@/application/ports/ICaptureService";
import { useEffect, useState } from "react";
import { captureService } from "@/infrastructure/tauri/TauriCaptureService";

interface WindowPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (windowId: number) => void;
}

export function WindowPicker({ open, onClose, onSelect }: WindowPickerProps) {
  const [windows, setWindows] = useState<CapturableWindow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    captureService
      .listWindows()
      .then(setWindows)
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="max-h-[70vh] w-96 overflow-hidden rounded-lg border border-zinc-600 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
          <h2 className="text-sm font-medium text-zinc-200">选择窗口</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {loading ? (
            <p className="p-4 text-center text-sm text-zinc-500">加载窗口列表...</p>
          ) : windows.length === 0 ? (
            <p className="p-4 text-center text-sm text-zinc-500">未找到可截图的窗口</p>
          ) : (
            windows.map((win) => (
              <button
                key={win.id}
                type="button"
                onClick={() => {
                  onSelect(win.id);
                  onClose();
                }}
                className="mb-1 w-full rounded px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
              >
                <div className="font-medium">{win.title}</div>
                {win.appName && (
                  <div className="text-xs text-zinc-500">{win.appName}</div>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
