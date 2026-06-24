import { useEffect } from "react";
import { createPortal } from "react-dom";
import { BookmarkSquareIcon } from "@heroicons/react/24/outline";
import { listPalettePresets } from "@/domain/palette/PalettePresetLibrary";
import { useAppStore } from "../stores/appStore";
import { ConfirmDialog } from "./ConfirmDialog";
import { PaletteGridView } from "./PaletteGridView";
import { PalettePresetActionsMenu } from "./PalettePresetActionsMenu";

export function PalettePresetManagerModal() {
  const open = useAppStore((s) => s.palettePresetManagerOpen);
  const close = useAppStore((s) => s.closePalettePresetManager);
  const library = useAppStore((s) => s.palettePresetLibrary);
  const project = useAppStore((s) => s.project);
  const foregroundColor = useAppStore((s) => s.foregroundColor);
  const backgroundColor = useAppStore((s) => s.backgroundColor);
  const setColorSlot = useAppStore((s) => s.setColorSlot);

  const saveCurrentPaletteAsPreset = useAppStore((s) => s.saveCurrentPaletteAsPreset);
  const overwritePalettePreset = useAppStore((s) => s.overwritePalettePreset);
  const renamePalettePresetAction = useAppStore((s) => s.renamePalettePresetAction);
  const importPresetToPalette = useAppStore((s) => s.importPresetToPalette);
  const requestDeletePalettePreset = useAppStore((s) => s.requestDeletePalettePreset);
  const cancelDeletePalettePreset = useAppStore((s) => s.cancelDeletePalettePreset);
  const confirmDeletePalettePreset = useAppStore((s) => s.confirmDeletePalettePreset);
  const deleteTarget = useAppStore((s) => s.deletePalettePresetTarget);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useAppStore.getState().deletePalettePresetTarget) return;
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  if (!open && !deleteTarget) return null;

  const presets = listPalettePresets(library);
  const currentColorsCount = project?.palette.getColors().length ?? 0;
  const canUseCurrent = currentColorsCount > 0;

  return createPortal(
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="flex h-[72vh] w-[90vw] max-w-2xl flex-col overflow-hidden rounded-lg border border-zinc-600 bg-zinc-900 shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-4 py-3">
              <div>
                <h2 className="text-sm font-medium text-zinc-200">色板预设</h2>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  共 {presets.length} 个预设 · 当前色板 {currentColorsCount} 色
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canUseCurrent}
                  onClick={() => saveCurrentPaletteAsPreset()}
                  className="flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <BookmarkSquareIcon className="h-3.5 w-3.5" />
                  保存当前色板为预设
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="rounded p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                  aria-label="关闭"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
              {presets.length === 0 ? (
                <p className="py-8 text-center text-xs text-zinc-500">
                  暂无预设。点击右上角"保存当前色板为预设"创建第一个。
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="rounded-lg border border-zinc-700/80 bg-zinc-800/40 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <input
                          key={`${preset.id}-${preset.updatedAt}`}
                          type="text"
                          defaultValue={preset.name}
                          onBlur={(e) => renamePalettePresetAction(preset.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              renamePalettePresetAction(
                                preset.id,
                                (e.target as HTMLInputElement).value,
                              );
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm font-medium text-zinc-100 outline-none transition hover:border-zinc-700 focus:border-blue-500 focus:bg-zinc-800"
                          aria-label="预设名称"
                        />
                        <span className="shrink-0 text-[11px] text-zinc-500">
                          {preset.colors.length} 色
                        </span>
                        <PalettePresetActionsMenu
                          canUseCurrent={canUseCurrent}
                          onMerge={() => importPresetToPalette(preset.id, "merge")}
                          onReplace={() => importPresetToPalette(preset.id, "replace")}
                          onOverwrite={() => overwritePalettePreset(preset.id)}
                          onDelete={() => requestDeletePalettePreset(preset.id)}
                        />
                      </div>

                      <div className="max-h-32 overflow-hidden">
                        {preset.colors.length > 0 ? (
                          <PaletteGridView
                            colors={preset.colors}
                            foregroundColor={foregroundColor}
                            backgroundColor={backgroundColor}
                            onSelect={setColorSlot}
                          />
                        ) : (
                          <p className="text-[11px] text-zinc-500">（空预设）</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除色板预设"
        message={`确定删除预设「${deleteTarget?.name ?? ""}」？此操作不可撤销。`}
        confirmLabel="删除"
        danger
        onConfirm={confirmDeletePalettePreset}
        onCancel={cancelDeletePalettePreset}
      />
    </>,
    document.body,
  );
}
