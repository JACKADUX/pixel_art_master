import {
  ArrowsPointingOutIcon,
  ArrowsRightLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { COLOR_PICKER_HEADER_HEIGHT } from "@/domain/color/ColorPickerLayout";
import { useAppStore } from "@/presentation/stores/appStore";

interface ColorPickerHeaderProps {
  variant: "popover" | "floating";
  onDetach?: () => void;
  onClose?: () => void;
  onHeaderMouseDown?: (e: React.MouseEvent) => void;
}

export function ColorPickerHeader({
  variant,
  onDetach,
  onClose,
  onHeaderMouseDown,
}: ColorPickerHeaderProps) {
  const orientation = useAppStore((s) => s.colorPickerLayoutOrientation);
  const setColorPickerLayoutOrientation = useAppStore(
    (s) => s.setColorPickerLayoutOrientation,
  );

  const toggleOrientation = () => {
    setColorPickerLayoutOrientation(
      orientation === "vertical" ? "horizontal" : "vertical",
    );
  };

  const layoutLabel =
    orientation === "vertical" ? "切换为水平布局" : "切换为垂直布局";

  return (
    <div
      className={`flex select-none items-center justify-between gap-2 bg-zinc-800 px-2 text-xs text-zinc-300 ${
        variant === "floating"
          ? "cursor-move border-b-2 border-zinc-600"
          : "border-b border-zinc-700"
      }`}
      style={{ height: COLOR_PICKER_HEADER_HEIGHT }}
      onMouseDown={onHeaderMouseDown}
    >
      <span className="shrink-0">色彩选择器</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          title={layoutLabel}
          aria-label={layoutLabel}
          onClick={toggleOrientation}
          className="flex items-center rounded p-0.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
        </button>
        {variant === "popover" && onDetach && (
          <button
            type="button"
            title="悬浮"
            aria-label="切换为悬浮窗口"
            onClick={onDetach}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
          >
            <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
            <span>悬浮</span>
          </button>
        )}
        {variant === "floating" && onClose && (
          <button
            type="button"
            title="关闭"
            aria-label="关闭悬浮色彩选择器"
            onClick={onClose}
            className="shrink-0 rounded p-0.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
