import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowsPointingOutIcon } from "@heroicons/react/24/outline";
import { toHexAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import { useAppStore, type ColorSlot } from "@/presentation/stores/appStore";
import { ColorPickerPanel } from "./ColorPickerPanel";

interface ColorPickerPopoverProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  activeSlot: ColorSlot;
  currentColor: PixelColor;
  onChange: (color: PixelColor) => void;
  onClose: () => void;
}

const PANEL_WIDTH = 240;
const PANEL_HEIGHT = 460;
const HEADER_HEIGHT = 28;
const GAP = 8;
const TOTAL_HEIGHT = PANEL_HEIGHT + HEADER_HEIGHT;

function buildTransparentSwatch(color: PixelColor): string {
  return `
    linear-gradient(${toHexAlpha(color)}, ${toHexAlpha(color)}),
    repeating-conic-gradient(#3f3f46 0% 25%, #18181b 0% 50%) 50% / 8px 8px
  `;
}

export function ColorPickerPopover({
  open,
  anchorRef,
  activeSlot,
  currentColor,
  onChange,
  onClose,
}: ColorPickerPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const detachColorPicker = useAppStore((s) => s.detachColorPicker);
  const viewportContainer = useAppStore((s) => s.viewportContainer);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    let left = rect.right + GAP;
    let top = rect.top;

    if (left + PANEL_WIDTH > window.innerWidth - GAP) {
      left = rect.left - PANEL_WIDTH - GAP;
    }
    if (top + TOTAL_HEIGHT > window.innerHeight - GAP) {
      top = window.innerHeight - TOTAL_HEIGHT - GAP;
    }
    if (top < GAP) top = GAP;
    if (left < GAP) left = GAP;

    setPosition({ top, left });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef, onClose, open, updatePosition]);

  const handleDetach = () => {
    const panel = panelRef.current;
    const container = viewportContainer;
    if (panel && container) {
      const panelRect = panel.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      detachColorPicker(activeSlot, {
        x: panelRect.left - containerRect.left,
        y: panelRect.top - containerRect.top,
      });
    } else {
      detachColorPicker(activeSlot, { x: 16, y: 16 });
    }
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="色彩选择器"
      className="fixed z-50 flex flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl"
      style={{ top: position.top, left: position.left, width: PANEL_WIDTH }}
    >
      <div className="flex items-center justify-between border-b border-zinc-700 bg-zinc-800 px-2 text-xs text-zinc-300"
        style={{ height: HEADER_HEIGHT }}
      >
        <span>色彩选择器</span>
        <button
          type="button"
          title="悬浮"
          aria-label="切换为悬浮窗口"
          onClick={handleDetach}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
        >
          <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
          <span>悬浮</span>
        </button>
      </div>
      <ColorPickerPanel currentColor={currentColor} onChange={onChange} />
    </div>,
    document.body,
  );
}

export function ColorSwatchButton({
  color,
  label,
  open,
  onToggle,
  buttonRef,
  className = "",
}: {
  color: PixelColor;
  label: string;
  open: boolean;
  onToggle: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  className?: string;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      title={label}
      aria-label={label}
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={onToggle}
      className={`h-7 w-7 rounded border border-zinc-600 transition hover:border-zinc-400 ${className}`}
      style={{ background: buildTransparentSwatch(color) }}
    />
  );
}
