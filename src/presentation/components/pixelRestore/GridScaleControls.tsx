import {
  GRID_MERGE_ALGORITHM_LABELS,
  GRID_MERGE_ALGORITHMS,
  type GridMergeAlgorithm,
} from "@/domain/pixelRestore/GridMergeAlgorithm";
import {
  GRID_SCALE_TYPE_LABELS,
  GRID_SCALE_TYPES,
} from "@/domain/pixelRestore/GridScaleType";
import { usePixelRestoreStore } from "../../stores/pixelRestoreStore";
import { useGridLayout, useRegionGridLayout } from "./useGridLayout";

interface GridScaleControlsProps {
  canExport: boolean;
  canSendToColorEdit: boolean;
  onExport: () => void;
  onSendToColorEdit: () => void;
}

export function GridScaleControls({
  canExport,
  canSendToColorEdit,
  onExport,
  onSendToColorEdit,
}: GridScaleControlsProps) {
  const sourceImageData = usePixelRestoreStore((s) => s.sourceImageData);
  const gridScaleType = usePixelRestoreStore((s) => s.gridScaleType);
  const gridSeedCell = usePixelRestoreStore((s) => s.gridSeedCell);
  const gridRegion = usePixelRestoreStore((s) => s.gridRegion);
  const gridColumnCount = usePixelRestoreStore((s) => s.gridColumnCount);
  const gridRowCount = usePixelRestoreStore((s) => s.gridRowCount);
  const mergeAlgorithm = usePixelRestoreStore((s) => s.mergeAlgorithm);
  const error = usePixelRestoreStore((s) => s.error);
  const setGridScaleType = usePixelRestoreStore((s) => s.setGridScaleType);
  const setMergeAlgorithm = usePixelRestoreStore((s) => s.setMergeAlgorithm);
  const setGridColumnCount = usePixelRestoreStore((s) => s.setGridColumnCount);
  const setGridRowCount = usePixelRestoreStore((s) => s.setGridRowCount);
  const applyGridRestoreResult = usePixelRestoreStore((s) => s.applyGridRestoreResult);
  const cancelGrid = usePixelRestoreStore((s) => s.cancelGrid);

  const singleLayout = useGridLayout();
  const regionLayout = useRegionGridLayout();
  const hasSource = sourceImageData !== null;
  const hasSelection = gridScaleType === "singleCell" ? gridSeedCell !== null : gridRegion !== null;
  const canApply =
    gridScaleType === "singleCell" ? singleLayout !== null : regionLayout !== null;

  const handleColumnInput = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    setGridColumnCount(parsed);
  };

  const handleRowInput = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return;
    setGridRowCount(parsed);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-4">
      <div>
        <h3 className="mb-2 text-xs font-medium text-zinc-300">网格缩放</h3>
        <p className="text-[11px] text-zinc-500">
          {gridScaleType === "singleCell"
            ? "框选一个基准格，按格尺寸平铺全图并合并为缩放结果。"
            : "框选处理区域，在区域内划分 X×Y 网格并合并为缩放结果。"}
        </p>
      </div>

      <div className="flex rounded border border-zinc-700 p-0.5">
        {GRID_SCALE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setGridScaleType(type)}
            className={`flex-1 rounded px-2 py-1.5 text-xs ${
              gridScaleType === type
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {GRID_SCALE_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!hasSelection && hasSource && (
          <p className="text-[11px] text-blue-400/90">
            {gridScaleType === "singleCell" ? "请在原图上框选基准格" : "请在原图上框选处理区域"}
          </p>
        )}
        {hasSelection && (
          <button
            type="button"
            onClick={cancelGrid}
            className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800"
          >
            取消网格
          </button>
        )}
      </div>

      {gridScaleType === "region" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] text-zinc-500" htmlFor="grid-column-count">
              X 方向网格数
            </label>
            <input
              id="grid-column-count"
              type="number"
              min={1}
              value={gridColumnCount}
              onChange={(event) => handleColumnInput(event.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-zinc-500" htmlFor="grid-row-count">
              Y 方向网格数
            </label>
            <input
              id="grid-row-count"
              type="number"
              min={1}
              value={gridRowCount}
              onChange={(event) => handleRowInput(event.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200"
            />
          </div>
          <p className="col-span-2 text-[10px] text-zinc-600">
            Shift+滚轮 调整 X · Ctrl+滚轮 调整 Y
          </p>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-[11px] text-zinc-500" htmlFor="merge-algorithm">
          区域合并算法
        </label>
        <select
          id="merge-algorithm"
          value={mergeAlgorithm}
          onChange={(event) => setMergeAlgorithm(event.target.value as GridMergeAlgorithm)}
          className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200"
        >
          {GRID_MERGE_ALGORITHMS.map((algorithm) => (
            <option key={algorithm} value={algorithm}>
              {GRID_MERGE_ALGORITHM_LABELS[algorithm]}
            </option>
          ))}
        </select>
      </div>

      {gridScaleType === "singleCell" && gridSeedCell && (
        <div className="space-y-1 text-[11px] text-zinc-400">
          <p>
            基准格：
            <span className="ml-1 font-medium text-zinc-200">
              {gridSeedCell.width} × {gridSeedCell.height}
            </span>
            <span className="ml-2 text-zinc-600">
              @ ({gridSeedCell.x}, {gridSeedCell.y})
            </span>
          </p>
          {singleLayout ? (
            <p>
              网格 / 输出：
              <span className="ml-1 font-medium text-zinc-200">
                {singleLayout.columns} × {singleLayout.rows} → {singleLayout.outputWidth} ×{" "}
                {singleLayout.outputHeight}
              </span>
            </p>
          ) : (
            <p className="text-amber-500/90">当前基准格无法生成有效网格</p>
          )}
        </div>
      )}

      {gridScaleType === "region" && gridRegion && !regionLayout && (
        <p className="text-[11px] text-amber-500/90">当前区域无法生成有效网格</p>
      )}

      {gridScaleType === "region" && gridRegion && regionLayout && (
        <div className="space-y-1 text-[11px] text-zinc-400">
          <p>
            框选区域：
            <span className="ml-1 font-medium text-zinc-200">
              {gridRegion.width} × {gridRegion.height}
            </span>
            <span className="ml-2 text-zinc-600">
              @ ({gridRegion.x}, {gridRegion.y})
            </span>
          </p>
          <p>
            内侧网格：
            <span className="ml-1 font-medium text-zinc-200">
              {regionLayout.columns} × {regionLayout.rows}
            </span>
          </p>
          <p>
            网格范围（含外围 1 格）：
            <span className="ml-1 font-medium text-zinc-200">
              {regionLayout.totalColumns} × {regionLayout.totalRows}
            </span>
            <span className="ml-2 text-zinc-600">
              @ ({regionLayout.region.x}, {regionLayout.region.y})
            </span>
          </p>
          <p>
            输出：
            <span className="ml-1 font-medium text-zinc-200">
              {regionLayout.outputWidth} × {regionLayout.outputHeight}
            </span>
          </p>
        </div>
      )}

      {error && <p className="text-[11px] text-red-400">{error}</p>}

      <button
        type="button"
        disabled={!canApply}
        onClick={applyGridRestoreResult}
        className="rounded bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        基于网格缩放
      </button>
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-800 p-4">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={!canSendToColorEdit}
            onClick={onSendToColorEdit}
            className="w-full rounded bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            发送到颜色编辑
          </button>
          <button
            type="button"
            disabled={!canExport}
            onClick={onExport}
            className="w-full rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
          >
            导出到资产库
          </button>
        </div>
        {!canExport && (
          <p className="mt-2 text-center text-[10px] text-zinc-600">
            请先选择软件数据路径并生成结果
          </p>
        )}
      </div>
    </div>
  );
}
