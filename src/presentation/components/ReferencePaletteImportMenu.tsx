import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { getActiveLayer } from "@/domain/project/Project";
import { isReferenceLayer } from "@/domain/layer/LayerTypeGuards";
import type { ReferenceColorImportScope } from "@/application/use-cases/ImportReferenceLayerColorsToPalette";
import { useAppStore } from "../stores/appStore";

export function ReferencePaletteImportMenu() {
  const project = useAppStore((s) => s.project);
  const importReferenceLayerColors = useAppStore((s) => s.importReferenceLayerColors);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLayer = project ? getActiveLayer(project) : null;
  const canImport =
    activeLayer &&
    isReferenceLayer(activeLayer) &&
    activeLayer.imageData !== null;

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      closeMenu();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, closeMenu]);

  if (!canImport) return null;

  const handleImport = (scope: ReferenceColorImportScope) => {
    void importReferenceLayerColors(scope);
    closeMenu();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="从当前参考层导入颜色"
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[10px] transition ${
          open
            ? "border-zinc-500 bg-zinc-800 text-zinc-100"
            : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
        }`}
      >
        <span>导入参考层</span>
        <ChevronDownIcon className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-0.5 min-w-[120px] rounded border border-zinc-600 bg-zinc-900 py-1 shadow-xl">
          <button
            type="button"
            onClick={() => handleImport("crop")}
            className="flex w-full px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
          >
            选框颜色
          </button>
          <button
            type="button"
            onClick={() => handleImport("full")}
            className="flex w-full px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
          >
            全图颜色
          </button>
        </div>
      )}
    </div>
  );
}
