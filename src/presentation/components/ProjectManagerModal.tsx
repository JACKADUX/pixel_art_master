import { useEffect, useRef } from "react";
import { isUnsavedEmptyProject } from "@/domain/project/Project";
import { useAppStore } from "../stores/appStore";
import { ConfirmDialog } from "./ConfirmDialog";
import { BlankProjectCard } from "./BlankProjectCard";
import { ProjectCard } from "./ProjectCard";

export function ProjectManagerModal() {
  const open = useAppStore((s) => s.projectManagerOpen);
  const project = useAppStore((s) => s.project);
  const workspacePath = useAppStore((s) => s.projectsWorkspacePath);
  const summaries = useAppStore((s) => s.projectSummaries);
  const loading = useAppStore((s) => s.projectListLoading);
  const deleteTarget = useAppStore((s) => s.deleteConfirmTarget);
  const projectManagerError = useAppStore((s) => s.projectManagerError);

  const closeProjectManager = useAppStore((s) => s.closeProjectManager);
  const pickProjectsWorkspace = useAppStore((s) => s.pickProjectsWorkspace);
  const refreshProjectList = useAppStore((s) => s.refreshProjectList);
  const openProjectByPath = useAppStore((s) => s.openProjectByPath);
  const createBlankProject = useAppStore((s) => s.createBlankProject);
  const requestDeleteProject = useAppStore((s) => s.requestDeleteProject);
  const renameProjectFromList = useAppStore((s) => s.renameProjectFromList);
  const cancelDeleteProject = useAppStore((s) => s.cancelDeleteProject);
  const confirmDeleteProject = useAppStore((s) => s.confirmDeleteProject);

  const isStartPage = project !== null && isUnsavedEmptyProject(project);
  const wasStartPageRef = useRef(isStartPage);

  useEffect(() => {
    if (open && workspacePath) {
      void refreshProjectList();
    }
  }, [open, workspacePath, refreshProjectList]);

  useEffect(() => {
    if (wasStartPageRef.current && !isStartPage && open) {
      closeProjectManager();
    }
    wasStartPageRef.current = isStartPage;
  }, [isStartPage, open, closeProjectManager]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="flex max-h-[80vh] w-[90vw] max-w-4xl flex-col overflow-hidden rounded-lg border border-zinc-600 bg-zinc-900 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
            <h2 className="text-sm font-medium text-zinc-200">项目管理</h2>
            {!isStartPage && (
              <button
                type="button"
                onClick={closeProjectManager}
                className="text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            )}
          </div>

          {!workspacePath ? (
            <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
              <p className="text-sm text-zinc-400">
                首次使用请选择项目文件夹，所有项目将默认保存到该目录。
              </p>
              <button
                type="button"
                onClick={() => void pickProjectsWorkspace()}
                className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                选择项目文件夹
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2">
                <span className="min-w-0 flex-1 truncate text-[10px] text-zinc-500" title={workspacePath}>
                  {workspacePath}
                </span>
                <button
                  type="button"
                  onClick={() => void pickProjectsWorkspace()}
                  className="shrink-0 rounded px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                >
                  更改目录
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4">
                {projectManagerError && (
                  <p className="mb-3 rounded border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                    {projectManagerError}
                  </p>
                )}

                {loading ? (
                  <p className="py-10 text-center text-sm text-zinc-500">加载中…</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    <BlankProjectCard onCreate={createBlankProject} />
                    {summaries.map((summary) => (
                      <ProjectCard
                        key={summary.filePath}
                        summary={summary}
                        onOpen={(path) => void openProjectByPath(path)}
                        onDelete={requestDeleteProject}
                        onRename={renameProjectFromList}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除项目"
        message={
          deleteTarget
            ? `确定要删除「${deleteTarget.name}」吗？此操作不可恢复，项目文件将从磁盘永久删除。`
            : ""
        }
        confirmLabel="删除"
        cancelLabel="取消"
        danger
        onConfirm={() => void confirmDeleteProject()}
        onCancel={cancelDeleteProject}
      />
    </>
  );
}
