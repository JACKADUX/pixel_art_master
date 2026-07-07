import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { allCanvasSizePresets } from "@/domain/canvas/CanvasSizePresetOperations";
import { useAppStore } from "../stores/appStore";

export function CanvasBoardSizePresetMenu() {
  const project = useAppStore((s) => s.project);
  const appSettings = useAppStore((s) => s.appSettings);
  const applyCanvasSize = useAppStore((s) => s.applyCanvasSize);

  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const presets = useMemo(
    () => allCanvasSizePresets(appSettings.customCanvasSizePresets),
    [appSettings.customCanvasSizePresets],
  );

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
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
  }, [open, updatePosition]);

  if (!project) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded border border-zinc-600 bg-zinc-800 px-3 py-1 text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-700"
      >
        预设尺寸
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[70] min-w-[12rem] rounded border border-zinc-600 bg-zinc-900 p-2 shadow-xl"
            style={{ top: position.top, left: position.left }}
          >
            <p className="mb-2 px-1 text-[11px] text-zinc-500">选择预设应用到活动画板</p>
            <div className="flex max-h-56 flex-col gap-1 overflow-y-auto">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    applyCanvasSize(preset.width, preset.height);
                    setOpen(false);
                  }}
                  className="rounded px-2 py-1.5 text-left text-xs text-zinc-200 hover:bg-zinc-800"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
