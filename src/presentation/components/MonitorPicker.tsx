import type { CapturableMonitor } from "@/application/ports/ICaptureService";

interface MonitorPickerProps {
  open: boolean;
  monitors: CapturableMonitor[];
  onClose: () => void;
  onSelect: (monitorId: number) => void;
}

export function MonitorPicker({ open, monitors, onClose, onSelect }: MonitorPickerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="max-h-[70vh] w-96 overflow-hidden rounded-lg border border-zinc-600 bg-zinc-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
          <h2 className="text-sm font-medium text-zinc-200">选择显示器</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200"
          >
            ✕
          </button>
        </div>
        <div className="max-h-80 overflow-auto p-2">
          {monitors.length === 0 ? (
            <p className="p-4 text-center text-sm text-zinc-500">未找到可用显示器</p>
          ) : (
            monitors.map((monitor) => (
              <button
                key={monitor.id}
                type="button"
                onClick={() => {
                  onSelect(monitor.id);
                  onClose();
                }}
                className="mb-1 w-full rounded px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800"
              >
                {monitor.name}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
