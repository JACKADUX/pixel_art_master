import { useEffect, useRef, useState } from "react";
import { useComfyUiStore } from "@/presentation/stores/comfyUiStore";
import { useComfyAppStore } from "@/presentation/stores/comfyAppStore";

export function ComfyWorkflowImport() {
  const workflowName = useComfyUiStore((s) => s.workflowName);
  const parameters = useComfyUiStore((s) => s.parameters);
  const running = useComfyUiStore((s) => s.running);
  const importWorkflowFromFile = useComfyUiStore((s) => s.importWorkflowFromFile);
  const setWorkflowName = useComfyUiStore((s) => s.setWorkflowName);
  const resetDraft = useComfyAppStore((s) => s.resetDraft);
  const draftDescription = useComfyAppStore((s) => s.draftDescription);
  const setDraftDescription = useComfyAppStore((s) => s.setDraftDescription);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  const startEditName = () => {
    if (running) return;
    setNameDraft(workflowName ?? "");
    setEditingName(true);
  };

  const commitName = () => {
    setWorkflowName(nameDraft);
    setEditingName(false);
  };

  const handleFile = (file: File | undefined) => {
    if (file) {
      // 手动导入新工作流时清空应用草稿，避免残留旧参数绑定
      resetDraft();
      void importWorkflowFromFile(file);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
        disabled={running}
        className={`flex w-full flex-col items-center justify-center gap-1 rounded border border-dashed px-3 py-5 text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${
          dragActive
            ? "border-blue-500 bg-blue-950/30 text-blue-300"
            : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
        }`}
      >
        <span>点击选择，或拖拽工作流 JSON 到此处</span>
        <span className="text-[10px] text-zinc-600">
          需为 ComfyUI 开发者模式「Save (API Format)」导出的 JSON
        </span>
      </button>

      {workflowName && (
        <div className="flex items-center justify-between gap-2 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs">
          {editingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitName();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setEditingName(false);
                }
              }}
              className="min-w-0 flex-1 rounded border border-blue-500 bg-zinc-950 px-1.5 py-0.5 text-zinc-100 outline-none"
            />
          ) : (
            <span
              onDoubleClick={startEditName}
              title="双击修改名称"
              className="min-w-0 flex-1 cursor-text truncate text-zinc-300"
            >
              {workflowName}
            </span>
          )}
          <span className="shrink-0 text-zinc-500">{parameters.length} 个参数</span>
        </div>
      )}

      {workflowName && (
        <label className="block space-y-1 text-[11px] text-zinc-500">
          <span>应用描述（可选）</span>
          <textarea
            value={draftDescription}
            onChange={(e) => setDraftDescription(e.target.value)}
            rows={2}
            placeholder="为这个应用写一段描述，会显示在应用列表中"
            className="w-full resize-y rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-blue-500"
          />
        </label>
      )}
    </div>
  );
}
