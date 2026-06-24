import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownOnSquareIcon,
  ArrowPathIcon,
  BookmarkSquareIcon,
  EllipsisVerticalIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface PalettePresetActionsMenuProps {
  canUseCurrent: boolean;
  onMerge: () => void;
  onReplace: () => void;
  onOverwrite: () => void;
  onDelete: () => void;
}

export function PalettePresetActionsMenu({
  canUseCurrent,
  onMerge,
  onReplace,
  onOverwrite,
  onDelete,
}: PalettePresetActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeMenu();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      closeMenu();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, closeMenu]);

  const runAction = (action: () => void) => {
    action();
    closeMenu();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="更多操作"
        aria-label="更多操作"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center justify-center rounded border p-1 transition ${
          open
            ? "border-zinc-500 bg-zinc-800 text-zinc-100"
            : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
        }`}
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-0.5 min-w-[160px] rounded border border-zinc-600 bg-zinc-900 py-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(onMerge)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ArrowDownOnSquareIcon className="h-4 w-4 shrink-0 text-zinc-400" />
            <span className="flex-1">合并到色板</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(onReplace)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ArrowPathIcon className="h-4 w-4 shrink-0 text-zinc-400" />
            <span className="flex-1">替换颜色</span>
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={!canUseCurrent}
            onClick={() => runAction(onOverwrite)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <BookmarkSquareIcon className="h-4 w-4 shrink-0 text-zinc-400" />
            <span className="flex-1">用当前色板覆盖</span>
          </button>

          <div className="my-1 border-t border-zinc-700" />

          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(onDelete)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-300 transition hover:bg-red-900/30 hover:text-red-200"
          >
            <TrashIcon className="h-4 w-4 shrink-0" />
            <span className="flex-1">删除</span>
          </button>
        </div>
      )}
    </div>
  );
}
