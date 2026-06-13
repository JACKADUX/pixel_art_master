import { useEffect, useRef } from "react";
import { getDefaultColorPickerPanelWidth } from "@/domain/color/ColorPickerLayout";
import { useAppStore } from "@/presentation/stores/appStore";
import { ColorPickerHeader } from "./ColorPickerHeader";
import { ColorPickerPanel } from "./ColorPickerPanel";

export function FloatingColorPickerPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const isDraggingRef = useRef(false);

  const project = useAppStore((s) => s.project);
  const floatingColorPicker = useAppStore((s) => s.floatingColorPicker);
  const orientation = useAppStore((s) => s.colorPickerLayoutOrientation);
  const foregroundColor = useAppStore((s) => s.foregroundColor);
  const backgroundColor = useAppStore((s) => s.backgroundColor);
  const setColorSlot = useAppStore((s) => s.setColorSlot);
  const setFloatingColorPickerPosition = useAppStore(
    (s) => s.setFloatingColorPickerPosition,
  );
  const setFloatingColorPickerPanelSize = useAppStore(
    (s) => s.setFloatingColorPickerPanelSize,
  );
  const closeFloatingColorPicker = useAppStore((s) => s.closeFloatingColorPicker);

  const panelWidth = getDefaultColorPickerPanelWidth(orientation);

  const activeColor =
    floatingColorPicker.activeSlot === "background"
      ? backgroundColor
      : foregroundColor;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !floatingColorPicker.visible) return;

    const updateSize = () => {
      setFloatingColorPickerPanelSize(panel.offsetWidth, panel.offsetHeight);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(panel);
    return () => observer.disconnect();
  }, [
    floatingColorPicker.visible,
    orientation,
    setFloatingColorPickerPanelSize,
  ]);

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
        width: panelWidth,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <ColorPickerHeader
        variant="floating"
        onClose={closeFloatingColorPicker}
        onHeaderMouseDown={handleHeaderMouseDown}
      />
      <ColorPickerPanel
        currentColor={activeColor}
        onChange={(color) => setColorSlot(floatingColorPicker.activeSlot, color)}
        orientation={orientation}
      />
    </div>
  );
}
