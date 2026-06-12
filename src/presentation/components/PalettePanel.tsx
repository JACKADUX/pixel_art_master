import {
  PALETTE_OKLAB_MAP_MAX_COLORS,
} from "@/domain/palette/PaletteOklabLayout";
import { useAppStore } from "../stores/appStore";
import { PaletteGridView } from "./PaletteGridView";
import { PaletteOklabMapView } from "./PaletteOklabMapView";

export function PalettePanel() {
  const project = useAppStore((s) => s.project);
  const currentColor = useAppStore((s) => s.currentColor);
  const setCurrentColor = useAppStore((s) => s.setCurrentColor);
  const paletteViewMode = useAppStore((s) => s.paletteViewMode);
  const setPaletteViewMode = useAppStore((s) => s.setPaletteViewMode);

  if (!project) return null;

  const colors = project.palette.getColors();
  const mapColors = colors.slice(0, PALETTE_OKLAB_MAP_MAX_COLORS);
  const isTruncated = paletteViewMode === "oklabMap" && colors.length > PALETTE_OKLAB_MAP_MAX_COLORS;

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 p-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-zinc-300">色板 ({colors.length})</h3>
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
      {isTruncated && (
        <p className="shrink-0 text-[10px] text-amber-500/90">
          色域图仅展示前 {PALETTE_OKLAB_MAP_MAX_COLORS} 色（共 {colors.length} 色）
        </p>
      )}
      {colors.length === 0 ? (
        <p className="text-xs text-zinc-500">导入或截图后自动提取色板</p>
      ) : paletteViewMode === "grid" ? (
        <PaletteGridView
          colors={colors}
          currentColor={currentColor}
          onSelect={setCurrentColor}
        />
      ) : (
        <PaletteOklabMapView
          colors={mapColors}
          currentColor={currentColor}
          onSelect={setCurrentColor}
        />
      )}
    </div>
  );
}
