import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TRANSPARENT } from "@/domain/canvas/PixelColor";
import type { ColorEntry } from "@/domain/palette/Palette";
import {
  PALETTE_OKLAB_MAP_MAX_COLORS,
} from "@/domain/palette/PaletteOklabLayout";
import { adaptPanelPositionOnResize } from "@/domain/viewport/FloatingPanelAnchor";
import {
  computeNavigatorResizeFromCorner,
  NAVIGATOR_MAX_SIZE_RATIO,
  NAVIGATOR_RESIZE_CURSORS,
  NAVIGATOR_RESIZE_HANDLE_SIZE,
  type NavigatorPanelBounds,
  type NavigatorResizeCorner,
  type NavigatorResizeStart,
} from "@/domain/viewport/NavigatorPanelResize";
import { PaletteOklabMapView } from "@/presentation/components/PaletteOklabMapView";

const HEADER_HEIGHT = 28;
const PANEL_MARGIN = 12;
const DEFAULT_WIDTH = 240;
const DEFAULT_HEIGHT = 200;
const MIN_WIDTH = 160;
const MIN_HEIGHT = 120;
const RESIZE_HANDLE_SIZE = NAVIGATOR_RESIZE_HANDLE_SIZE;

const RESIZE_CORNERS: NavigatorResizeCorner[] = ["nw", "ne", "sw", "se"];

const RESIZE_HANDLE_POSITION: Record<NavigatorResizeCorner, string> = {
  nw: "left-0 top-0",
  ne: "right-0 top-0",
  sw: "bottom-0 left-0",
  se: "bottom-0 right-0",
};

const PANEL_EDGE_ANCHOR = { horizontal: "right" as const, vertical: "top" as const };

function computeInitialBounds(containerWidth: number, containerHeight: number): NavigatorPanelBounds {
  const width = Math.min(DEFAULT_WIDTH, Math.max(MIN_WIDTH, containerWidth - PANEL_MARGIN * 2));
  const height = Math.min(DEFAULT_HEIGHT, Math.max(MIN_HEIGHT, containerHeight - PANEL_MARGIN * 2));
  return {
    x: Math.max(0, containerWidth - width - PANEL_MARGIN),
    y: PANEL_MARGIN,
    width,
    height,
  };
}

function resolveResizeConstraints(containerSize: { width: number; height: number }) {
  return {
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    maxWidth: Math.max(MIN_WIDTH, containerSize.width * NAVIGATOR_MAX_SIZE_RATIO),
    maxHeight: Math.max(MIN_HEIGHT, containerSize.height * NAVIGATOR_MAX_SIZE_RATIO),
  };
}

interface ImagePaletteFloatingPanelProps {
  colors: readonly ColorEntry[];
  totalColorCount: number;
  containerSize: { width: number; height: number };
  onClose: () => void;
}

export function ImagePaletteFloatingPanel({
  colors,
  totalColorCount,
  containerSize,
  onClose,
}: ImagePaletteFloatingPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<(NavigatorResizeStart & { corner: NavigatorResizeCorner }) | null>(
    null,
  );
  const isResizingRef = useRef(false);

  const [bounds, setBounds] = useState<NavigatorPanelBounds>(() =>
    computeInitialBounds(containerSize.width, containerSize.height),
  );

  const mapColors = useMemo(
    () => colors.slice(0, PALETTE_OKLAB_MAP_MAX_COLORS),
    [colors],
  );
  const isTruncated = totalColorCount > PALETTE_OKLAB_MAP_MAX_COLORS;

  useEffect(() => {
    setBounds((prev) => {
      const adapted = adaptPanelPositionOnResize(
        { x: prev.x, y: prev.y },
        { width: prev.width, height: prev.height },
        PANEL_EDGE_ANCHOR,
        containerSize,
      );
      return { ...prev, x: adapted.x, y: adapted.y };
    });
  }, [containerSize.width, containerSize.height]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const start = resizeStartRef.current;
      if (!isResizingRef.current || !start) return;

      const next = computeNavigatorResizeFromCorner(
        start.corner,
        start,
        event.clientX,
        event.clientY,
        resolveResizeConstraints(containerSize),
      );
      setBounds(next);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      resizeStartRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [containerSize]);

  const handleResizeMouseDown = useCallback(
    (corner: NavigatorResizeCorner, event: React.MouseEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      isResizingRef.current = true;
      resizeStartRef.current = {
        corner,
        clientX: event.clientX,
        clientY: event.clientY,
        bounds,
      };
    },
    [bounds],
  );

  const panelHeight = bounds.height;

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto absolute z-10 flex flex-col overflow-hidden rounded border-2 border-zinc-600 bg-zinc-900 shadow-xl"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: panelHeight,
      }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div
        className="flex shrink-0 select-none items-center justify-between border-b border-zinc-600 bg-zinc-800 px-2 text-xs text-zinc-300"
        style={{ height: HEADER_HEIGHT }}
      >
        <span>色板 ({totalColorCount})</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-1.5 py-0.5 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
        >
          ✕
        </button>
      </div>

      {isTruncated && (
        <p className="shrink-0 px-2 py-0.5 text-[10px] text-amber-500/90">
          色域图仅展示前 {PALETTE_OKLAB_MAP_MAX_COLORS} 色（共 {totalColorCount} 色）
        </p>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {mapColors.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            无可见颜色
          </div>
        ) : (
          <div className="absolute inset-0">
            <PaletteOklabMapView
              colors={mapColors}
              foregroundColor={TRANSPARENT}
              backgroundColor={TRANSPARENT}
              onSelect={() => {}}
              readOnly
              className="h-full"
            />
          </div>
        )}
      </div>

      {RESIZE_CORNERS.map((corner) => (
        <div
          key={corner}
          className={`absolute z-10 ${RESIZE_HANDLE_POSITION[corner]} ${NAVIGATOR_RESIZE_CURSORS[corner]}`}
          style={{
            width: RESIZE_HANDLE_SIZE,
            height: RESIZE_HANDLE_SIZE,
          }}
          onMouseDown={(event) => handleResizeMouseDown(corner, event)}
        />
      ))}
    </div>
  );
}
