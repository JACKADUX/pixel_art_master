import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasResizeEdge } from "@/domain/canvas/CanvasEdgeResizeOperations";
import {
  canvasResizeDeltaFromDrag,
  resizeCanvasFromEdge,
  snapCanvasResizeDelta,
} from "@/domain/canvas/CanvasEdgeResizeOperations";
import type { CanvasSize } from "@/domain/canvas/CanvasSize";
import { formatPixelDimensions } from "@/domain/viewport/OverlayLabelLayout";

import { focusCanvasKeyboard } from "../utils/canvasKeyboardFocus";
import { useAppStore } from "../stores/appStore";

const CLICK_MOVE_THRESHOLD_PX = 3;

interface DragSession {
  edge: CanvasResizeEdge;
  button: number;
  startClientX: number;
  startClientY: number;
  anchorSize: CanvasSize;
  historyRecorded: boolean;
  dragged: boolean;
}

interface CanvasSizeToolOverlayProps {
  canvasLeft: number;
  canvasTop: number;
  displayWidth: number;
  displayHeight: number;
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function CanvasSizeToolOverlay({
  canvasLeft,
  canvasTop,
  displayWidth,
  displayHeight,
  zoom,
  canvasWidth,
  canvasHeight,
}: CanvasSizeToolOverlayProps) {
  const toolSettings = useAppStore((s) => s.toolSettings);
  const pushCanvasResizeHistory = useAppStore((s) => s.pushCanvasResizeHistory);
  const applyCanvasEdgeResize = useAppStore((s) => s.applyCanvasEdgeResize);

  const dragSessionRef = useRef<DragSession | null>(null);
  const [activeEdge, setActiveEdge] = useState<CanvasResizeEdge | null>(null);
  const [previewSize, setPreviewSize] = useState<CanvasSize | null>(null);

  const applyDragDelta = useCallback(
    (session: DragSession, clientX: number, clientY: number, shiftKey: boolean) => {
      const rawDelta =
        session.edge === "right"
          ? canvasResizeDeltaFromDrag(clientX - session.startClientX, zoom)
          : canvasResizeDeltaFromDrag(clientY - session.startClientY, zoom);
      const fixedStep = toolSettings.canvasResizeFixedStep || shiftKey;
      const delta = snapCanvasResizeDelta(
        rawDelta,
        toolSettings.canvasResizeStep,
        fixedStep,
      );
      applyCanvasEdgeResize(session.edge, delta, session.anchorSize);
      setPreviewSize(resizeCanvasFromEdge(session.anchorSize, session.edge, delta));
    },
    [
      applyCanvasEdgeResize,
      toolSettings.canvasResizeFixedStep,
      toolSettings.canvasResizeStep,
      zoom,
    ],
  );

  const handleHandleMouseDown = (
    e: React.MouseEvent,
    edge: CanvasResizeEdge,
  ) => {
    if (e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    e.stopPropagation();
    focusCanvasKeyboard();

    dragSessionRef.current = {
      edge,
      button: e.button,
      startClientX: e.clientX,
      startClientY: e.clientY,
      anchorSize: { width: canvasWidth, height: canvasHeight },
      historyRecorded: false,
      dragged: false,
    };
    setActiveEdge(edge);
    setPreviewSize({ width: canvasWidth, height: canvasHeight });
  };

  useEffect(() => {
    if (!activeEdge) return;

    const handleMouseMove = (e: MouseEvent) => {
      const current = dragSessionRef.current;
      if (!current) return;

      const movedX = Math.abs(e.clientX - current.startClientX);
      const movedY = Math.abs(e.clientY - current.startClientY);
      const moved = Math.max(movedX, movedY);

      if (!current.dragged && moved >= CLICK_MOVE_THRESHOLD_PX) {
        current.dragged = true;
        if (!current.historyRecorded) {
          pushCanvasResizeHistory();
          current.historyRecorded = true;
        }
      }

      if (current.dragged) {
        applyDragDelta(current, e.clientX, e.clientY, e.shiftKey);
      }
    };

    const handleMouseUp = () => {
      const current = dragSessionRef.current;
      if (!current) return;

      if (!current.dragged) {
        pushCanvasResizeHistory();
        const step =
          current.button === 2
            ? -toolSettings.canvasResizeStep
            : toolSettings.canvasResizeStep;
        applyCanvasEdgeResize(current.edge, step);
      }

      dragSessionRef.current = null;
      setActiveEdge(null);
      setPreviewSize(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    activeEdge,
    applyCanvasEdgeResize,
    applyDragDelta,
    pushCanvasResizeHistory,
    toolSettings.canvasResizeStep,
  ]);

  const sizeLabel = previewSize ?? { width: canvasWidth, height: canvasHeight };

  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: canvasLeft,
        top: canvasTop,
        width: displayWidth,
        height: displayHeight,
        zIndex: 5000,
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-sm ring-2 ring-blue-500/70 ring-offset-0"
        style={{ boxShadow: "inset 0 0 0 1px rgba(59,130,246,0.35)" }}
      />

      <div
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900/90 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-blue-300 shadow-sm ring-1 ring-blue-500/40"
      >
        {formatPixelDimensions(sizeLabel.width, sizeLabel.height)}
      </div>

      <div
        role="separator"
        aria-label="扩展画布宽度"
        className="pointer-events-auto absolute top-1/2 h-8 w-2 -translate-y-1/2 cursor-ew-resize rounded-sm border border-white bg-blue-500 shadow"
        style={{ left: displayWidth, transform: "translate(-50%, -50%)" }}
        onMouseDown={(e) => handleHandleMouseDown(e, "right")}
        onContextMenu={(e) => e.preventDefault()}
      />

      <div
        role="separator"
        aria-label="扩展画布高度"
        className="pointer-events-auto absolute left-1/2 h-2 w-8 -translate-x-1/2 cursor-ns-resize rounded-sm border border-white bg-blue-500 shadow"
        style={{ top: displayHeight, transform: "translate(-50%, -50%)" }}
        onMouseDown={(e) => handleHandleMouseDown(e, "bottom")}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}
