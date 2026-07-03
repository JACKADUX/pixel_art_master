import { useEffect } from "react";
import { autoSaveProject } from "@/application/use-cases/AutoSaveProject";
import { isUnsavedEmptyProject, touchProject } from "@/domain/project/Project";
import { projectRepository } from "@/infrastructure/storage/JsonProjectRepository";
import { useAppStore } from "../stores/appStore";

export function useAutoSaveProject() {
  const autoSaveIntervalMinutes = useAppStore((s) => s.appSettings.autoSaveIntervalMinutes);

  useEffect(() => {
    const intervalMs = autoSaveIntervalMinutes * 60 * 1000;
    if (intervalMs <= 0) return undefined;

    const timer = setInterval(() => {
      const { project } = useAppStore.getState();
      if (!project || isUnsavedEmptyProject(project)) return;

      void autoSaveProject(projectRepository, project).then((saved) => {
        useAppStore.setState((state) => {
          if (!state.project || state.project.id !== saved.id) {
            return {};
          }

          if (state.project.updatedAt === saved.updatedAt) {
            return {};
          }

          return {
            project: touchProject(state.project),
          };
        });
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoSaveIntervalMinutes]);
}
