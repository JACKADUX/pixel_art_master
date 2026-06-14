import { useColorEditStore } from "../../stores/colorEditStore";
import { ColorMergeAnchorList } from "./ColorMergeAnchorList";
import { ColorPalettePreview } from "./ColorPalettePreview";

interface ColorMergeControlsProps {
  canExport: boolean;
  onExport: () => void;
}

export function ColorMergeControls({ canExport, onExport }: ColorMergeControlsProps) {
  const mergeAnchors = useColorEditStore((s) => s.mergeAnchors);
  const pickColorMode = useColorEditStore((s) => s.pickColorMode);
  const unmatchedPixelBehavior = useColorEditStore((s) => s.unmatchedPixelBehavior);
  const statsBefore = useColorEditStore((s) => s.statsBefore);
  const statsAfter = useColorEditStore((s) => s.statsAfter);
  const sourceImageData = useColorEditStore((s) => s.sourceImageData);
  const resultImageData = useColorEditStore((s) => s.resultImageData);
  const error = useColorEditStore((s) => s.error);
  const togglePickColorMode = useColorEditStore((s) => s.togglePickColorMode);
  const addMergeAnchor = useColorEditStore((s) => s.addMergeAnchor);
  const removeMergeAnchor = useColorEditStore((s) => s.removeMergeAnchor);
  const setAnchorDistance = useColorEditStore((s) => s.setAnchorDistance);
  const reorderMergeAnchors = useColorEditStore((s) => s.reorderMergeAnchors);
  const setUnmatchedPixelBehavior = useColorEditStore((s) => s.setUnmatchedPixelBehavior);

  const hasResult = sourceImageData !== null && resultImageData !== null;
  const hasAnchors = mergeAnchors.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="mb-2 text-xs font-medium text-zinc-300">颜色合并</h3>
            <p className="text-[11px] text-zinc-500">
              以 H、S、Oklab 明度构成三维向量，按列表优先级将相近像素归并到锚点颜色。
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] text-zinc-500">未匹配像素</p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setUnmatchedPixelBehavior("remove")}
                className={`flex-1 rounded px-2 py-1.5 text-xs ${
                  unmatchedPixelBehavior === "remove"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                移除
              </button>
              <button
                type="button"
                onClick={() => setUnmatchedPixelBehavior("keep")}
                className={`flex-1 rounded px-2 py-1.5 text-xs ${
                  unmatchedPixelBehavior === "keep"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                保持原色
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={togglePickColorMode}
            disabled={!sourceImageData}
            className={`rounded px-3 py-1.5 text-xs ${
              pickColorMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {pickColorMode ? "吸色中…（点击原图）" : "吸色添加锚点"}
          </button>

          <div>
            <p className="mb-2 text-[11px] font-medium text-zinc-400">
              锚点列表
              <span className="ml-1 font-normal text-zinc-600">（自上而下优先）</span>
            </p>
            <ColorMergeAnchorList
              anchors={mergeAnchors}
              onDistanceChange={setAnchorDistance}
              onRemove={removeMergeAnchor}
              onReorder={reorderMergeAnchors}
            />
          </div>

          {hasResult && statsBefore && statsAfter && (
            <p className="text-[11px] text-zinc-400">
              颜色数：
              <span className="ml-1 font-medium text-zinc-200">
                {statsBefore.uniqueCount} → {statsAfter.uniqueCount}
              </span>
            </p>
          )}

          <div className="flex flex-col gap-2">
            <ColorPalettePreview
              label="归一前"
              stats={statsBefore}
              onColorClick={addMergeAnchor}
            />
            <ColorPalettePreview label="归一后" stats={statsAfter} />
          </div>

          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
      </div>

      <div className="shrink-0 border-t border-zinc-800 p-4">
        <button
          type="button"
          disabled={!canExport || !hasResult || !hasAnchors}
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
