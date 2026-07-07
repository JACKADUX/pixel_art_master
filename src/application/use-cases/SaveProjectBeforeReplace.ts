import { projectHasLayerContent } from "@/domain/layer/LayerOperations";
import { getActiveCanvas, type Project } from "@/domain/project/Project";
import type { IProjectRepository } from "../ports/IProjectRepository";
import { getPersistedProjectPath } from "./ProjectPersistence";
import { saveProject } from "./SaveProject";

export interface SaveBeforeReplaceResult {
  savedProject: Project | null;
  cancelled: boolean;
}

export function projectHasContent(project: Project): boolean {
  const hasLayers = projectHasLayerContent(getActiveCanvas(project).layers);
  const hasNotes = project.notes.length > 0;
  return hasLayers || hasNotes;
}

export async function saveProjectBeforeReplace(
  repository: IProjectRepository,
  project: Project,
  promptSaveAs: (defaultName: string) => Promise<string | null>,
): Promise<SaveBeforeReplaceResult> {
  if (!projectHasContent(project)) {
    return { savedProject: null, cancelled: false };
  }

  const persistedPath = getPersistedProjectPath(project);
  if (persistedPath) {
    const saved = await saveProject(repository, project, persistedPath, null);
    return { savedProject: saved, cancelled: false };
  }

  const selected = await promptSaveAs(project.name);
  if (!selected) {
    return { savedProject: null, cancelled: true };
  }

  const saved = await saveProject(repository, project, selected, null);
  return { savedProject: saved, cancelled: false };
}

