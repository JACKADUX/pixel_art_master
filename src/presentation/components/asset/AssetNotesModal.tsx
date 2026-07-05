import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useBackdropDismiss } from "@/presentation/hooks/useBackdropDismiss";
import type { AssetNotesModalMode } from "./AssetNotesSection";

interface AssetNotesModalProps {
  open: boolean;
  title: string;
  value: string;
  initialMode: AssetNotesModalMode;
  onSave: (value: string) => void;
  onClose: (savedValue: string) => void;
}

function toggleButtonClass(active: boolean): string {
  return `rounded border px-2.5 py-1 text-xs font-medium transition ${
    active
      ? "border-blue-500 bg-blue-500/15 text-blue-300"
      : "border-zinc-600 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
  }`;
}

export function AssetNotesModal({
  open,
  title,
  value,
  initialMode,
  onSave,
  onClose,
}: AssetNotesModalProps) {
  const [mode, setMode] = useState<AssetNotesModalMode>(initialMode);
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(draft);
  const savedValueRef = useRef(value);
  const onSaveRef = useRef(onSave);
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);

  draftRef.current = draft;
  onSaveRef.current = onSave;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setMode(initialMode);
      setDraft(value);
      savedValueRef.current = value;
    } else if (
      open &&
      value !== savedValueRef.current &&
      draftRef.current === savedValueRef.current
    ) {
      setDraft(value);
      savedValueRef.current = value;
    }
    wasOpenRef.current = open;
  }, [open, initialMode, value]);

  const persistDraft = useCallback(() => {
    const next = draftRef.current;
    if (next === savedValueRef.current) return;
    onSaveRef.current(next);
    savedValueRef.current = next;
  }, []);

  const handleClose = useCallback(() => {
    persistDraft();
    onCloseRef.current(draftRef.current);
  }, [persistDraft]);

  const switchToView = () => {
    persistDraft();
    setMode("view");
  };

  const switchToEdit = () => {
    setMode("edit");
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose]);

  const backdropProps = useBackdropDismiss<HTMLDivElement>(handleClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 p-4"
      {...backdropProps}
    >
      <div className="flex h-[90vh] w-[95vw] max-w-6xl flex-col overflow-hidden rounded-lg border border-zinc-600 bg-zinc-900 shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-4 py-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-zinc-100">{title}</h3>
            <p className="text-[10px] text-zinc-500">支持 Markdown · Esc 或点击外部关闭并保存</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={switchToView}
              className={toggleButtonClass(mode === "view")}
            >
              大屏查看
            </button>
            <button
              type="button"
              onClick={switchToEdit}
              className={toggleButtonClass(mode === "edit")}
            >
              编辑模式
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden p-4">
          {mode === "view" ? (
            <div className="h-full overflow-auto rounded border border-zinc-700 bg-zinc-950 p-4">
              {draft.trim() ? (
                <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-zinc-600">暂无内容</p>
              )}
            </div>
          ) : (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={persistDraft}
              placeholder="输入 Markdown 内容…"
              className="h-full w-full resize-none rounded border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-blue-500"
            />
          )}
        </div>
      </div>
    </div>
  );
}
