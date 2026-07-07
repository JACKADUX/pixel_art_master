import { useRef } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import type { ColorVariationPoint } from "@/domain/colorAnalysis/ColorVariationAnalysis";
import { formatChartPercentLabel } from "@/domain/colorAnalysis/ColorVariationChartLayout";

function buildSwatchBackground(hex: string): string {
  return `
    linear-gradient(${hex}, ${hex}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

interface ColorVariationListItemProps {
  index: number;
  point: ColorVariationPoint;
  isDragging: boolean;
  onRemove: () => void;
  onDoubleClick: (anchor: HTMLButtonElement) => void;
  onDragHandlePointerDown: (index: number, event: React.PointerEvent<HTMLButtonElement>) => void;
}

export function ColorVariationListItem({
  index,
  point,
  isDragging,
  onRemove,
  onDoubleClick,
  onDragHandlePointerDown,
}: ColorVariationListItemProps) {
  const hexShort = point.hex.slice(0, 7);
  const lLabel = formatChartPercentLabel(point.normalized.l);
  const cLabel = formatChartPercentLabel(point.normalized.c);
  const hLabel = formatChartPercentLabel(point.normalized.h);
  const swatchRef = useRef<HTMLButtonElement>(null);

  return (
    <li data-color-item className="w-full min-w-0">
        <div
          className={`flex w-full min-w-0 items-center gap-1.5 rounded border px-2 py-1.5 transition ${
            isDragging
              ? "border-zinc-600 bg-zinc-800/30 opacity-50"
              : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
          }`}
        >
          <button
            type="button"
            title="拖拽调整顺序"
            onPointerDown={(event) => onDragHandlePointerDown(index, event)}
            onDoubleClick={(event) => event.stopPropagation()}
            className="shrink-0 cursor-grab touch-none text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
          >
            <Bars3Icon className="h-4 w-4" />
          </button>

          <button
            ref={swatchRef}
            type="button"
            title="双击编辑颜色"
            onDoubleClick={(event) => {
              event.stopPropagation();
              if (swatchRef.current) {
                onDoubleClick(swatchRef.current);
              }
            }}
            className="shrink-0 rounded-sm border border-zinc-600"
            style={{
              width: 24,
              height: 24,
              background: buildSwatchBackground(hexShort),
            }}
          />

          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-[11px] text-zinc-200">{hexShort}</div>
            <div className="truncate text-[10px] text-zinc-500">
              L:{lLabel} C:{cLabel} H:{hLabel}
            </div>
          </div>

          <button
            type="button"
            title="移除颜色"
            onClick={onRemove}
            onDoubleClick={(event) => event.stopPropagation()}
            className="shrink-0 text-zinc-500 hover:text-red-400"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </li>
    );
}
