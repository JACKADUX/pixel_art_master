import { useEffect, useMemo, useState } from "react";
import {
  MAX_CANVAS_DIMENSION,
  MIN_CANVAS_DIMENSION,
  parseCanvasDimension,
} from "@/domain/canvas/CanvasSize";
import {
  computeAspectLockedSize,
  computeAspectRatio,
} from "@/domain/canvas/CanvasSizeAspectLock";
import { allCanvasSizePresets } from "@/domain/canvas/CanvasSizePresetOperations";
import { formatCanvasSizeLabel } from "@/domain/canvas/CanvasSizePreset";
import { getActiveCanvas } from "@/domain/project/Project";
import { toast } from "@/presentation/stores/toastStore";
import { useAppStore } from "../stores/appStore";

export function CanvasSizeModal() {
  const open = useAppStore((s) => s.canvasSizeModalOpen);
  const project = useAppStore((s) => s.project);
  const appSettings = useAppStore((s) => s.appSettings);
  const closeCanvasSizeModal = useAppStore((s) => s.closeCanvasSizeModal);
  const applyCanvasSize = useAppStore((s) => s.applyCanvasSize);
  const setDefaultCanvasSize = useAppStore((s) => s.setDefaultCanvasSize);
  const addCustomCanvasSizePreset = useAppStore((s) => s.addCustomCanvasSizePreset);
  const removeCustomCanvasSizePreset = useAppStore((s) => s.removeCustomCanvasSizePreset);

  const [widthInput, setWidthInput] = useState("");
  const [heightInput, setHeightInput] = useState("");
  const [aspectLocked, setAspectLocked] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const presets = useMemo(
    () => allCanvasSizePresets(appSettings.customCanvasSizePresets),
    [appSettings.customCanvasSizePresets],
  );

  useEffect(() => {
    if (!open || !project) return;
    const canvas = getActiveCanvas(project);
    setWidthInput(String(canvas.width));
    setHeightInput(String(canvas.height));
    setAspectRatio(computeAspectRatio(canvas.width, canvas.height));
    setAspectLocked(false);
    setError(null);
  }, [open, project]);

  if (!open || !project) return null;

  const activeCanvas = getActiveCanvas(project);

  const parseInputs = (): { width: number; height: number } | null => {
    const width = parseCanvasDimension(widthInput);
    const height = parseCanvasDimension(heightInput);
    if (width === null || height === null) return null;
    return { width, height };
  };

  const applyPreset = (width: number, height: number) => {
    setWidthInput(String(width));
    setHeightInput(String(height));
    setAspectRatio(computeAspectRatio(width, height));
    setError(null);
  };

  const handleWidthChange = (value: string) => {
    setWidthInput(value);
    setError(null);
    const parsed = parseCanvasDimension(value);
    if (!aspectLocked || parsed === null) return;
    const next = computeAspectLockedSize("width", parsed, aspectRatio);
    setHeightInput(String(next.height));
  };

  const handleHeightChange = (value: string) => {
    setHeightInput(value);
    setError(null);
    const parsed = parseCanvasDimension(value);
    if (!aspectLocked || parsed === null) return;
    const next = computeAspectLockedSize("height", parsed, aspectRatio);
    setWidthInput(String(next.width));
  };

  const toggleAspectLocked = () => {
    const parsed = parseInputs();
    if (!aspectLocked && parsed) {
      setAspectRatio(computeAspectRatio(parsed.width, parsed.height));
    }
    setAspectLocked((locked) => !locked);
  };

  const handleSubmit = () => {
    const parsed = parseInputs();
    if (!parsed) {
      setError(
        `请输入 ${MIN_CANVAS_DIMENSION}–${MAX_CANVAS_DIMENSION} 之间的整数尺寸`,
      );
      return;
    }
    applyCanvasSize(parsed.width, parsed.height);
    closeCanvasSizeModal();
  };

  const handleSaveDefault = () => {
    const parsed = parseInputs();
    if (!parsed) {
      setError(
        `请输入 ${MIN_CANVAS_DIMENSION}–${MAX_CANVAS_DIMENSION} 之间的整数尺寸`,
      );
      return;
    }
    setDefaultCanvasSize(parsed.width, parsed.height);
    toast.info(`已将 ${formatCanvasSizeLabel(parsed.width, parsed.height)} 设为新建项目默认尺寸`);
  };

  const handleAddPreset = () => {
    const parsed = parseInputs();
    if (!parsed) {
      setError(
        `请输入 ${MIN_CANVAS_DIMENSION}–${MAX_CANVAS_DIMENSION} 之间的整数尺寸`,
      );
      return;
    }

    const defaultLabel = formatCanvasSizeLabel(parsed.width, parsed.height);
    const label = window.prompt("预设名称", defaultLabel)?.trim() || defaultLabel;

    try {
      addCustomCanvasSizePreset(parsed.width, parsed.height, label);
      toast.info(`已添加预设「${label}」`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "无法添加预设";
      setError(message);
    }
  };

  const handleRemovePreset = (id: string, label: string) => {
    removeCustomCanvasSizePreset(id);
    toast.info(`已删除预设「${label}」`);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70">
      <div className="w-[28rem] rounded-lg border border-zinc-600 bg-zinc-900 p-5 shadow-xl">
        <h3 className="mb-1 text-sm font-semibold text-zinc-100">画布尺寸</h3>
        <p className="mb-3 text-xs text-zinc-500">
          当前: {activeCanvas.width}×{activeCanvas.height} 像素
        </p>

        <div className="mb-3">
          <p className="mb-2 text-xs text-zinc-400">预设尺寸</p>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <div key={preset.id} className="relative">
                <button
                  type="button"
                  onClick={() => applyPreset(preset.width, preset.height)}
                  className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-200 hover:border-zinc-400 hover:text-white"
                >
                  {preset.label}
                </button>
                {!preset.builtin && (
                  <button
                    type="button"
                    aria-label={`删除预设 ${preset.label}`}
                    onClick={() => handleRemovePreset(preset.id, preset.label)}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-[10px] text-zinc-300 hover:bg-red-600 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddPreset}
            className="mt-2 text-[11px] text-blue-400 hover:text-blue-300"
          >
            + 添加当前尺寸为预设
          </button>
        </div>

        <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">宽度</span>
            <input
              type="number"
              min={MIN_CANVAS_DIMENSION}
              max={MAX_CANVAS_DIMENSION}
              value={widthInput}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </label>
          <button
            type="button"
            title={aspectLocked ? "解除比例锁定" : "锁定比例"}
            onClick={toggleAspectLocked}
            className={`mb-1 rounded border px-2 py-1.5 text-xs ${
              aspectLocked
                ? "border-blue-500 bg-blue-600/20 text-blue-300"
                : "border-zinc-600 bg-zinc-800 text-zinc-400 hover:border-zinc-400"
            }`}
          >
            🔗
          </button>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-400">高度</span>
            <input
              type="number"
              min={MIN_CANVAS_DIMENSION}
              max={MAX_CANVAS_DIMENSION}
              value={heightInput}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-blue-500"
            />
          </label>
        </div>

        <p className="mb-3 text-[11px] text-zinc-500">
          新建项目默认: {appSettings.defaultCanvasWidth}×{appSettings.defaultCanvasHeight}
        </p>

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
            onClick={handleSaveDefault}
            className="rounded border border-zinc-600 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
          >
            保存为默认
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
