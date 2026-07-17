import { useEffect } from "react";
import { createPortal } from "react-dom";
import { BookmarkSquareIcon } from "@heroicons/react/24/outline";
import { listLuminancePalettePresets } from "@/domain/luminancePalette/LuminancePalettePresetLibrary";
import { useBackdropDismiss } from "@/presentation/hooks/useBackdropDismiss";
import { useAppStore } from "../stores/appStore";
import { ConfirmDialog } from "./ConfirmDialog";
import { LuminancePaletteBoard } from "./luminancePalette/LuminancePaletteBoard";

export function LuminancePalettePresetManagerModal() {
  const open = useAppStore((s) => s.luminancePalettePresetManagerOpen);
  const close = useAppStore((s) => s.closeLuminancePalettePresetManager);
  const library = useAppStore((s) => s.luminancePalettePresetLibrary);
  const project = useAppStore((s) => s.project);
  const foregroundColor = useAppStore((s) => s.foregroundColor);
  const backgroundColor = useAppStore((s) => s.backgroundColor);
  const setColorSlot = useAppStore((s) => s.setColorSlot);

  const saveCurrentLuminancePaletteAsPreset = useAppStore(
    (s) => s.saveCurrentLuminancePaletteAsPreset,
  );
  const overwriteLuminancePalettePreset = useAppStore((s) => s.overwriteLuminancePalettePreset);
  const renameLuminancePalettePresetAction = useAppStore(
    (s) => s.renameLuminancePalettePresetAction,
  );
  const importLuminancePalettePresetToProject = useAppStore(
    (s) => s.importLuminancePalettePresetToProject,
  );
  const requestDeleteLuminancePalettePreset = useAppStore(
    (s) => s.requestDeleteLuminancePalettePreset,
  );
  const cancelDeleteLuminancePalettePreset = useAppStore(
    (s) => s.cancelDeleteLuminancePalettePreset,
  );
  const confirmDeleteLuminancePalettePreset = useAppStore(
    (s) => s.confirmDeleteLuminancePalettePreset,
  );
  const deleteTarget = useAppStore((s) => s.deleteLuminancePalettePresetTarget);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useAppStore.getState().deleteLuminancePalettePresetTarget) return;
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  const backdropProps = useBackdropDismiss<HTMLDivElement>(close);

  if (!open && !deleteTarget) return null;

  const presets = listLuminancePalettePresets(library);
  const groupCount = project?.luminancePalette.groups.length ?? 0;
  const canUseCurrent = groupCount > 0;

  return createPortal(
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          {...backdropProps}
        >
          <div className="flex h-[72vh] w-[90vw] max-w-2xl flex-col overflow-hidden rounded-lg border border-zinc-600 bg-zinc-900 shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-700 px-4 py-3">
              <div>
                <h2 className="text-sm font-medium text-zinc-200">明度色板预设</h2>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  共 {presets.length} 个预设 · 当前 {groupCount} 组
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canUseCurrent}
                  onClick={() => void saveCurrentLuminancePaletteAsPreset()}
                  className="flex items-center gap-1 rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <BookmarkSquareIcon className="h-3.5 w-3.5" />
                  保存当前为预设
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
                  暂无预设。点击右上角「保存当前为预设」创建第一个。
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="rounded-lg border border-zinc-700/80 bg-zinc-800/40 p-3"
                    >
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <input
                          key={`${preset.id}-${preset.updatedAt}`}
                          type="text"
                          defaultValue={preset.name}
                          onBlur={(e) =>
                            renameLuminancePalettePresetAction(preset.id, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              renameLuminancePalettePresetAction(
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
                          {preset.data.groups.length} 组
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => importLuminancePalettePresetToProject(preset.id)}
                            className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800"
                          >
                            导入到项目
                          </button>
                          <button
                            type="button"
                            disabled={!canUseCurrent}
                            onClick={() => overwriteLuminancePalettePreset(preset.id)}
                            className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:opacity-40"
                          >
                            覆盖
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteLuminancePalettePreset(preset.id)}
                            className="rounded border border-red-900/60 px-2 py-0.5 text-[10px] text-red-300 transition hover:bg-red-950/40"
                          >
                            删除
                          </button>
                        </div>
                      </div>

                      {preset.data.groups.length > 0 ? (
                        <LuminancePaletteBoard
                          palette={{
                            ...preset.data,
                            activeGroupId: preset.data.groups[0]?.id ?? null,
                          }}
                          editMode={false}
                          liveEditTarget={null}
                          foregroundColor={foregroundColor}
                          backgroundColor={backgroundColor}
                          onSelect={setColorSlot}
                          onActivateGroup={() => {}}
                          onSetSwatchForeground={() => {}}
                          onRemoveSwatch={() => {}}
                          onActivateLiveEdit={() => {}}
                          onDeactivateLiveEdit={() => {}}
                          onImportDroppedColors={() => {}}
                          interactive={false}
                          showActiveRing={false}
                        />
                      ) : (
                        <p className="text-[11px] text-zinc-500">（空预设）</p>
                      )}
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
        title="删除明度色板预设"
        message={`确定删除预设「${deleteTarget?.name ?? ""}」？此操作不可撤销。`}
        confirmLabel="删除"
        danger
        onConfirm={confirmDeleteLuminancePalettePreset}
        onCancel={cancelDeleteLuminancePalettePreset}
      />
    </>,
    document.body,
  );
}
