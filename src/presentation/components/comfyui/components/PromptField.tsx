import { useMemo, useRef, useState } from "react";
import type { AppComponent } from "@/domain/comfyApp/ComfyAppComponent";
import { createPromptItem, type PromptItem } from "@/domain/comfyApp/PromptComponent";
import { listPromptPresets } from "@/domain/comfyApp/PromptPresetLibrary";
import { ContextMenu } from "@/presentation/components/ContextMenu";
import type { MenuItem } from "@/presentation/components/MenuDropdown";
import { useComfyAppStore, type PromptRunnerValue } from "@/presentation/stores/comfyAppStore";
import { AiTextField } from "../../aiTextField/AiTextField";
import { PromptPresetManagerModal } from "./PromptPresetManagerModal";

export function PromptField({
  appId,
  component,
  value,
  disabled,
  onChange,
}: {
  appId: string;
  component: AppComponent;
  value: PromptRunnerValue;
  disabled: boolean;
  onChange: (value: PromptRunnerValue) => void;
}) {
  const promptPresetLibrary = useComfyAppStore((s) => s.promptPresetLibrary);
  const savePromptPresetGroup = useComfyAppStore((s) => s.savePromptPresetGroup);
  const presets = useMemo(() => listPromptPresets(promptPresetLibrary), [promptPresetLibrary]);

  const prompts = value.prompts;
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const presetButtonRef = useRef<HTMLButtonElement>(null);

  const setText = (text: string) => onChange({ ...value, text });
  const commitPrompts = (next: PromptItem[]) => onChange({ ...value, prompts: next });

  const addPrompt = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    commitPrompts([...prompts, createPromptItem(trimmed)]);
    setDraft("");
  };

  const toggleDisabled = (id: string) => {
    commitPrompts(prompts.map((p) => (p.id === id ? { ...p, disabled: !p.disabled } : p)));
  };

  const removePrompt = (id: string) => {
    commitPrompts(prompts.filter((p) => p.id !== id));
  };

  const startEdit = (item: PromptItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const commitEdit = () => {
    if (!editingId) return;
    const trimmed = editingText.trim();
    if (!trimmed) {
      removePrompt(editingId);
    } else {
      commitPrompts(prompts.map((p) => (p.id === editingId ? { ...p, text: trimmed } : p)));
    }
    setEditingId(null);
    setEditingText("");
  };

  const importPreset = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset || preset.prompts.length === 0) return;
    commitPrompts([...prompts, ...preset.prompts.map((text) => createPromptItem(text))]);
  };

  const handleSaveAsPreset = () => {
    const texts = prompts.map((p) => p.text.trim()).filter((t) => t.length > 0);
    if (texts.length === 0) return;
    const name = window.prompt("预设名称", "");
    if (name === null) return;
    savePromptPresetGroup(name, texts);
  };

  const presetMenuItems: MenuItem[] = [
    ...(presets.length === 0
      ? [
          {
            type: "action" as const,
            label: "（暂无提示词预设）",
            onClick: () => setMenuPos(null),
            disabled: true,
          },
        ]
      : presets.map<MenuItem>((preset) => ({
          type: "action",
          label: `${preset.name}（${preset.prompts.length}）`,
          onClick: () => importPreset(preset.id),
        }))),
    { type: "separator" },
    {
      type: "action",
      label: "保存当前为预设…",
      onClick: handleSaveAsPreset,
      disabled: prompts.length === 0,
    },
    { type: "action", label: "管理预设…", onClick: () => setManagerOpen(true) },
  ];

  return (
    <div className="space-y-2">
      {component.type === "aiText" ? (
        <AiTextField
          fieldId={`comfyapp.${appId}.${component.id}`}
          label={component.label}
          value={value.text}
          onChange={setText}
          multiline
          rows={3}
        />
      ) : (
        <textarea
          value={value.text}
          disabled={disabled}
          rows={2}
          onChange={(e) => setText(e.target.value)}
          className="w-full resize-y rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-blue-500 disabled:opacity-50"
        />
      )}

      <div className="rounded border border-zinc-800 bg-zinc-950/40 p-2">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-[11px] text-zinc-500">快捷提示词</span>
          <button
            ref={presetButtonRef}
            type="button"
            disabled={disabled}
            onClick={() => {
              const rect = presetButtonRef.current?.getBoundingClientRect();
              if (rect) setMenuPos({ x: rect.left, y: rect.bottom + 2 });
            }}
            className="ml-auto shrink-0 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            预设
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {prompts.map((item) =>
            editingId === item.id ? (
              <input
                key={item.id}
                autoFocus
                value={editingText}
                disabled={disabled}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitEdit();
                  } else if (e.key === "Escape") {
                    setEditingId(null);
                    setEditingText("");
                  }
                }}
                className="min-w-[4rem] rounded border border-blue-500 bg-zinc-950 px-1.5 py-0.5 text-[11px] text-zinc-100 outline-none"
              />
            ) : (
              <span
                key={item.id}
                title={`${item.disabled ? "（已禁用）" : ""}单击${
                  item.disabled ? "启用" : "禁用"
                }，双击编辑`}
                onClick={() => !disabled && toggleDisabled(item.id)}
                onDoubleClick={() => !disabled && startEdit(item)}
                className={`group inline-flex max-w-full cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition ${
                  item.disabled
                    ? "border-zinc-700 bg-zinc-900 text-zinc-500 line-through"
                    : "border-blue-700/60 bg-blue-950/40 text-blue-200 hover:border-blue-500"
                }`}
              >
                <span className="truncate">{item.text}</span>
                <button
                  type="button"
                  disabled={disabled}
                  title="删除"
                  onClick={(e) => {
                    e.stopPropagation();
                    removePrompt(item.id);
                  }}
                  className="shrink-0 text-zinc-500 transition hover:text-red-400"
                >
                  ×
                </button>
              </span>
            ),
          )}

          <input
            value={draft}
            disabled={disabled}
            placeholder="添加提示词…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPrompt(draft);
              }
            }}
            className="min-w-[6rem] flex-1 rounded border border-dashed border-zinc-700 bg-transparent px-2 py-0.5 text-[11px] text-zinc-200 outline-none focus:border-zinc-500 disabled:opacity-50"
          />
          <button
            type="button"
            disabled={disabled || draft.trim().length === 0}
            onClick={() => addPrompt(draft)}
            className="shrink-0 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            添加
          </button>
        </div>
      </div>

      {menuPos && (
        <ContextMenu
          position={menuPos}
          items={presetMenuItems}
          onClose={() => setMenuPos(null)}
        />
      )}

      {managerOpen && <PromptPresetManagerModal onClose={() => setManagerOpen(false)} />}
    </div>
  );
}
