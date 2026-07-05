import type { IRecentProjectsStore } from "@/application/ports/IRecentProjectsStore";
import { buildRecentProjectsPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedRecentProjects {
  paths: string[];
}

function parseRecentProjects(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string");
  }
  if (typeof raw === "object" && raw !== null && "paths" in raw) {
    const paths = (raw as SerializedRecentProjects).paths;
    if (Array.isArray(paths)) {
      return paths.filter((item): item is string => typeof item === "string");
    }
  }
  return [];
}

export class FileRecentProjectsStore implements IRecentProjectsStore {
  async getRecent(softwareDataPath: string): Promise<string[]> {
    const parsed = await readUserDataJson(buildRecentProjectsPath(softwareDataPath));
    return parseRecentProjects(parsed);
  }

  async addRecent(softwareDataPath: string, filePath: string): Promise<void> {
    const recent = (await this.getRecent(softwareDataPath)).filter((p) => p !== filePath);
    recent.unshift(filePath);
    await this.saveRecent(softwareDataPath, recent.slice(0, 10));
  }

  async removeRecent(softwareDataPath: string, filePath: string): Promise<void> {
    const recent = (await this.getRecent(softwareDataPath)).filter((p) => p !== filePath);
    await this.saveRecent(softwareDataPath, recent.slice(0, 10));
  }

  private async saveRecent(softwareDataPath: string, paths: string[]): Promise<void> {
    const payload: SerializedRecentProjects = { paths };
    await writeUserDataJson(
      softwareDataPath,
      buildRecentProjectsPath(softwareDataPath),
      payload,
    );
  }
}

export const recentProjectsStore = new FileRecentProjectsStore();
