import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toHex, type PixelColor } from "@/domain/canvas/PixelColor";
import { ColorPickerPanel } from "./ColorPickerPanel";

interface ColorPickerPopoverProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  currentColor: PixelColor;
  onChange: (color: PixelColor) => void;
  onClose: () => void;
}

const PANEL_WIDTH = 240;
const PANEL_HEIGHT = 420;
const GAP = 8;

export function ColorPickerPopover({
  open,
  anchorRef,
  currentColor,
  onChange,
  onClose,
}: ColorPickerPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    let left = rect.right + GAP;
    let top = rect.top;

    if (left + PANEL_WIDTH > window.innerWidth - GAP) {
      left = rect.left - PANEL_WIDTH - GAP;
    }
    if (top + PANEL_HEIGHT > window.innerHeight - GAP) {
      top = window.innerHeight - PANEL_HEIGHT - GAP;
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

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="色彩选择器"
      className="fixed z-50 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl"
      style={{ top: position.top, left: position.left }}
    >
      <ColorPickerPanel currentColor={currentColor} onChange={onChange} />
    </div>,
    document.body,
  );
}

export function ColorSwatchButton({
  color,
  open,
  onToggle,
  buttonRef,
}: {
  color: PixelColor;
  open: boolean;
  onToggle: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      title="当前颜色"
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={onToggle}
      className="h-10 w-10 rounded border-2 border-zinc-600 transition hover:border-zinc-400"
      style={{ backgroundColor: toHex(color) }}
    />
  );
}
