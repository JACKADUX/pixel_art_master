import type { IProjectRepository } from "@/application/ports/IProjectRepository";
import type { ProjectSummary } from "@/domain/project/ProjectSummary";
import { isProjectFileName } from "@/domain/workspace/ProjectsWorkspace";
import type { Project } from "@/domain/project/Project";
import { readDir, readTextFile, remove, writeTextFile } from "@tauri-apps/plugin-fs";
import { deserializeProject, serializeProject } from "./ProjectSerializer";
import { parseProjectSummary } from "./ProjectSummaryParser";

const RECENT_KEY = "pixelart-recent-projects";

export class JsonProjectRepository implements IProjectRepository {
  async save(project: Project, filePath: string): Promise<void> {
    const json = serializeProject(project);
    await writeTextFile(filePath, json);
    this.addRecent(filePath);
  }

  async load(filePath: string): Promise<Project> {
    const json = await readTextFile(filePath);
    const project = deserializeProject(json, filePath);
    this.addRecent(filePath);
    return project;
  }

  async listSummariesInDirectory(dir: string): Promise<ProjectSummary[]> {
    const entries = await readDir(dir);
    const summaries: ProjectSummary[] = [];

    for (const entry of entries) {
      if (!entry.isFile || !isProjectFileName(entry.name)) {
        continue;
      }
      const separator = dir.includes("\\") ? "\\" : "/";
      const normalizedDir = dir.replace(/[/\\]+$/, "");
      const filePath = `${normalizedDir}${separator}${entry.name}`;
      try {
        const json = await readTextFile(filePath);
        summaries.push(parseProjectSummary(json, filePath));
      } catch {
        // skip unreadable or invalid project files
      }
    }

    return summaries;
  }

  async delete(filePath: string): Promise<void> {
    await remove(filePath);
    this.removeRecent(filePath);
  }

  removeRecent(filePath: string): void {
    const recent = this.getRecent().filter((p) => p !== filePath);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 10)));
  }

  addRecent(filePath: string): void {
    const recent = this.getRecent().filter((p) => p !== filePath);
    recent.unshift(filePath);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 10)));
  }

  getRecent(): string[] {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    } catch {
      return [];
    }
  }
}

export const projectRepository = new JsonProjectRepository();
