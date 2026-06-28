import { useState } from "react";
import { useBackdropDismiss } from "@/presentation/hooks/useBackdropDismiss";
import { useComfyAppStore } from "@/presentation/stores/comfyAppStore";

export function SaveComfyAppModal({
  initialName,
  onClose,
}: {
  initialName: string;
  onClose: () => void;
}) {
  const saveAsApp = useComfyAppStore((s) => s.saveAsApp);
  const draftCount = useComfyAppStore((s) => s.draftComponents.length);

  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const backdropProps = useBackdropDismiss<HTMLDivElement>(onClose);

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveAsApp(name);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      {...backdropProps}
    >
      <div className="w-full max-w-sm space-y-4 rounded-lg border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
        <h3 className="text-sm font-medium text-zinc-100">保存为应用</h3>

        <label className="block space-y-1 text-xs text-zinc-400">
          <span>应用名称</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="未命名应用"
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 outline-none focus:border-blue-500"
          />
        </label>

        <p className="text-[11px] text-zinc-500">
          将提取 {draftCount} 个组件，工作流会备份到项目文件夹下的 comfyui_workflow 中。
        </p>

        <div className="flex justify-end gap-2 border-t border-zinc-800 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-3 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || draftCount === 0}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
