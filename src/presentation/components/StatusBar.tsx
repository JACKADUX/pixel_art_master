import { useAppStore } from "../stores/appStore";

export function StatusBar() {
  const project = useAppStore((s) => s.project);
  const zoom = useAppStore((s) => s.zoom);
  const setZoom = useAppStore((s) => s.setZoom);
  const toggleGrid = useAppStore((s) => s.toggleGrid);
  const navigator = useAppStore((s) => s.navigator);
  const toggleNavigator = useAppStore((s) => s.toggleNavigator);

  if (!project) return null;

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

      <span className="ml-auto text-zinc-600">
        Ctrl+Z 撤销 / Ctrl+Y 重做
      </span>
    </footer>
  );
}
