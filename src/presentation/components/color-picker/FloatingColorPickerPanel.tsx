import { useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useAppStore } from "@/presentation/stores/appStore";
import { ColorPickerPanel } from "./ColorPickerPanel";

const HEADER_HEIGHT = 28;
const PANEL_WIDTH = 240;

export function FloatingColorPickerPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const isDraggingRef = useRef(false);

  const project = useAppStore((s) => s.project);
  const floatingColorPicker = useAppStore((s) => s.floatingColorPicker);
  const foregroundColor = useAppStore((s) => s.foregroundColor);
  const backgroundColor = useAppStore((s) => s.backgroundColor);
  const setColorSlot = useAppStore((s) => s.setColorSlot);
  const setFloatingColorPickerPosition = useAppStore(
    (s) => s.setFloatingColorPickerPosition,
  );
  const setFloatingColorPickerPanelHeight = useAppStore(
    (s) => s.setFloatingColorPickerPanelHeight,
  );
  const closeFloatingColorPicker = useAppStore((s) => s.closeFloatingColorPicker);

  const activeColor =
    floatingColorPicker.activeSlot === "background"
      ? backgroundColor
      : foregroundColor;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !floatingColorPicker.visible) return;

    const updateHeight = () => {
      setFloatingColorPickerPanelHeight(panel.offsetHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [floatingColorPicker.visible, setFloatingColorPickerPanelHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setFloatingColorPickerPosition(
        dragStartRef.current.posX + dx,
        dragStartRef.current.posY + dy,
      );
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setFloatingColorPickerPosition]);

  if (!floatingColorPicker.visible || !project) return null;

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: floatingColorPicker.position.x,
      posY: floatingColorPicker.position.y,
    };
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="悬浮色彩选择器"
      className="pointer-events-auto absolute z-40 flex flex-col overflow-hidden rounded-lg border-2 border-zinc-600 bg-zinc-900 shadow-xl"
      style={{
        left: floatingColorPicker.position.x,
        top: floatingColorPicker.position.y,
        width: PANEL_WIDTH,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className="flex cursor-move select-none items-center justify-between gap-2 border-b-2 border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-300"
        style={{ height: HEADER_HEIGHT }}
        onMouseDown={handleHeaderMouseDown}
      >
        <span className="shrink-0">色彩选择器</span>
        <button
          type="button"
          title="关闭"
          aria-label="关闭悬浮色彩选择器"
          onClick={closeFloatingColorPicker}
          className="shrink-0 rounded p-0.5 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
      <ColorPickerPanel
        currentColor={activeColor}
        onChange={(color) => setColorSlot(floatingColorPicker.activeSlot, color)}
      />
    </div>
  );
}
