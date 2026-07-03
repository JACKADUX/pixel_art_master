import { useEffect } from "react";
import { useComfyAppStore } from "@/presentation/stores/comfyAppStore";

function formatTime(timestamp: number): string {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return "";
  }
}

export function ComfyAppPanel({ onEditApp }: { onEditApp: () => void }) {
  const apps = useComfyAppStore((s) => s.apps);
  const loading = useComfyAppStore((s) => s.appsLoading);
  const error = useComfyAppStore((s) => s.appsError);
  const refreshApps = useComfyAppStore((s) => s.refreshApps);
  const openRunner = useComfyAppStore((s) => s.openRunner);
  const editApp = useComfyAppStore((s) => s.editApp);
  const duplicateApp = useComfyAppStore((s) => s.duplicateApp);
  const deleteApp = useComfyAppStore((s) => s.deleteApp);

  useEffect(() => {
    void refreshApps();
  }, [refreshApps]);

  const handleEdit = async (appId: string) => {
    await editApp(appId);
    onEditApp();
  };

  const handleDelete = async (appId: string, name: string) => {
    if (!window.confirm(`确定删除应用「${name}」？该操作不可撤销。`)) return;
    await deleteApp(appId);
  };

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">已保存应用</h2>
        <button
          type="button"
          onClick={() => void refreshApps()}
          className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
        >
          刷新
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {loading && <p className="py-6 text-center text-xs text-zinc-600">加载中…</p>}

      {!loading && apps.length === 0 && (
        <p className="py-10 text-center text-xs text-zinc-600">
          暂无应用。在「工作流」中提取参数后点击「保存为应用」即可创建。
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {apps.map((app) => (
          <div
            key={app.id}
            className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
          >
            <div className="space-y-1">
              <h3 className="truncate text-sm font-medium text-zinc-100" title={app.name}>
                {app.name}
              </h3>
              {app.description && (
                <p className="line-clamp-2 text-[11px] text-zinc-500">{app.description}</p>
              )}
              <p className="text-[10px] text-zinc-600">
                {app.components.length} 个组件 · {formatTime(app.updatedAt)}
              </p>
            </div>

            <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => void openRunner(app.id, "workflow")}
                className="rounded bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-blue-500"
              >
                运行
              </button>
              <button
                type="button"
                onClick={() => void handleEdit(app.id)}
                className="rounded border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
              >
                编辑
              </button>
              <button
                type="button"
                onClick={() => void duplicateApp(app.id)}
                className="rounded border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
              >
                复制
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(app.id, app.name)}
                className="rounded border border-red-900/60 px-2.5 py-1 text-[11px] text-red-400 transition hover:border-red-700 hover:text-red-300"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
