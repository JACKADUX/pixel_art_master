import { useEffect, useState } from "react";
import {
  MAX_CANVAS_DIMENSION,
  MIN_CANVAS_DIMENSION,
  parseCanvasDimension,
} from "@/domain/canvas/CanvasSize";
import { useAppStore } from "../stores/appStore";

export function CanvasSizeModal() {
  const open = useAppStore((s) => s.canvasSizeModalOpen);
  const project = useAppStore((s) => s.project);
  const closeCanvasSizeModal = useAppStore((s) => s.closeCanvasSizeModal);
  const applyCanvasSize = useAppStore((s) => s.applyCanvasSize);

  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !project) return;
    setWidthInput(String(project.canvas.width));
    setHeightInput(String(project.canvas.height));
    setError(null);
  }, [open, project]);

  if (!open || !project) return null;

  const handleSubmit = () => {
    const width = parseCanvasDimension(widthInput);
    const height = parseCanvasDimension(heightInput);
    if (width === null || height === null) {
      setError(
        `请输入 ${MIN_CANVAS_DIMENSION}–${MAX_CANVAS_DIMENSION} 之间的整数尺寸`,
      );
      return;
    }
    applyCanvasSize(width, height);
    closeCanvasSizeModal();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
      <div className="w-96 rounded-lg border border-zinc-600 bg-zinc-900 p-5 shadow-xl">
        <h3 className="mb-1 text-sm font-semibold text-zinc-100">画布尺寸</h3>
        <p className="mb-4 text-xs text-zinc-500">
          当前: {project.canvas.width}×{project.canvas.height} 像素
        </p>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">宽度</span>
            <input
              type="number"
              min={MIN_CANVAS_DIMENSION}
              max={MAX_CANVAS_DIMENSION}
              value={widthInput}
              onChange={(e) => {
                setWidthInput(e.target.value);
                setError(null);
              }}
              className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">高度</span>
            <input
              type="number"
              min={MIN_CANVAS_DIMENSION}
              max={MAX_CANVAS_DIMENSION}
              value={heightInput}
              onChange={(e) => {
                setHeightInput(e.target.value);
                setError(null);
              }}
              className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <p className="mb-4 text-[11px] text-zinc-500">
          缩小画布时，超出范围的像素将被裁剪；放大画布会在右下角扩展透明区域。
        </p>

        {error && (
          <p className="mb-3 text-xs text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={closeCanvasSizeModal}
            className="rounded px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            应用
          </button>
        </div>
      </div>
    </div>
  );
}
