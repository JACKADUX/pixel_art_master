import {
  ArrowsPointingOutIcon,
  ArrowsRightLeftIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toHexAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import { COLOR_PICKER_HEADER_HEIGHT } from "@/domain/color/ColorPickerLayout";
import { useAppStore } from "@/presentation/stores/appStore";

interface ColorPickerHeaderProps {
  variant: "popover" | "floating";
  currentColor: PixelColor;
  hexInput: string;
  setHexInput: (value: string) => void;
  onCommitHexInput: () => void;
  onDetach?: () => void;
  onClose?: () => void;
  onHeaderMouseDown?: (e: React.MouseEvent) => void;
}

function buildTransparentSwatch(color: PixelColor): string {
  return `
    linear-gradient(${toHexAlpha(color)}, ${toHexAlpha(color)}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

export function ColorPickerHeader({
  variant,
  currentColor,
  hexInput,
  setHexInput,
  onCommitHexInput,
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

  const handleCommitHexInput = () => {
    onCommitHexInput();
  };

  const handleCopyHex = async () => {
    try {
      await navigator.clipboard.writeText(toHexAlpha(currentColor));
    } catch {
      // Clipboard may be unavailable outside secure context.
    }
  };

  const stopHeaderDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

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
      <div className="flex min-w-0 items-center gap-1">
        <div className="flex shrink-0 items-center gap-1">
          <div
            className="h-5 w-5 shrink-0 rounded border border-zinc-600"
            style={{ background: buildTransparentSwatch(currentColor) }}
            aria-hidden
          />
          <input
            type="text"
            value={hexInput}
            onChange={(e) => setHexInput(e.target.value)}
            onBlur={handleCommitHexInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCommitHexInput();
            }}
            onMouseDown={stopHeaderDrag}
            className="h-5 w-[14ch] shrink-0 rounded border border-zinc-700 bg-zinc-900 px-1 font-mono text-[10px] leading-none text-zinc-200 outline-none focus:border-blue-500"
            spellCheck={false}
          />
        </div>
        <button
          type="button"
          title="复制 Hex 值"
          aria-label="复制 Hex 值"
          onClick={() => void handleCopyHex()}
          className="flex shrink-0 items-center rounded p-0.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
          onMouseDown={stopHeaderDrag}
        >
          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          title={layoutLabel}
          aria-label={layoutLabel}
          onClick={toggleOrientation}
          className="flex shrink-0 items-center rounded p-0.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
          onMouseDown={stopHeaderDrag}
        >
          <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
        </button>
        {variant === "popover" && onDetach && (
          <button
            type="button"
            title="悬浮"
            aria-label="切换为悬浮窗口"
            onClick={onDetach}
            className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
            onMouseDown={stopHeaderDrag}
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
            onMouseDown={stopHeaderDrag}
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
