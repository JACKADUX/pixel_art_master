import { useCallback, useEffect, useRef, useState } from "react";
import type { BoardPosition } from "@/domain/pixelCanvas/PixelCanvas";
import { CANVAS_TOOL_OVERLAY_Z_INDEX } from "@/domain/viewport/FloatingPanelStack";
import { ConfirmDialog } from "@/presentation/components/ConfirmDialog";
import { focusCanvasKeyboard } from "../utils/canvasKeyboardFocus";
import { useAppStore } from "../stores/appStore";

const CLICK_MOVE_THRESHOLD_PX = 3;

interface DragSession {
  canvasId: string;
  startClientX: number;
  startClientY: number;
  startBoardPosition: BoardPosition;
  dragged: boolean;
  historyRecorded: boolean;
}

interface DeleteTarget {
  id: string;
  name: string;
}

interface CanvasBoardToolOverlayProps {
  boardLayouts: Array<{
    canvasId: string;
    name: string;
    left: number;
    top: number;
    displayWidth: number;
    displayHeight: number;
    isActive: boolean;
  }>;
  zoom: number;
}

export function CanvasBoardToolOverlay({
  boardLayouts,
  zoom,
}: CanvasBoardToolOverlayProps) {
  const addCanvas = useAppStore((s) => s.addCanvas);
  const removeCanvas = useAppStore((s) => s.removeCanvas);
  const duplicateCanvas = useAppStore((s) => s.duplicateCanvas);
  const beginCanvasBoardMove = useAppStore((s) => s.beginCanvasBoardMove);
  const previewCanvasOnBoard = useAppStore((s) => s.previewCanvasOnBoard);
  const setActiveCanvas = useAppStore((s) => s.setActiveCanvas);

  const dragSessionRef = useRef<DragSession | null>(null);
  const [draggingCanvasId, setDraggingCanvasId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const finishDrag = useCallback(() => {
    dragSessionRef.current = null;
    setDraggingCanvasId(null);
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const session = dragSessionRef.current;
      if (!session) return;
      const dx = e.clientX - session.startClientX;
      const dy = e.clientY - session.startClientY;
      const moved =
        Math.abs(dx) > CLICK_MOVE_THRESHOLD_PX || Math.abs(dy) > CLICK_MOVE_THRESHOLD_PX;

      if (!session.dragged && moved) {
        session.dragged = true;
        if (!session.historyRecorded) {
          beginCanvasBoardMove();
          session.historyRecorded = true;
        }
      }

      if (!session.dragged) return;

      previewCanvasOnBoard(session.canvasId, {
        x: Math.round(session.startBoardPosition.x + dx / zoom),
        y: Math.round(session.startBoardPosition.y + dy / zoom),
      });
    };

    const handleUp = () => finishDrag();

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [beginCanvasBoardMove, finishDrag, previewCanvasOnBoard, zoom]);

  const startDrag = (
    e: React.MouseEvent,
    canvasId: string,
    boardPosition: BoardPosition,
  ) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    focusCanvasKeyboard();
    setActiveCanvas(canvasId);
    dragSessionRef.current = {
      canvasId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startBoardPosition: { ...boardPosition },
      dragged: false,
      historyRecorded: false,
    };
    setDraggingCanvasId(canvasId);
  };

  return (
    <>
      {boardLayouts.map((layout) => (
        <div
          key={layout.canvasId}
          className="absolute"
          style={{
            left: layout.left,
            top: layout.top,
            width: layout.displayWidth,
            height: layout.displayHeight,
            zIndex: CANVAS_TOOL_OVERLAY_Z_INDEX,
          }}
        >
          <div
            className={`pointer-events-auto absolute inset-0 border-2 ${
              layout.isActive ? "border-blue-400" : "border-zinc-500/80"
            } ${
              draggingCanvasId === layout.canvasId ? "cursor-grabbing" : "cursor-grab"
            }`}
            onMouseDown={(e) => {
              const canvas = useAppStore.getState().project?.board.canvases.find(
                (entry) => entry.id === layout.canvasId,
              );
              if (!canvas) return;
              startDrag(e, layout.canvasId, canvas.boardPosition);
            }}
          />
          <div
            className="pointer-events-auto absolute -top-7 left-0 flex items-center gap-1 rounded bg-zinc-900/90 px-1.5 py-0.5 text-[11px] text-zinc-200"
          >
            <button
              type="button"
              className="max-w-[120px] truncate hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCanvas(layout.canvasId);
              }}
            >
              {layout.name}
            </button>
            <button
              type="button"
              className="text-zinc-400 hover:text-white"
              title="复制画板"
              onClick={(e) => {
                e.stopPropagation();
                duplicateCanvas(layout.canvasId);
              }}
            >
              +
            </button>
            {boardLayouts.length > 1 && (
              <button
                type="button"
                className="text-zinc-400 hover:text-red-300"
                title="删除画板"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget({ id: layout.canvasId, name: layout.name });
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        className="pointer-events-auto absolute bottom-4 right-4 rounded bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-100 hover:bg-zinc-800"
        style={{ zIndex: CANVAS_TOOL_OVERLAY_Z_INDEX + 1 }}
        onClick={(e) => {
          e.stopPropagation();
          addCanvas();
        }}
      >
        新增画板
      </button>
      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除画板"
        message={
          deleteTarget
            ? `确定要删除画板「${deleteTarget.name}」吗？此操作可通过撤销恢复。`
            : ""
        }
        confirmLabel="删除"
        danger
        onConfirm={() => {
          if (deleteTarget) {
            removeCanvas(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
