import type { ILastOpenedProjectStore } from "@/application/ports/ILastOpenedProjectStore";
import { validateProjectFilePath } from "@/domain/workspace/ProjectsWorkspace";

const LAST_OPENED_KEY = "pixelart-last-opened-project";

export class LocalLastOpenedProjectStore implements ILastOpenedProjectStore {
  getPath(): string | null {
    try {
      const stored = localStorage.getItem(LAST_OPENED_KEY);
      return stored ? validateProjectFilePath(stored) : null;
    } catch {
      return null;
    }
  }

  setPath(path: string): void {
    localStorage.setItem(LAST_OPENED_KEY, validateProjectFilePath(path));
  }

  clearPath(): void {
    localStorage.removeItem(LAST_OPENED_KEY);
  }
}

export const lastOpenedProjectStore = new LocalLastOpenedProjectStore();
