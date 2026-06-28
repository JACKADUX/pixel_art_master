import { useEffect, useRef, useState } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useComfyAppStore } from "@/presentation/stores/comfyAppStore";
import { ContextMenu } from "@/presentation/components/ContextMenu";
import { ConfirmDialog } from "@/presentation/components/ConfirmDialog";
import type { MenuItem } from "@/presentation/components/MenuDropdown";

type EditMode = "idle" | "create" | "rename";
type ConfirmKind = "update" | "delete";

/** 运行弹窗顶部的参数预设栏：下拉切换 + 更多操作菜单（保存/更新/重命名/删除） */
export function ParameterPresetBar({ disabled }: { disabled: boolean }) {
  const presets = useComfyAppStore((s) => s.runnerApp?.presets ?? []);
  const activePresetId = useComfyAppStore((s) => s.runnerActivePresetId);
  const selectRunnerPreset = useComfyAppStore((s) => s.selectRunnerPreset);
  const saveRunnerPreset = useComfyAppStore((s) => s.saveRunnerPreset);
  const updateRunnerPreset = useComfyAppStore((s) => s.updateRunnerPreset);
  const renameRunnerPreset = useComfyAppStore((s) => s.renameRunnerPreset);
  const deleteRunnerPreset = useComfyAppStore((s) => s.deleteRunnerPreset);

  const [mode, setMode] = useState<EditMode>("idle");
  const [draftName, setDraftName] = useState("");
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  const activePreset = presets.find((preset) => preset.id === activePresetId) ?? null;

  useEffect(() => {
    if (mode !== "idle") inputRef.current?.focus();
  }, [mode]);

  const startCreate = () => {
    setDraftName(`预设 ${presets.length + 1}`);
    setMode("create");
  };

  const startRename = () => {
    if (!activePreset) return;
    setDraftName(activePreset.name);
    setMode("rename");
  };

  const cancelEdit = () => {
    setMode("idle");
    setDraftName("");
  };

  const confirmEdit = () => {
    const name = draftName.trim();
    if (!name) return;
    if (mode === "create") {
      void saveRunnerPreset(name);
    } else if (mode === "rename" && activePreset) {
      void renameRunnerPreset(activePreset.id, name);
    }
    cancelEdit();
  };

  const openMenu = () => {
    const rect = moreButtonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMenuPos({ x: rect.right, y: rect.bottom + 2 });
  };

  const handleConfirm = () => {
    if (confirmKind === "update" && activePreset) {
      void updateRunnerPreset(activePreset.id);
    } else if (confirmKind === "delete" && activePreset) {
      void deleteRunnerPreset(activePreset.id);
    }
    setConfirmKind(null);
  };

  const menuItems: MenuItem[] = [
    { type: "action", label: "另存为新预设", onClick: startCreate },
  ];
  if (activePreset) {
    menuItems.push(
      { type: "action", label: "更新当前预设", onClick: () => setConfirmKind("update") },
      { type: "action", label: "重命名", onClick: startRename },
      { type: "separator" },
      { type: "action", label: "删除预设", onClick: () => setConfirmKind("delete") },
    );
  }

  const btn =
    "shrink-0 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50";

  if (mode !== "idle") {
    return (
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[11px] text-zinc-500">
          {mode === "create" ? "预设名称" : "重命名"}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") confirmEdit();
            if (e.key === "Escape") cancelEdit();
          }}
          placeholder="输入预设名称"
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-blue-500"
        />
        <button type="button" onClick={confirmEdit} disabled={!draftName.trim()} className={btn}>
          确定
        </button>
        <button type="button" onClick={cancelEdit} className={btn}>
          取消
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[11px] text-zinc-500">预设</span>
        <select
          value={activePresetId ?? ""}
          disabled={disabled}
          onChange={(e) => selectRunnerPreset(e.target.value === "" ? null : e.target.value)}
          className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-100 outline-none focus:border-blue-500 disabled:opacity-50"
        >
          <option value="">（自定义参数）</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>

        <button
          ref={moreButtonRef}
          type="button"
          title="更多操作"
          aria-label="更多操作"
          aria-haspopup="menu"
          aria-expanded={menuPos !== null}
          disabled={disabled}
          onClick={openMenu}
          className={`flex shrink-0 items-center justify-center rounded border p-1 transition disabled:cursor-not-allowed disabled:opacity-50 ${
            menuPos !== null
              ? "border-zinc-500 bg-zinc-800 text-zinc-100"
              : "border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800"
          }`}
        >
          <EllipsisVerticalIcon className="h-4 w-4" />
        </button>
      </div>

      {menuPos && (
        <ContextMenu position={menuPos} items={menuItems} onClose={() => setMenuPos(null)} />
      )}

      <ConfirmDialog
        open={confirmKind === "update"}
        title="更新预设"
        message={`确定用当前参数覆盖预设「${activePreset?.name ?? ""}」吗？原有取值将被替换。`}
        confirmLabel="更新"
        zClassName="z-[210]"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmKind(null)}
      />
      <ConfirmDialog
        open={confirmKind === "delete"}
        title="删除预设"
        message={`确定删除预设「${activePreset?.name ?? ""}」吗？此操作无法撤销。`}
        confirmLabel="删除"
        danger
        zClassName="z-[210]"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmKind(null)}
      />
    </>
  );
}
