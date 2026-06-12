import { useAppStore } from "../stores/appStore";

const SCALE_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];

export function StatusBar() {
  const project = useAppStore((s) => s.project);
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const detectedScale = useAppStore((s) => s.detectedScale);
  const manualScaleOverride = useAppStore((s) => s.manualScaleOverride);
  const setManualScale = useAppStore((s) => s.setManualScale);
  const reapplyScale = useAppStore((s) => s.reapplyScale);
  const toggleGrid = useAppStore((s) => s.toggleGrid);
  const navigator = useAppStore((s) => s.navigator);
  const toggleNavigator = useAppStore((s) => s.toggleNavigator);
  const captureError = useAppStore((s) => s.captureError);
  const clearCaptureError = useAppStore((s) => s.clearCaptureError);

  if (!project) return null;

  return (
    <footer className="flex items-center gap-4 border-t border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-400">
      {captureError && (
        <span className="flex items-center gap-2 text-red-400">
          {captureError}
          <button
            type="button"
            onClick={clearCaptureError}
            className="rounded px-1 hover:bg-zinc-800"
          >
            ✕
          </button>
        </span>
      )}
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

      <label className="flex items-center gap-1.5">
        像素倍数:
        <select
          value={manualScaleOverride ?? ""}
          onChange={(e) =>
            setManualScale(e.target.value ? Number(e.target.value) : null)
          }
          className="rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 text-zinc-300"
        >
          <option value="">自动 ({detectedScale || project.canvas.scaleFactor}×)</option>
          {SCALE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={reapplyScale}
          className="rounded bg-zinc-700 px-2 py-0.5 hover:bg-zinc-600"
        >
          应用
        </button>
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
    </footer>
  );
}
