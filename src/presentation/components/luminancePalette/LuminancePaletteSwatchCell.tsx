import { colorsEqual, type PixelColor } from "@/domain/canvas/PixelColor";import { swatchIndexToShortcutLabel } from "@/domain/luminancePalette/LuminancePaletteNavigation";
import type { LuminancePaletteSwatch } from "@/domain/luminancePalette/LuminancePaletteSwatch";
import type { ColorSlot } from "@/presentation/stores/appStore";
import { buildLuminanceSwatchBackground } from "./luminancePaletteSwatchStyle";

export type LuminanceSwatchCellMode = "filled" | "empty" | "preview";
export type LuminanceSwatchInteractionMode = "normal" | "edit";

interface LuminancePaletteSwatchCellProps {
  mode: LuminanceSwatchCellMode;
  interactionMode?: LuminanceSwatchInteractionMode;
  swatch?: LuminancePaletteSwatch;
  swatchIndex?: number;
  foregroundColor?: PixelColor;
  backgroundColor?: PixelColor;
  isLiveEditing?: boolean;
  interactive?: boolean;
  onSelect?: (slot: ColorSlot, color: PixelColor) => void;
  onSetSwatchForeground?: () => void;
  onRemove?: () => void;
  onActivate?: () => void;
  onActivateLiveEdit?: () => void;
  onDeactivateLiveEdit?: () => void;
}

export function LuminancePaletteSwatchCell({
  mode,
  interactionMode = "normal",
  swatch,
  swatchIndex = 0,
  foregroundColor,
  backgroundColor,
  isLiveEditing = false,
  interactive = true,
  onSelect,
  onSetSwatchForeground,
  onRemove,
  onActivate,
  onActivateLiveEdit,
  onDeactivateLiveEdit,
}: LuminancePaletteSwatchCellProps) {
  const shortcut = swatchIndexToShortcutLabel(swatchIndex);

  if (mode === "preview") {
    if (!swatch) {
      return (
        <span
          className="block h-4 w-4 shrink-0 rounded-[1px] border border-dashed border-zinc-600/80 bg-zinc-800/40"
          aria-hidden
        />
      );
    }
    return (
      <span
        className="block h-4 w-4 shrink-0 rounded-[1px] border border-zinc-700"
        style={{ background: buildLuminanceSwatchBackground(swatch.hex) }}
        aria-hidden
      />
    );
  }

  if (mode === "empty") {
    if (!interactive) {
      return (
        <span
          className="block h-4 w-4 shrink-0 rounded-[1px] border border-dashed border-zinc-600/60 bg-zinc-800/30"
          aria-hidden
        />
      );
    }

    return (
      <button
        type="button"
        title={`空槽位（快捷键 ${shortcut}）\n左键加入当前前景色`}
        onClick={(event) => {
          event.stopPropagation();
          onActivate?.();
          onSetSwatchForeground?.();
        }}
        className="h-4 w-4 shrink-0 rounded-[1px] border border-dashed border-zinc-600/80 bg-zinc-800/40 transition hover:border-zinc-400"
      />
    );
  }

  if (!swatch) return null;

  const isForeground =
    foregroundColor !== undefined && colorsEqual(foregroundColor, swatch.color);
  const isBackground =
    backgroundColor !== undefined && colorsEqual(backgroundColor, swatch.color);

  if (!interactive) {
    return (
      <span
        className={`block h-4 w-4 shrink-0 rounded-[1px] border ${
          isForeground
            ? "border-blue-400 ring-1 ring-blue-400"
            : isBackground
              ? "border-amber-400 ring-1 ring-amber-400"
              : "border-zinc-700"
        }`}
        style={{ background: buildLuminanceSwatchBackground(swatch.hex) }}
        aria-hidden
      />
    );
  }

  if (interactionMode === "edit") {
    return (
      <button
        type="button"
        title={`${swatch.hex}\n双击实时取色 · 右键移除 · 快捷键 ${shortcut}`}
        onClick={(event) => {
          event.stopPropagation();
          if (isLiveEditing) {
            onDeactivateLiveEdit?.();
            return;
          }
          onActivate?.();
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          onActivate?.();
          onActivateLiveEdit?.();
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onActivate?.();
          onRemove?.();
        }}
        className={`h-4 w-4 shrink-0 rounded-[1px] border transition hover:ring-1 hover:ring-zinc-500/50 ${
          isLiveEditing
            ? "border-amber-400 ring-2 ring-amber-400"
            : isForeground
              ? "border-blue-400 ring-1 ring-blue-400"
              : isBackground
                ? "border-amber-400 ring-1 ring-amber-400"
                : "border-zinc-700"
        }`}
        style={{ background: buildLuminanceSwatchBackground(swatch.hex) }}
      />
    );
  }

  return (
    <button
      type="button"
      title={`${swatch.hex}\n左键前景 · 右键背景 · Shift+右键移除 · 快捷键 ${shortcut}`}
      onClick={(event) => {
        event.stopPropagation();
        onActivate?.();
        onSelect?.("foreground", swatch.color);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onActivate?.();
        if (event.shiftKey) {
          onRemove?.();
          return;
        }
        onSelect?.("background", swatch.color);
      }}
      className={`h-4 w-4 shrink-0 rounded-[1px] border transition hover:ring-1 hover:ring-zinc-500/50 ${
        isForeground
          ? "border-blue-400 ring-1 ring-blue-400"
          : isBackground
            ? "border-amber-400 ring-1 ring-amber-400"
            : "border-zinc-700"
      }`}
      style={{ background: buildLuminanceSwatchBackground(swatch.hex) }}
    />
  );
}
