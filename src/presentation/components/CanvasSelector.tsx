import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
import { getActiveCanvas } from "@/domain/project/Project";
import { useAppStore } from "../stores/appStore";

export function CanvasSelector() {
  const project = useAppStore((s) => s.project);
  const setActiveCanvas = useAppStore((s) => s.setActiveCanvas);
  const renameCanvas = useAppStore((s) => s.renameCanvas);
  const addCanvas = useAppStore((s) => s.addCanvas);

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [editingCanvasId, setEditingCanvasId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeCanvas = project ? getActiveCanvas(project) : null;
  const isEditingTrigger = editingCanvasId !== null && editingCanvasId === activeCanvas?.id;

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 2,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  const startRename = useCallback((canvasId: string, name: string) => {
    setOpen(false);
    setEditingCanvasId(canvasId);
    setEditName(name);
  }, []);

  const commitRename = useCallback(() => {
    if (editingCanvasId && editName.trim()) {
      renameCanvas(editingCanvasId, editName);
    }
    setEditingCanvasId(null);
    setEditName("");
  }, [editName, editingCanvasId, renameCanvas]);

  const cancelRename = useCallback(() => {
    setEditingCanvasId(null);
    setEditName("");
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!isEditingTrigger) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [isEditingTrigger]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      closeMenu();
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
  }, [closeMenu, open, updatePosition]);

  if (!project || !activeCanvas) return null;

  return (
    <div className="shrink-0 border-b border-zinc-700 p-2">
      <div className="flex items-center gap-1.5">
        {isEditingTrigger ? (
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") cancelRename();
            }}
            className="min-w-0 flex-1 rounded border border-blue-500 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 outline-none"
          />
        ) : (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            onDoubleClick={(e) => {
              e.preventDefault();
              startRename(activeCanvas.id, activeCanvas.name);
            }}
            className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-left text-xs text-zinc-200 hover:border-zinc-500 hover:bg-zinc-700"
            title="单击切换画板，双击重命名"
          >
            <span className="truncate">{activeCanvas.name}</span>
            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          </button>
        )}
        <button
          type="button"
          onClick={() => addCanvas()}
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded border border-zinc-600 bg-zinc-800 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700 hover:text-white"
          title="新增画板"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[70] max-h-48 overflow-y-auto rounded border border-zinc-600 bg-zinc-900 py-1 shadow-xl"
            style={{
              top: position.top,
              left: position.left,
              width: Math.max(position.width, 160),
            }}
          >
            {project.board.canvases.map((canvas) => {
              const isActive = canvas.id === project.board.activeCanvasId;
              const isEditingItem = editingCanvasId === canvas.id;

              if (isEditingItem && !isEditingTrigger) {
                return (
                  <div key={canvas.id} className="px-2 py-1">
                    <input
                      type="text"
                      value={editName}
                      autoFocus
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") cancelRename();
                      }}
                      className="w-full rounded border border-blue-500 bg-zinc-800 px-2 py-1 text-xs text-zinc-100 outline-none"
                    />
                  </div>
                );
              }

              return (
                <button
                  key={canvas.id}
                  type="button"
                  onClick={() => {
                    setActiveCanvas(canvas.id);
                    closeMenu();
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    startRename(canvas.id, canvas.name);
                  }}
                  className={`block w-full truncate px-3 py-1.5 text-left text-xs transition ${
                    isActive
                      ? "bg-blue-600/20 text-blue-300"
                      : "text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {canvas.name}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
