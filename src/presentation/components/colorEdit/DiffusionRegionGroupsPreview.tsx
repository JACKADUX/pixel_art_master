import type { DiffusionRegionGroups } from "@/domain/colorEdit/DiffusionRegionGroups";
import { formatMergeColorSwatchTooltip } from "@/domain/colorEdit/MergeColorTooltip";
import type { ColorEntry } from "@/domain/palette/Palette";

interface DiffusionRegionGroupsPreviewProps {
  regionGroups: DiffusionRegionGroups | null;
}

function buildSwatchBackground(hex: string): string {
  return `
    linear-gradient(${hex}, ${hex}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

function GroupColorSwatches({ colors }: { colors: readonly ColorEntry[] }) {
  if (colors.length === 0) {
    return <p className="text-[10px] text-zinc-600">暂无颜色</p>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {colors.map((entry) => (
        <div
          key={entry.hex}
          title={formatMergeColorSwatchTooltip(entry.color, entry.hex)}
          className="h-4 w-4 shrink-0 rounded-sm border border-zinc-600"
          style={{ background: buildSwatchBackground(entry.hex) }}
        />
      ))}
    </div>
  );
}

export function DiffusionRegionGroupsPreview({
  regionGroups,
}: DiffusionRegionGroupsPreviewProps) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900/50 p-2">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-[11px] font-medium text-zinc-400">合并前分组</span>
        <span className="text-[11px] text-zinc-500">
          {regionGroups ? `${regionGroups.groupCount} 组` : "—"}
        </span>
      </div>

      {!regionGroups || regionGroups.groups.length === 0 ? (
        <p className="text-[10px] text-zinc-600">暂无分组</p>
      ) : (
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {regionGroups.groups.map((group, index) => (
            <div
              key={index}
              className="rounded border border-zinc-800 bg-zinc-950/40 px-2 py-1.5"
            >
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-[10px] font-medium text-zinc-500">第 {index + 1} 组</span>
                <span className="text-[10px] text-zinc-600">
                  {group.uniqueColorCount} 色 · {group.pixelCount} 像素
                </span>
              </div>
              <GroupColorSwatches colors={group.colors} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
