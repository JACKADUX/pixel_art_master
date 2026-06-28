import { createPortal } from "react-dom";
import { useMemo } from "react";
import { listPromptPresets } from "@/domain/comfyApp/PromptPresetLibrary";
import { useBackdropDismiss } from "@/presentation/hooks/useBackdropDismiss";
import { useComfyAppStore } from "@/presentation/stores/comfyAppStore";

export function PromptPresetManagerModal({ onClose }: { onClose: () => void }) {
  const library = useComfyAppStore((s) => s.promptPresetLibrary);
  const renamePromptPresetGroup = useComfyAppStore((s) => s.renamePromptPresetGroup);
  const deletePromptPresetGroup = useComfyAppStore((s) => s.deletePromptPresetGroup);
  const presets = useMemo(() => listPromptPresets(library), [library]);

  const backdropProps = useBackdropDismiss<HTMLDivElement>(onClose);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
      {...backdropProps}
    >
      <div className="flex h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div>
            <h2 className="text-sm font-medium text-zinc-100">提示词预设</h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">共 {presets.length} 个预设</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {presets.length === 0 ? (
            <p className="py-8 text-center text-xs text-zinc-500">
              暂无提示词预设。在提示词组件中点击「预设 → 保存当前为预设」创建。
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
                      onBlur={(e) => renamePromptPresetGroup(preset.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          renamePromptPresetGroup(preset.id, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm font-medium text-zinc-100 outline-none transition hover:border-zinc-700 focus:border-blue-500 focus:bg-zinc-800"
                      aria-label="预设名称"
                    />
                    <span className="shrink-0 text-[11px] text-zinc-500">
                      {preset.prompts.length} 项
                    </span>
                    <button
                      type="button"
                      onClick={() => deletePromptPresetGroup(preset.id)}
                      className="shrink-0 rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 transition hover:border-red-500 hover:text-red-300"
                    >
                      删除
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {preset.prompts.length > 0 ? (
                      preset.prompts.map((text, index) => (
                        <span
                          key={index}
                          className="inline-flex max-w-full items-center rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300"
                        >
                          <span className="truncate">{text}</span>
                        </span>
                      ))
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
    </div>,
    document.body,
  );
}
