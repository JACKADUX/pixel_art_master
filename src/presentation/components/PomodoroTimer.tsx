import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowPathIcon,
  PauseIcon,
  PlayIcon,
} from "../icons/ActionIcons";
import { usePomodoroTimer } from "../hooks/usePomodoroTimer";
import { clampPomodoroMinutes } from "@/domain/pomodoro/PomodoroTimer";

function PomodoroIconButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200"
    >
      {children}
    </button>
  );
}

function parseMinutesInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return clampPomodoroMinutes(Number(trimmed));
}

export function PomodoroTimer() {
  const { displayTime, totalMinutes, status, start, pause, reset, setDurationMinutes } =
    usePomodoroTimer();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commitEdit = useCallback(() => {
    const minutes = parseMinutesInput(draft);
    if (minutes !== null) {
      setDurationMinutes(minutes);
    }
    setEditing(false);
  }, [draft, setDurationMinutes]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
  }, []);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleDoubleClick = () => {
    setDraft(String(totalMinutes));
    setEditing(true);
  };

  const handlePlayPause = () => {
    if (status === "running") {
      pause();
    } else {
      start();
    }
  };

  return (
    <div className="flex items-center gap-0.5" title="番茄钟">
      <PomodoroIconButton
        title={status === "running" ? "暂停" : "开始"}
        onClick={handlePlayPause}
      >
        {status === "running" ? (
          <PauseIcon className="h-3.5 w-3.5" />
        ) : (
          <PlayIcon className="h-3.5 w-3.5" />
        )}
      </PomodoroIconButton>
      <PomodoroIconButton title="重置" onClick={reset}>
        <ArrowPathIcon className="h-3.5 w-3.5" />
      </PomodoroIconButton>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          className="w-10 rounded border border-zinc-600 bg-zinc-800 px-1 py-0 text-center text-xs tabular-nums text-zinc-200 outline-none focus:border-blue-500"
          title="分钟数"
        />
      ) : (
        <button
          type="button"
          onDoubleClick={handleDoubleClick}
          title="双击修改时长（分钟）"
          className="w-10 rounded px-1 py-0 text-center tabular-nums text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
        >
          {displayTime}
        </button>
      )}
    </div>
  );
}
