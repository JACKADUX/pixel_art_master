import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toHexAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import {
  COLOR_PICKER_HEADER_HEIGHT,
  getDefaultColorPickerPanelWidth,
  getEstimatedColorPickerPanelHeight,
} from "@/domain/color/ColorPickerLayout";
import { useAppStore, type ColorSlot } from "@/presentation/stores/appStore";
import { ColorPickerHeader } from "./ColorPickerHeader";
import { ColorPickerPanel } from "./ColorPickerPanel";

interface ColorPickerPopoverProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  activeSlot: ColorSlot;
  currentColor: PixelColor;
  onChange: (color: PixelColor) => void;
  onClose: () => void;
}

const GAP = 8;

function clampPopoverPosition(
  left: number,
  top: number,
  width: number,
  height: number,
): { left: number; top: number } {
  let nextLeft = left;
  let nextTop = top;

  if (nextLeft + width > window.innerWidth - GAP) {
    nextLeft = Math.max(GAP, window.innerWidth - width - GAP);
  }
  if (nextTop + height > window.innerHeight - GAP) {
    nextTop = Math.max(GAP, window.innerHeight - height - GAP);
  }
  if (nextTop < GAP) nextTop = GAP;
  if (nextLeft < GAP) nextLeft = GAP;

  return { left: nextLeft, top: nextTop };
}

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
  const hasPositionedRef = useRef(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const detachColorPicker = useAppStore((s) => s.detachColorPicker);
  const viewportContainer = useAppStore((s) => s.viewportContainer);
  const orientation = useAppStore((s) => s.colorPickerLayoutOrientation);
  const panelWidth = getDefaultColorPickerPanelWidth(orientation);

  const anchorToPosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const estimatedHeight =
      getEstimatedColorPickerPanelHeight(orientation) + COLOR_PICKER_HEADER_HEIGHT;
    let left = rect.right + GAP;
    let top = rect.top;

    if (left + panelWidth > window.innerWidth - GAP) {
      left = rect.left - panelWidth - GAP;
    }

    setPosition(clampPopoverPosition(left, top, panelWidth, estimatedHeight));
  }, [anchorRef, orientation, panelWidth]);

  const clampCurrentPosition = useCallback(() => {
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? panelWidth;
    const height =
      panel?.offsetHeight ??
      getEstimatedColorPickerPanelHeight(orientation) + COLOR_PICKER_HEADER_HEIGHT;
    setPosition((prev) => clampPopoverPosition(prev.left, prev.top, width, height));
  }, [orientation, panelWidth]);

  useLayoutEffect(() => {
    if (!open) {
      hasPositionedRef.current = false;
      return;
    }
    if (!hasPositionedRef.current) {
      anchorToPosition();
      hasPositionedRef.current = true;
    }
  }, [open, anchorToPosition]);

  useLayoutEffect(() => {
    if (!open || !hasPositionedRef.current) return;
    clampCurrentPosition();
  }, [open, orientation, clampCurrentPosition]);

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
    window.addEventListener("resize", clampCurrentPosition);
    window.addEventListener("scroll", clampCurrentPosition, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", clampCurrentPosition);
      window.removeEventListener("scroll", clampCurrentPosition, true);
    };
  }, [anchorRef, clampCurrentPosition, onClose, open]);

  const handleDetach = () => {
    const panel = panelRef.current;
    const container = viewportContainer;
    if (panel && container) {
      const panelRect = panel.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      detachColorPicker(
        activeSlot,
        {
          x: panelRect.left - containerRect.left,
          y: panelRect.top - containerRect.top,
        },
        { width: panelRect.width, height: panelRect.height },
      );
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
      style={{ top: position.top, left: position.left, width: panelWidth }}
    >
      <ColorPickerHeader variant="popover" onDetach={handleDetach} />
      <ColorPickerPanel
        currentColor={currentColor}
        onChange={onChange}
        orientation={orientation}
      />
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
