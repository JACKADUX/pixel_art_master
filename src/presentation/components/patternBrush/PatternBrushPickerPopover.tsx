import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getPatternBrush } from "@/domain/patternBrush/PatternBrushLibrary";
import { ConfirmDialog } from "@/presentation/components/ConfirmDialog";
import { useAppStore } from "@/presentation/stores/appStore";
import { PatternBrushGrid } from "./PatternBrushGrid";

const PANEL_WIDTH = 280;
const PANEL_MAX_HEIGHT = 360;
const GAP = 4;

interface PatternBrushPickerPopoverProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function PatternBrushPickerPopover({
  open,
  anchorRef,
  onClose,
}: PatternBrushPickerPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [renameDraft, setRenameDraft] = useState("");
  const [renameBrushId, setRenameBrushId] = useState<string | null>(null);

  const workspacePath = useAppStore((s) => s.projectsWorkspacePath);
  const library = useAppStore((s) => s.patternBrushLibrary);
  const loading = useAppStore((s) => s.patternBrushLibraryLoading);
  const activePatternBrushId = useAppStore((s) => s.activePatternBrushId);
  const deleteTarget = useAppStore((s) => s.deletePatternBrushTarget);
  const selectPatternBrush = useAppStore((s) => s.selectPatternBrush);
  const requestDeletePatternBrush = useAppStore((s) => s.requestDeletePatternBrush);
  const cancelDeletePatternBrush = useAppStore((s) => s.cancelDeletePatternBrush);
  const confirmDeletePatternBrush = useAppStore((s) => s.confirmDeletePatternBrush);
  const renamePatternBrushAction = useAppStore((s) => s.renamePatternBrushAction);
  const refreshPatternBrushLibrary = useAppStore((s) => s.refreshPatternBrushLibrary);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + GAP;

    if (left + PANEL_WIDTH > window.innerWidth - GAP) {
      left = window.innerWidth - PANEL_WIDTH - GAP;
    }
    if (top + PANEL_MAX_HEIGHT > window.innerHeight - GAP) {
      top = rect.top - PANEL_MAX_HEIGHT - GAP;
    }
    if (left < GAP) left = GAP;
    if (top < GAP) top = GAP;

    setPosition({ top, left });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    void refreshPatternBrushLibrary();
  }, [open, updatePosition, refreshPatternBrushLibrary]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (deleteTarget) return;
      if (e.key === "Escape") onClose();
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (useAppStore.getState().deletePatternBrushTarget) return;
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
  }, [anchorRef, deleteTarget, onClose, open, updatePosition]);

  useEffect(() => {
    if (!open) {
      setRenameBrushId(null);
      setRenameDraft("");
      return;
    }
    const id = activePatternBrushId;
    if (!id || !library) return;
    const brush = getPatternBrush(library, id);
    if (brush) {
      setRenameBrushId(id);
      setRenameDraft(brush.title);
    }
  }, [open, activePatternBrushId, library]);

  const commitRename = useCallback(() => {
    if (!renameBrushId || !renameDraft.trim()) return;
    void renamePatternBrushAction(renameBrushId, renameDraft.trim());
  }, [renameBrushId, renameDraft, renamePatternBrushAction]);

  const handleBeginRename = (id: string, title: string) => {
    setRenameBrushId(id);
    setRenameDraft(title);
  };

  if (!open && !deleteTarget) return null;

  return createPortal(
    <>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="图案笔刷库"
          className="fixed z-50 flex flex-col overflow-hidden rounded border border-zinc-700 bg-zinc-900 shadow-xl"
          style={{
            top: position.top,
            left: position.left,
            width: PANEL_WIDTH,
            maxHeight: PANEL_MAX_HEIGHT,
          }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-3 py-2">
            <h3 className="text-sm font-medium text-zinc-200">图案笔刷</h3>
            <span className="text-[10px] text-zinc-500">Ctrl+B 从选区创建</span>
          </div>

          {!workspacePath ? (
            <p className="p-3 text-xs text-zinc-500">请先选择项目文件夹</p>
          ) : loading || !library ? (
            <p className="p-3 text-xs text-zinc-500">加载中…</p>
          ) : (
            <>
              {renameBrushId && (
                <div className="shrink-0 border-b border-zinc-800 px-3 py-2">
                  <label className="flex flex-col gap-1 text-xs text-zinc-400">
                    重命名
                    <input
                      type="text"
                      value={renameDraft}
                      onChange={(e) => setRenameDraft(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          commitRename();
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-zinc-200 outline-none focus:border-blue-500"
                    />
                  </label>
                </div>
              )}
              <PatternBrushGrid
                library={library}
                workspacePath={workspacePath}
                activePatternBrushId={activePatternBrushId}
                onSelectBrush={(id) => void selectPatternBrush(id)}
                onRequestDeleteBrush={requestDeletePatternBrush}
                onRenameBrush={handleBeginRename}
              />
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除图案笔刷"
        message={`确定删除「${deleteTarget?.title ?? ""}」？此操作不可撤销。`}
        confirmLabel="删除"
        danger
        onConfirm={() => void confirmDeletePatternBrush()}
        onCancel={cancelDeletePatternBrush}
      />
    </>,
    document.body,
  );
}
