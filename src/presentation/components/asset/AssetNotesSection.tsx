import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type AssetNotesModalMode = "view" | "edit";

interface AssetNotesSectionProps {
  value: string;
  onSave: (value: string) => void;
  compact?: boolean;
  label?: string;
  placeholder?: string;
  onOpenFullscreen?: (mode: AssetNotesModalMode) => void;
}

export function AssetNotesSection({
  value,
  onSave,
  compact = true,
  label = "笔记",
  placeholder = "双击编辑笔记（支持 Markdown）…",
  onOpenFullscreen,
}: AssetNotesSectionProps) {
  const [draft, setDraft] = useState(value);
  const [displayValue, setDisplayValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftRef = useRef(draft);
  const valueRef = useRef(value);
  const onSaveRef = useRef(onSave);

  draftRef.current = draft;
  valueRef.current = value;
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!isEditing) {
      setDraft(value);
      setDisplayValue(value);
    }
  }, [value, isEditing]);

  const persistDraft = useCallback(() => {
    const next = draftRef.current;
    if (next === valueRef.current) return next;
    onSaveRef.current(next);
    valueRef.current = next;
    setDisplayValue(next);
    return next;
  }, []);

  const finishEditing = useCallback(() => {
    persistDraft();
    setIsEditing(false);
  }, [persistDraft]);

  useEffect(() => {
    if (!isEditing) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      finishEditing();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [isEditing, finishEditing]);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
  }, [isEditing]);

  const startEditing = () => {
    setDraft(valueRef.current);
    setIsEditing(true);
  };

  const openFullscreen = (mode: AssetNotesModalMode) => {
    if (isEditing) {
      persistDraft();
      setIsEditing(false);
    }
    onOpenFullscreen?.(mode);
  };

  const handleTextareaBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget && containerRef.current?.contains(nextTarget)) return;
    finishEditing();
  };

  const previewClass = compact
    ? "max-h-24 overflow-auto rounded border border-zinc-700 bg-zinc-950 p-2"
    : "min-h-[8rem] overflow-auto rounded border border-zinc-700 bg-zinc-950 p-2";

  const textareaClass = compact
    ? "h-20 w-full resize-none rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500"
    : "min-h-[8rem] w-full resize-y rounded border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500";

  return (
    <div ref={containerRef}>
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className="text-[10px] text-zinc-500">{label}</span>
        {onOpenFullscreen && (
          <div className="flex gap-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => openFullscreen("view")}
              className="rounded border border-zinc-600 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            >
              大屏查看
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => openFullscreen("edit")}
              className="rounded border border-zinc-600 px-1.5 py-0.5 text-[10px] text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
            >
              编辑模式
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleTextareaBlur}
          placeholder={placeholder}
          className={textareaClass}
        />
      ) : (
        <div
          role="button"
          tabIndex={0}
          onDoubleClick={startEditing}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              startEditing();
            }
          }}
          className={`${previewClass} cursor-text`}
          title="双击编辑"
        >
          {displayValue.trim() ? (
            <div className="prose prose-invert prose-xs max-w-none text-zinc-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayValue}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-zinc-600">{placeholder}</p>
          )}
        </div>
      )}
    </div>
  );
}
