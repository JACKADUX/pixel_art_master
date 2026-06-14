import { useCallback, useEffect, useRef, useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { toHexAlpha } from "@/domain/canvas/PixelColor";
import {
  MAX_ANCHOR_DISTANCE,
  MIN_ANCHOR_DISTANCE,
  type ColorMergeAnchor,
} from "@/domain/colorEdit/ColorMergeAnchor";

function buildSwatchBackground(hex: string): string {
  return `
    linear-gradient(${hex}, ${hex}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

function computeDropIndex(clientY: number, listElement: HTMLElement): number {
  const items = listElement.querySelectorAll<HTMLElement>("[data-anchor-item]");
  for (let i = 0; i < items.length; i += 1) {
    const rect = items[i].getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      return i;
    }
  }
  return items.length;
}

interface ColorMergeAnchorListProps {
  anchors: readonly ColorMergeAnchor[];
  onDistanceChange: (id: string, distance: number) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function ColorMergeAnchorList({
  anchors,
  onDistanceChange,
  onRemove,
  onReorder,
}: ColorMergeAnchorListProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const draggingRef = useRef<number | null>(null);
  const dropIndexRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const stopDragging = useCallback(() => {
    draggingRef.current = null;
    dropIndexRef.current = null;
    setIsDragging(false);
    setDraggingIndex(null);
    setDropIndex(null);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  const handleDragHandlePointerDown = (
    index: number,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = index;
    dropIndexRef.current = index;
    setIsDragging(true);
    setDraggingIndex(index);
    setDropIndex(index);
    event.currentTarget.setPointerCapture(event.pointerId);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (event: PointerEvent) => {
      if (!listRef.current || draggingRef.current === null) return;
      const index = Math.max(
        0,
        Math.min(computeDropIndex(event.clientY, listRef.current), anchors.length),
      );
      dropIndexRef.current = index;
      setDropIndex(index);
    };

    const onPointerUp = () => {
      const from = draggingRef.current;
      const to = dropIndexRef.current;
      if (from !== null && to !== null && from !== to) {
        onReorder(from, to);
      }
      stopDragging();
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
    return () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isDragging, anchors.length, onReorder, stopDragging]);

  if (anchors.length === 0) {
    return (
      <p className="text-[11px] text-zinc-600">
        从下方调色板点击，或开启吸色后点击原图添加锚点颜色
      </p>
    );
  }

  return (
    <ul ref={listRef} className="flex flex-col gap-2">
      {anchors.map((anchor, index) => {
        const hex = toHexAlpha(anchor.color);
        const showDropBefore = isDragging && dropIndex === index && draggingIndex !== index;
        return (
          <li key={anchor.id} data-anchor-item className="relative">
            {showDropBefore && (
              <div className="absolute -top-1 left-0 right-0 h-0.5 rounded bg-blue-500" />
            )}
            <div
              className={`flex items-center gap-2 rounded border border-zinc-800 bg-zinc-900/60 p-2${
                draggingIndex === index ? " opacity-50" : ""
              }`}
            >
              <button
                type="button"
                aria-label="拖拽排序"
                onPointerDown={(event) => handleDragHandlePointerDown(index, event)}
                className="shrink-0 cursor-grab text-zinc-500 hover:text-zinc-300 active:cursor-grabbing"
              >
                <Bars3Icon className="h-4 w-4" />
              </button>
              <div
                title={hex}
                className="h-6 w-6 shrink-0 rounded-sm border border-zinc-600"
                style={{ background: buildSwatchBackground(hex) }}
              />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">距离</span>
                  <span className="text-[10px] font-medium text-zinc-300">
                    {anchor.distance.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={MIN_ANCHOR_DISTANCE}
                  max={MAX_ANCHOR_DISTANCE}
                  step={0.01}
                  value={anchor.distance}
                  onChange={(event) =>
                    onDistanceChange(anchor.id, Number.parseFloat(event.target.value))
                  }
                  className="w-full accent-blue-500"
                />
              </div>
              <button
                type="button"
                aria-label="删除锚点"
                onClick={() => onRemove(anchor.id)}
                className="shrink-0 text-zinc-500 hover:text-red-400"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </li>
        );
      })}
      {isDragging && dropIndex === anchors.length && (
        <li className="h-0.5 rounded bg-blue-500" />
      )}
    </ul>
  );
}
