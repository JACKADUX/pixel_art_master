import type { IProjectsWorkspaceStore } from "@/application/ports/IProjectsWorkspaceStore";
import { validateWorkspacePath } from "@/domain/workspace/ProjectsWorkspace";

const WORKSPACE_KEY = "pixelart-projects-directory";

export class LocalProjectsWorkspaceStore implements IProjectsWorkspaceStore {
  getPath(): string | null {
    try {
      const stored = localStorage.getItem(WORKSPACE_KEY);
      return stored ? validateWorkspacePath(stored) : null;
    } catch {
      return null;
    }
  }

  setPath(path: string): void {
    localStorage.setItem(WORKSPACE_KEY, validateWorkspacePath(path));
  }
}

export const projectsWorkspaceStore = new LocalProjectsWorkspaceStore();
