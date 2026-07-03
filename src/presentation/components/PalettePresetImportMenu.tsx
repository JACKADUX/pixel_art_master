import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

interface PalettePresetImportMenuProps {
  onImportHexFile: () => void;
  onImportImageFile: () => void;
}

export function PalettePresetImportMenu({
  onImportHexFile,
  onImportImageFile,
}: PalettePresetImportMenuProps) {
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
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition ${
          open
            ? "border-zinc-500 bg-zinc-800 text-zinc-100"
            : "border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800"
        }`}
      >
        <ArrowUpTrayIcon className="h-3.5 w-3.5" />
        导入
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-0.5 min-w-[180px] rounded border border-zinc-600 bg-zinc-900 py-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(onImportHexFile)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
          >
            <DocumentTextIcon className="h-4 w-4 shrink-0 text-zinc-400" />
            <span className="flex-1">从 .hex 文件导入</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(onImportImageFile)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
          >
            <PhotoIcon className="h-4 w-4 shrink-0 text-zinc-400" />
            <span className="flex-1">从图片导入（前 256 像素）</span>
          </button>
        </div>
      )}
    </div>
  );
}
