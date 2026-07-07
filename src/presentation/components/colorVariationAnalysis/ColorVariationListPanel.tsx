import { useCallback, useEffect, useRef, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import { ColorPickerPopover } from "../color-picker/ColorPickerPopover";
import { ColorVariationListItem } from "./ColorVariationListItem";
import {
  getDefaultNewVariationColor,
  useColorVariationAnalysisStore,
} from "../../stores/colorVariationAnalysisStore";

function computeDropDisplayIndex(clientY: number, listElement: HTMLElement): number {
  const items = listElement.querySelectorAll<HTMLElement>("[data-color-item]");
  for (let i = 0; i < items.length; i += 1) {
    const rect = items[i]!.getBoundingClientRect();
    if (clientY < rect.top + rect.height / 2) {
      return i;
    }
  }
  return items.length;
}

type PickerMode =
  | { type: "closed" }
  | { type: "edit"; index: number }
  | { type: "add"; draftColor: PixelColor };

export function ColorVariationListPanel() {
  const series = useColorVariationAnalysisStore((s) => s.series);
  const parseError = useColorVariationAnalysisStore((s) => s.parseError);
  const colorEntries = useColorVariationAnalysisStore((s) => s.colorEntries);
  const removeColorAt = useColorVariationAnalysisStore((s) => s.removeColorAt);
  const updateColorAt = useColorVariationAnalysisStore((s) => s.updateColorAt);
  const addColor = useColorVariationAnalysisStore((s) => s.addColor);
  const reorderColors = useColorVariationAnalysisStore((s) => s.reorderColors);

  const [pickerMode, setPickerMode] = useState<PickerMode>({ type: "closed" });
  const [isDragging, setIsDragging] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const listRef = useRef<HTMLUListElement>(null);
  const anchorRef = useRef<HTMLElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const draggingRef = useRef<number | null>(null);
  const dropIndexRef = useRef<number | null>(null);

  const points = series?.points ?? [];
  const colorCount = points.length;

  const pickerOpen = pickerMode.type !== "closed";
  const pickerColor =
    pickerMode.type === "edit"
      ? (colorEntries[pickerMode.index]?.color ?? getDefaultNewVariationColor(colorEntries))
      : pickerMode.type === "add"
        ? pickerMode.draftColor
        : getDefaultNewVariationColor(colorEntries);

  const closePicker = useCallback(() => {
    setPickerMode({ type: "closed" });
  }, []);

  const handlePickerChange = useCallback(
    (color: PixelColor) => {
      if (pickerMode.type === "edit") {
        updateColorAt(pickerMode.index, color);
      } else if (pickerMode.type === "add") {
        setPickerMode({ type: "add", draftColor: color });
      }
    },
    [pickerMode, updateColorAt],
  );

  const handlePickerClose = useCallback(() => {
    if (pickerMode.type === "add") {
      addColor(pickerMode.draftColor);
    }
    closePicker();
  }, [addColor, closePicker, pickerMode]);

  const openEditPicker = useCallback((index: number, anchor: HTMLButtonElement) => {
    anchorRef.current = anchor;
    setPickerMode({ type: "edit", index });
  }, []);

  const openAddPicker = useCallback(() => {
    anchorRef.current = addButtonRef.current;
    setPickerMode({
      type: "add",
      draftColor: getDefaultNewVariationColor(colorEntries),
    });
  }, [colorEntries]);

  const stopDragging = useCallback(() => {
    draggingRef.current = null;
    dropIndexRef.current = null;
    setIsDragging(false);
    setDraggingIndex(null);
    setDropIndex(null);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  const handleDragHandlePointerDown = useCallback(
    (index: number, event: React.PointerEvent<HTMLButtonElement>) => {
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
    },
    [],
  );

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (event: PointerEvent) => {
      if (!listRef.current || draggingRef.current === null) return;
      const rawIndex = computeDropDisplayIndex(event.clientY, listRef.current);
      const index = Math.max(0, Math.min(rawIndex, colorCount));
      dropIndexRef.current = index;
      setDropIndex(index);
    };

    const onPointerUp = () => {
      const from = draggingRef.current;
      const to = dropIndexRef.current;
      if (from !== null && to !== null) {
        reorderColors(from, to);
      }
      stopDragging();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [colorCount, isDragging, reorderColors, stopDragging]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
      <div>
        <h2 className="text-xs font-medium text-zinc-300">颜色列表</h2>
        <p className="mt-1 text-[10px] leading-relaxed text-zinc-500">
          双击色块编辑，拖拽手柄调整顺序，按列表顺序分析 OKLCH 变化规律。
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {colorCount === 0 ? (
          <div className="flex h-full items-center justify-center px-2 text-center text-[11px] text-zinc-500">
            暂无颜色，点击下方添加或通过顶部导入
          </div>
        ) : (
          <ul ref={listRef} className="flex flex-col gap-1">
            {dropIndex === 0 && isDragging && (
              <li className="h-0.5 shrink-0 rounded-full bg-blue-500" aria-hidden />
            )}
            {points.map((point, index) => (
              <div key={`${point.hex}-${index}`}>
                {dropIndex === index && isDragging && index > 0 && (
                  <div className="mb-1 h-0.5 rounded-full bg-blue-500" aria-hidden />
                )}
                <ColorVariationListItem
                  index={index}
                  point={point}
                  isDragging={draggingIndex === index}
                  onRemove={() => removeColorAt(index)}
                  onDoubleClick={(anchor) => openEditPicker(index, anchor)}
                  onDragHandlePointerDown={handleDragHandlePointerDown}
                />
              </div>
            ))}
            {dropIndex === colorCount && isDragging && (
              <li className="mt-1 h-0.5 shrink-0 rounded-full bg-blue-500" aria-hidden />
            )}
          </ul>
        )}
      </div>

      <div className="shrink-0 space-y-2">
        <button
          ref={addButtonRef}
          type="button"
          onClick={openAddPicker}
          className="flex w-full items-center justify-center gap-1.5 rounded border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800"
        >
          <PlusIcon className="h-4 w-4" />
          添加颜色
        </button>

        <div className="text-[10px] text-zinc-500">
          {parseError ? (
            <span className="text-red-400">{parseError}</span>
          ) : colorCount > 0 ? (
            <span>共 {colorCount} 个颜色</span>
          ) : (
            <span>添加颜色后开始分析</span>
          )}
        </div>
      </div>

      <ColorPickerPopover
        open={pickerOpen}
        anchorRef={anchorRef}
        activeSlot="foreground"
        currentColor={pickerColor}
        onChange={handlePickerChange}
        onClose={handlePickerClose}
      />
    </div>
  );
}
