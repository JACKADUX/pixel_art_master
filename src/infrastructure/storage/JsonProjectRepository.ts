import type { IRecentProjectsStore } from "@/application/ports/IRecentProjectsStore";
import type { IProjectRepository } from "@/application/ports/IProjectRepository";
import type { ProjectSummary } from "@/domain/project/ProjectSummary";
import { isProjectFileName } from "@/domain/softwareDataPath/SoftwareDataPath";
import type { Project } from "@/domain/project/Project";
import { readDir, readTextFile, remove, writeTextFile } from "@tauri-apps/plugin-fs";
import { recentProjectsStore } from "./FileRecentProjectsStore";
import { deserializeProject, serializeProject } from "./ProjectSerializer";
import { parseProjectSummary } from "./ProjectSummaryParser";

export class JsonProjectRepository implements IProjectRepository {
  constructor(private readonly recentStore: IRecentProjectsStore = recentProjectsStore) {}

  async save(
    project: Project,
    filePath: string,
    softwareDataPath: string | null,
  ): Promise<void> {
    const json = serializeProject(project);
    await writeTextFile(filePath, json);
    if (softwareDataPath) {
      await this.recentStore.addRecent(softwareDataPath, filePath);
    }
  }

  async load(filePath: string, softwareDataPath: string | null): Promise<Project> {
    const json = await readTextFile(filePath);
    const project = deserializeProject(json, filePath);
    if (softwareDataPath) {
      await this.recentStore.addRecent(softwareDataPath, filePath);
    }
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

  async delete(filePath: string, softwareDataPath: string | null): Promise<void> {
    await remove(filePath);
    if (softwareDataPath) {
      await this.recentStore.removeRecent(softwareDataPath, filePath);
    }
  }

  async getRecent(softwareDataPath: string): Promise<string[]> {
    return this.recentStore.getRecent(softwareDataPath);
  }
}

export const projectRepository = new JsonProjectRepository();
