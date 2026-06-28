import { useMemo, useState } from "react";
import {
  collectWorkflowClassTypes,
  DEFAULT_OUTPUT_CLASS_TYPES,
  normalizeOutputClassTypes,
} from "@/domain/comfyui/ComfyOutputNode";
import { useBackdropDismiss } from "@/presentation/hooks/useBackdropDismiss";
import { useComfyUiStore } from "@/presentation/stores/comfyUiStore";

export function ComfyOutputTypesModal({ onClose }: { onClose: () => void }) {
  const storedTypes = useComfyUiStore((s) => s.outputClassTypes);
  const workflow = useComfyUiStore((s) => s.workflow);
  const setOutputClassTypes = useComfyUiStore((s) => s.setOutputClassTypes);

  const [types, setTypes] = useState<string[]>(() => [...storedTypes]);
  const [draft, setDraft] = useState("");

  const backdropProps = useBackdropDismiss<HTMLDivElement>(onClose);

  const workflowTypes = useMemo(
    () => (workflow ? collectWorkflowClassTypes(workflow) : []),
    [workflow],
  );
  const suggestions = useMemo(
    () => workflowTypes.filter((type) => !types.includes(type)),
    [workflowTypes, types],
  );

  const addType = (value: string) => {
    const next = normalizeOutputClassTypes([...types, value]);
    setTypes(next);
  };
  const removeType = (value: string) => {
    setTypes(types.filter((type) => type !== value));
  };

  const handleAddDraft = () => {
    if (!draft.trim()) return;
    addType(draft);
    setDraft("");
  };

  const handleSave = () => {
    setOutputClassTypes(types);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
      {...backdropProps}
    >
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
          <div>
            <h2 className="text-sm font-medium text-zinc-100">可导出图片节点类型</h2>
            <p className="text-[11px] text-zinc-500">
              命中这些 class_type 的节点会在节点卡片上出现「导出图片」勾选项
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            关闭
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">当前白名单</span>
              <button
                type="button"
                onClick={() => setTypes(normalizeOutputClassTypes([...DEFAULT_OUTPUT_CLASS_TYPES]))}
                className="rounded px-1.5 py-0.5 text-[10px] text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              >
                恢复默认
              </button>
            </div>
            {types.length === 0 ? (
              <p className="rounded border border-amber-900/50 bg-amber-950/20 px-2 py-1.5 text-[11px] text-amber-400/90">
                未配置任何类型，所有节点都不会出现导出选项。
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {types.map((type) => (
                  <span
                    key={type}
                    className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800/60 py-0.5 pl-2 pr-1 text-[11px] text-zinc-200"
                  >
                    {type}
                    <button
                      type="button"
                      onClick={() => removeType(type)}
                      title="移除"
                      className="flex h-4 w-4 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-700 hover:text-zinc-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-medium text-zinc-300">添加类型</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddDraft();
                  }
                }}
                placeholder="输入 class_type，如 SaveImage"
                className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none transition focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddDraft}
                disabled={!draft.trim()}
                className="rounded bg-zinc-700 px-3 py-1 text-xs text-zinc-100 transition hover:bg-zinc-600 disabled:opacity-40"
              >
                添加
              </button>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-zinc-300">
                当前工作流中的其它类型（点击添加）
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addType(type)}
                    className="rounded border border-dashed border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
                  >
                    + {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-800 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-blue-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-blue-500"
          >
            保存
          </button>
        </footer>
      </div>
    </div>
  );
}
