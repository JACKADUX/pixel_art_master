import {
  MAX_OKLAB_MERGE_THRESHOLD,
  MIN_OKLAB_MERGE_THRESHOLD,
} from "@/domain/colorEdit/OklabMergeDistance";
import {
  OKLAB_REDUCE_ALGORITHM_LABELS,
  OKLAB_REDUCE_ALGORITHMS,
  type OklabReduceAlgorithm,
} from "@/domain/colorEdit/OklabReduceAlgorithm";
import { useColorEditStore } from "../../stores/colorEditStore";
import { ColorPalettePreview } from "./ColorPalettePreview";
import { ManualMergeAnchorList } from "./ManualMergeAnchorList";

interface OklabMergeControlsProps {
  canExport: boolean;
  onExport: () => void;
}

export function OklabMergeControls({ canExport, onExport }: OklabMergeControlsProps) {
  const oklabMergeThreshold = useColorEditStore((s) => s.oklabMergeThreshold);
  const oklabReduceAlgorithm = useColorEditStore((s) => s.oklabReduceAlgorithm);
  const statsBefore = useColorEditStore((s) => s.statsBefore);
  const statsAfterNormalized = useColorEditStore((s) => s.statsAfterNormalized);
  const statsAfter = useColorEditStore((s) => s.statsAfter);
  const disabledColors = useColorEditStore((s) => s.disabledColors);
  const mergeGroupCount = useColorEditStore((s) => s.mergeGroupCount);
  const processing = useColorEditStore((s) => s.processing);
  const cancelProcessing = useColorEditStore((s) => s.cancelProcessing);
  const sourceImageData = useColorEditStore((s) => s.sourceImageData);
  const resultImageData = useColorEditStore((s) => s.resultImageData);
  const error = useColorEditStore((s) => s.error);
  const setOklabMergeThreshold = useColorEditStore((s) => s.setOklabMergeThreshold);
  const setOklabReduceAlgorithm = useColorEditStore((s) => s.setOklabReduceAlgorithm);
  const manualMergeAnchors = useColorEditStore((s) => s.manualMergeAnchors);
  const sourcePickMode = useColorEditStore((s) => s.sourcePickMode);
  const setSourcePickMode = useColorEditStore((s) => s.setSourcePickMode);
  const addManualMergeAnchor = useColorEditStore((s) => s.addManualMergeAnchor);
  const removeManualMergeAnchor = useColorEditStore((s) => s.removeManualMergeAnchor);
  const setManualMergeAnchorThreshold = useColorEditStore(
    (s) => s.setManualMergeAnchorThreshold,
  );
  const toggleNormalizedColorDisabled = useColorEditStore((s) => s.toggleNormalizedColorDisabled);

  const hasResult = sourceImageData !== null && resultImageData !== null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2 text-xs font-medium text-zinc-300">感知合并</h3>
            <p className="text-[11px] text-zinc-500">
              提取调色板唯一色，在 OKLab 空间按加权 ΔE、硬明度限与动态阈值聚类，再按代表色策略重映射全图像素。
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[11px] text-zinc-500">感知容差（ΔE）</p>
              <span className="text-[10px] font-medium text-zinc-300">
                {oklabMergeThreshold.toFixed(3)}
              </span>
            </div>
            <input
              type="range"
              min={MIN_OKLAB_MERGE_THRESHOLD}
              max={MAX_OKLAB_MERGE_THRESHOLD}
              step={0.001}
              value={oklabMergeThreshold}
              disabled={processing}
              onChange={(event) => setOklabMergeThreshold(Number.parseFloat(event.target.value))}
              className="w-full accent-blue-500 disabled:opacity-50"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[11px] text-zinc-500">代表色策略</p>
            <select
              value={oklabReduceAlgorithm}
              disabled={processing}
              onChange={(event) =>
                setOklabReduceAlgorithm(event.target.value as OklabReduceAlgorithm)
              }
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 disabled:opacity-50"
            >
              {OKLAB_REDUCE_ALGORITHMS.map((algorithm) => (
                <option key={algorithm} value={algorithm}>
                  {OKLAB_REDUCE_ALGORITHM_LABELS[algorithm]}
                </option>
              ))}
            </select>
          </div>

          {hasResult && statsBefore && statsAfter && mergeGroupCount !== null && (
            <div className="flex items-center gap-2">
              <p className="text-[11px] text-zinc-400">
                分组 / 颜色数：
                <span className="ml-1 font-medium text-zinc-200">
                  {mergeGroupCount} 组 · {statsBefore.uniqueCount} → {statsAfter.uniqueCount}
                </span>
                {processing && (
                  <span className="ml-2 text-[10px] text-zinc-500">处理中…</span>
                )}
              </p>
              {processing && (
                <button
                  type="button"
                  onClick={cancelProcessing}
                  className="shrink-0 rounded border border-zinc-600 px-2 py-0.5 text-[10px] text-zinc-300 hover:border-red-500 hover:text-red-300"
                >
                  中断
                </button>
              )}
            </div>
          )}

          {statsBefore && statsBefore.uniqueCount > 3000 && (
            <p className="text-[10px] text-amber-500/90">
              高唯一色图像（{statsBefore.uniqueCount} 色）：已自动启用 RGB 快速预合并，再进行感知合并。
            </p>
          )}

          <ManualMergeAnchorList
            anchors={manualMergeAnchors}
            sourcePickMode={sourcePickMode}
            onToggleSourcePickMode={setSourcePickMode}
            onThresholdChange={setManualMergeAnchorThreshold}
            onRemove={removeManualMergeAnchor}
          />

          <div className="flex flex-col gap-2">
            <ColorPalettePreview
              label="原图调色板"
              stats={statsBefore}
              onColorClick={addManualMergeAnchor}
            />
            <ColorPalettePreview
              label="归一后"
              stats={statsAfterNormalized}
              activeCount={statsAfter?.uniqueCount ?? null}
              disabledColors={disabledColors}
              onColorRightClick={toggleNormalizedColorDisabled}
            />
          </div>

          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-800 p-4">
        <button
          type="button"
          disabled={!canExport || !hasResult}
          onClick={onExport}
          className="w-full rounded bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
        >
          导出到资产库
        </button>
        {!canExport && (
          <p className="mt-2 text-center text-[10px] text-zinc-600">
            请先选择项目文件夹并生成结果
          </p>
        )}
      </div>
    </div>
  );
}
