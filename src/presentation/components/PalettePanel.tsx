import { useCallback, useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toHexAlpha } from "@/domain/canvas/PixelColor";
import {
  PALETTE_OKLAB_MAP_MAX_COLORS,
} from "@/domain/palette/PaletteOklabLayout";
import { useAppStore } from "../stores/appStore";
import { PaletteGridView } from "./PaletteGridView";
import { PaletteOklabMapView } from "./PaletteOklabMapView";
import { ReferencePaletteImportMenu } from "./ReferencePaletteImportMenu";

function buildSwatchBackground(hex: string): string {
  return `
    linear-gradient(${hex}, ${hex}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

export function PalettePanel() {
  const project = useAppStore((s) => s.project);
  const foregroundColor = useAppStore((s) => s.foregroundColor);
  const backgroundColor = useAppStore((s) => s.backgroundColor);
  const setColorSlot = useAppStore((s) => s.setColorSlot);
  const paletteViewMode = useAppStore((s) => s.paletteViewMode);
  const setPaletteViewMode = useAppStore((s) => s.setPaletteViewMode);
  const addColorToPalette = useAppStore((s) => s.addColorToPalette);
  const removeColorsFromPalette = useAppStore((s) => s.removeColorsFromPalette);

  const [removeMode, setRemoveMode] = useState(false);
  const [selectedHexes, setSelectedHexes] = useState<Set<string>>(() => new Set());

  const exitRemoveMode = useCallback(() => {
    setRemoveMode(false);
    setSelectedHexes(new Set());
  }, []);

  const toggleRemoveSelect = useCallback((hex: string) => {
    setSelectedHexes((prev) => {
      const next = new Set(prev);
      if (next.has(hex)) {
        next.delete(hex);
      } else {
        next.add(hex);
      }
      return next;
    });
  }, []);

  const handleConfirmRemove = useCallback(() => {
    if (selectedHexes.size === 0) return;
    removeColorsFromPalette([...selectedHexes]);
    exitRemoveMode();
  }, [selectedHexes, removeColorsFromPalette, exitRemoveMode]);

  if (!project) return null;

  const colors = project.palette.getColors();
  const mapColors = colors.slice(0, PALETTE_OKLAB_MAP_MAX_COLORS);
  const isTruncated = paletteViewMode === "oklabMap" && colors.length > PALETTE_OKLAB_MAP_MAX_COLORS;
  const foregroundHex = toHexAlpha(foregroundColor);

  const sharedViewProps = {
    foregroundColor,
    backgroundColor,
    onSelect: setColorSlot,
    removeMode,
    selectedHexes,
    onToggleRemoveSelect: toggleRemoveSelect,
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 p-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-300">色板 ({colors.length})</h3>
        <div className="flex items-center gap-1.5">
          {!removeMode && (
            <>
              <button
                type="button"
                title="将当前前景色加入色板"
                onClick={() => addColorToPalette(foregroundColor)}
                className="flex items-center gap-1 rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                <span
                  className="h-3.5 w-3.5 shrink-0 rounded-sm border border-zinc-600"
                  style={{ background: buildSwatchBackground(foregroundHex) }}
                />
                <PlusIcon className="h-3 w-3" />
                <span>添加</span>
              </button>
              <ReferencePaletteImportMenu />
              {colors.length > 0 && (
                <button
                  type="button"
                  title="选择色块并移除"
                  onClick={() => setRemoveMode(true)}
                  className="flex items-center gap-1 rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800"
                >
                  <TrashIcon className="h-3 w-3" />
                  <span>移除</span>
                </button>
              )}
            </>
          )}
          {colors.length > 0 && (
            <div className="flex rounded border border-zinc-700 text-[10px]">
              <button
                type="button"
                onClick={() => setPaletteViewMode("grid")}
                className={`px-2 py-0.5 transition ${
                  paletteViewMode === "grid"
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                网格
              </button>
              <button
                type="button"
                onClick={() => setPaletteViewMode("oklabMap")}
                className={`px-2 py-0.5 transition ${
                  paletteViewMode === "oklabMap"
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                色域图
              </button>
            </div>
          )}
        </div>
      </div>

      {removeMode && (
        <p className="shrink-0 text-[10px] text-amber-500/90">
          点击色块选择要移除的颜色
        </p>
      )}

      {isTruncated && (
        <p className="shrink-0 text-[10px] text-amber-500/90">
          色域图仅展示前 {PALETTE_OKLAB_MAP_MAX_COLORS} 色（共 {colors.length} 色）
        </p>
      )}

      {colors.length === 0 ? (
        <p className="text-xs text-zinc-500">点击添加将当前前景色加入色板</p>
      ) : paletteViewMode === "grid" ? (
        <PaletteGridView colors={colors} {...sharedViewProps} />
      ) : (
        <PaletteOklabMapView colors={mapColors} {...sharedViewProps} />
      )}

      {removeMode && (
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-700 pt-2">
          <button
            type="button"
            onClick={exitRemoveMode}
            className="rounded px-2 py-1 text-[10px] text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            取消
          </button>
          <button
            type="button"
            disabled={selectedHexes.size === 0}
            onClick={handleConfirmRemove}
            className="rounded bg-red-600/80 px-2 py-1 text-[10px] text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            确认移除 ({selectedHexes.size})
          </button>
        </div>
      )}
    </div>
  );
}
