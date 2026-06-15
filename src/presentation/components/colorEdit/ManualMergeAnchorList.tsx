import type { ManualMergeAnchor } from "@/domain/colorEdit/ManualMergeAnchor";
import { formatMergeColorSwatchTooltip } from "@/domain/colorEdit/MergeColorTooltip";
import {
  MAX_OKLAB_MERGE_THRESHOLD,
  MIN_OKLAB_MERGE_THRESHOLD,
} from "@/domain/colorEdit/OklabMergeDistance";
import { toHexAlpha } from "@/domain/canvas/PixelColor";

interface ManualMergeAnchorListProps {
  anchors: readonly ManualMergeAnchor[];
  sourcePickMode: boolean;
  onToggleSourcePickMode: (enabled: boolean) => void;
  onThresholdChange: (id: string, threshold: number) => void;
  onRemove: (id: string) => void;
}

function buildSwatchBackground(hex: string): string {
  return `
    linear-gradient(${hex}, ${hex}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

export function ManualMergeAnchorList({
  anchors,
  sourcePickMode,
  onToggleSourcePickMode,
  onThresholdChange,
  onRemove,
}: ManualMergeAnchorListProps) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <h3 className="mb-1 text-xs font-medium text-zinc-300">手动保留色</h3>
        <p className="text-[11px] text-zinc-500">
          基础合并后，从原图或下方调色板选色补充细节。每个锚点独立设置感知容差。
        </p>
      </div>

      <button
        type="button"
        onClick={() => onToggleSourcePickMode(!sourcePickMode)}
        className={`rounded border px-2 py-1.5 text-xs transition ${
          sourcePickMode
            ? "border-blue-500 bg-blue-500/10 text-blue-300"
            : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-600"
        }`}
      >
        {sourcePickMode ? "取色中…（左键选色，中键平移）" : "从原图取色"}
      </button>

      {anchors.length === 0 ? (
        <p className="text-[10px] text-zinc-600">暂无锚点，点击原图或调色板添加</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {anchors.map((anchor) => {
            const hex = toHexAlpha(anchor.color);
            return (
              <li
                key={anchor.id}
                className="rounded border border-zinc-800 bg-zinc-900/50 p-2"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <div
                    title={formatMergeColorSwatchTooltip(anchor.color, hex)}
                    className="h-5 w-5 shrink-0 rounded-sm border border-zinc-600"
                    style={{ background: buildSwatchBackground(hex) }}
                  />
                  <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-zinc-400">
                    {hex}
                  </span>
                  <button
                    type="button"
                    title="删除锚点"
                    onClick={() => onRemove(anchor.id)}
                    className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                  >
                    删除
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={MIN_OKLAB_MERGE_THRESHOLD}
                    max={MAX_OKLAB_MERGE_THRESHOLD}
                    step={0.001}
                    value={anchor.threshold}
                    onChange={(event) =>
                      onThresholdChange(anchor.id, Number.parseFloat(event.target.value))
                    }
                    className="min-w-0 flex-1 accent-blue-500"
                  />
                  <span className="w-10 shrink-0 text-right text-[10px] text-zinc-400">
                    {anchor.threshold.toFixed(3)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
