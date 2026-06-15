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
import { DiffusionRegionGroupsPreview } from "./DiffusionRegionGroupsPreview";
import { ManualMergeAnchorList } from "./ManualMergeAnchorList";

interface OklabMergeControlsProps {
  canExport: boolean;
  onExport: () => void;
}

export function OklabMergeControls({ canExport, onExport }: OklabMergeControlsProps) {
  const oklabMergeThreshold = useColorEditStore((s) => s.oklabMergeThreshold);
  const oklabReduceAlgorithm = useColorEditStore((s) => s.oklabReduceAlgorithm);
  const statsBefore = useColorEditStore((s) => s.statsBefore);
  const statsAfter = useColorEditStore((s) => s.statsAfter);
  const mergeRegionGroups = useColorEditStore((s) => s.mergeRegionGroups);
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
              onChange={(event) => setOklabMergeThreshold(Number.parseFloat(event.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[11px] text-zinc-500">代表色策略</p>
            <select
              value={oklabReduceAlgorithm}
              onChange={(event) =>
                setOklabReduceAlgorithm(event.target.value as OklabReduceAlgorithm)
              }
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200"
            >
              {OKLAB_REDUCE_ALGORITHMS.map((algorithm) => (
                <option key={algorithm} value={algorithm}>
                  {OKLAB_REDUCE_ALGORITHM_LABELS[algorithm]}
                </option>
              ))}
            </select>
          </div>

          {hasResult && statsBefore && statsAfter && mergeRegionGroups && (
            <p className="text-[11px] text-zinc-400">
              分组 / 颜色数：
              <span className="ml-1 font-medium text-zinc-200">
                {mergeRegionGroups.groupCount} 组 · {statsBefore.uniqueCount} →{" "}
                {statsAfter.uniqueCount}
              </span>
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
            <DiffusionRegionGroupsPreview regionGroups={mergeRegionGroups} />
            <ColorPalettePreview label="归一后" stats={statsAfter} />
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
