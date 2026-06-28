import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PixelColor } from "@/domain/canvas/PixelColor";
import {
  COLOR_PICKER_HEADER_HEIGHT,
  getDefaultColorPickerPanelWidth,
  getEstimatedColorPickerPanelHeight,
} from "@/domain/color/ColorPickerLayout";
import { useAppStore } from "@/presentation/stores/appStore";
import { ColorPickerView } from "@/presentation/components/color-picker/ColorPickerView";

const GAP = 8;

function clampPosition(
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

/**
 * 色板专用的轻量颜色选择器弹窗。
 * 复用 ColorPickerView，但不接入 appStore 的前景/背景色与「拆离」逻辑。
 */
export function PaletteColorPickerPopover({
  anchorRect,
  currentColor,
  onChange,
  onClose,
}: {
  anchorRect: DOMRect;
  currentColor: PixelColor;
  onChange: (color: PixelColor) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const orientation = useAppStore((s) => s.colorPickerLayoutOrientation);
  const panelWidth = getDefaultColorPickerPanelWidth(orientation);
  const [position, setPosition] = useState(() => {
    const estimatedHeight =
      getEstimatedColorPickerPanelHeight(orientation) + COLOR_PICKER_HEADER_HEIGHT;
    let left = anchorRect.right + GAP;
    if (left + panelWidth > window.innerWidth - GAP) {
      left = anchorRect.left - panelWidth - GAP;
    }
    return clampPosition(left, anchorRect.top, panelWidth, estimatedHeight);
  });

  const clampCurrentPosition = useCallback(() => {
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? panelWidth;
    const height =
      panel?.offsetHeight ??
      getEstimatedColorPickerPanelHeight(orientation) + COLOR_PICKER_HEADER_HEIGHT;
    setPosition((prev) => clampPosition(prev.left, prev.top, width, height));
  }, [orientation, panelWidth]);

  useLayoutEffect(() => {
    clampCurrentPosition();
  }, [clampCurrentPosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handlePointerDown = (e: PointerEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
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
  }, [clampCurrentPosition, onClose]);

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="色彩选择器"
      className="fixed z-[80] flex flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl"
      style={{ top: position.top, left: position.left, width: panelWidth }}
    >
      <ColorPickerView
        currentColor={currentColor}
        onChange={onChange}
        orientation={orientation}
        headerVariant="popover"
        onClose={onClose}
      />
    </div>,
    document.body,
  );
}
