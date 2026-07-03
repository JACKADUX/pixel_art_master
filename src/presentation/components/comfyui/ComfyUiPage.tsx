import { useState, useRef } from "react";
import { useAppStore } from "@/presentation/stores/appStore";
import { useComfyUiStore } from "@/presentation/stores/comfyUiStore";
import { useComfyAppStore } from "@/presentation/stores/comfyAppStore";
import { ComfyWorkflowImport } from "./ComfyWorkflowImport";
import { ComfyNodePanel } from "./ComfyNodePanel";
import { ComfyOutputTypesModal } from "./ComfyOutputTypesModal";
import { ComfyProgressBar } from "./ComfyProgressBar";
import { ComfyResultGallery } from "./ComfyResultGallery";
import { ComfyAppPanel } from "./ComfyAppPanel";
import { SaveComfyAppModal } from "./SaveComfyAppModal";
import { ComfyAppFloatingRunner } from "./ComfyAppFloatingRunner";

type ComfyView = "editor" | "apps";

export function ComfyUiPage() {
  const open = useComfyUiStore((s) => s.open);
  const serverConfig = useComfyUiStore((s) => s.serverConfig);
  const workflow = useComfyUiStore((s) => s.workflow);
  const workflowName = useComfyUiStore((s) => s.workflowName);
  const running = useComfyUiStore((s) => s.running);
  const progress = useComfyUiStore((s) => s.progress);
  const error = useComfyUiStore((s) => s.error);
  const closePage = useComfyUiStore((s) => s.closePage);
  const run = useComfyUiStore((s) => s.run);
  const abort = useComfyUiStore((s) => s.abort);
  const openSettingsModal = useAppStore((s) => s.openSettingsModal);

  const draftCount = useComfyAppStore((s) => s.draftComponents.length);
  const editingAppId = useComfyAppStore((s) => s.editingAppId);
  const updateApp = useComfyAppStore((s) => s.updateApp);

  const [view, setView] = useState<ComfyView>("editor");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [outputTypesModalOpen, setOutputTypesModalOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  return (
    <div
      ref={pageRef}
      className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-zinc-100"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={closePage}
            className="rounded px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            ← 返回编辑器
          </button>
          <h1 className="text-sm font-medium">ComfyUI 工作流</h1>
          <div className="ml-2 flex items-center gap-1 rounded-lg bg-zinc-900 p-0.5">
            <button
              type="button"
              onClick={() => setView("editor")}
              className={`rounded-md px-3 py-1 text-xs transition ${
                view === "editor"
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              工作流
            </button>
            <button
              type="button"
              onClick={() => setView("apps")}
              className={`rounded-md px-3 py-1 text-xs transition ${
                view === "apps" ? "bg-zinc-700 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              应用
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openSettingsModal}
            title="在设置中修改 ComfyUI 服务器地址"
            className="flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
          >
            <span className="text-zinc-500">服务器</span>
            <span className="font-mono text-zinc-300">{serverConfig.address}</span>
          </button>

          {view === "editor" && (
            <>
              <button
                type="button"
                onClick={() => setOutputTypesModalOpen(true)}
                title="配置哪些 class_type 节点可导出结果图"
                className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
              >
                输出类型
              </button>

              <button
                type="button"
                onClick={() => {
                  if (editingAppId) {
                    void updateApp();
                  } else {
                    setSaveModalOpen(true);
                  }
                }}
                disabled={!workflow || draftCount === 0}
                title={
                  draftCount === 0
                    ? "请先在参数旁的设置中提取至少一个参数"
                    : editingAppId
                      ? "直接保存更新当前应用"
                      : "保存为应用"
                }
                className="rounded border border-emerald-700 bg-emerald-900/40 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-800/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {editingAppId ? "更新应用" : "保存为应用"}
                {draftCount > 0 ? ` (${draftCount})` : ""}
              </button>

              {running ? (
                <button
                  type="button"
                  onClick={abort}
                  className="rounded bg-red-700 px-4 py-1.5 text-xs font-medium transition hover:bg-red-600"
                >
                  停止
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void run()}
                  disabled={!workflow}
                  className="rounded bg-blue-600 px-4 py-1.5 text-xs font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  执行
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {error && view === "editor" && (
        <div className="border-b border-red-900/50 bg-red-950/30 px-4 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {view === "editor" ? (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden">
          <section className="flex min-h-0 flex-col overflow-hidden border-r border-zinc-800">
            <div className="shrink-0 space-y-3 border-b border-zinc-800 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                工作流
              </h2>
              <ComfyWorkflowImport />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                节点与参数
              </h2>
              <ComfyNodePanel />
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-zinc-800 p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                进度
              </h2>
              <ComfyProgressBar progress={progress} />
              {progress.status === "idle" && <p className="text-xs text-zinc-600">尚未执行</p>}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                结果
              </h2>
              <ComfyResultGallery />
            </div>
          </section>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ComfyAppPanel onEditApp={() => setView("editor")} />
        </div>
      )}

      {saveModalOpen && (
        <SaveComfyAppModal
          initialName={workflowName?.replace(/\.json$/i, "") ?? "未命名应用"}
          onClose={() => setSaveModalOpen(false)}
        />
      )}

      {outputTypesModalOpen && (
        <ComfyOutputTypesModal onClose={() => setOutputTypesModalOpen(false)} />
      )}

      <ComfyAppFloatingRunner scope="workflow" containerRef={pageRef} />
    </div>
  );
}
