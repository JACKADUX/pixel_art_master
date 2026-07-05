import type { ILastOpenedProjectStore } from "@/application/ports/ILastOpenedProjectStore";
import { validateProjectFilePath } from "@/domain/softwareDataPath/SoftwareDataPath";
import { buildLastOpenedProjectPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedLastOpenedProject {
  path: string;
}

export class FileLastOpenedProjectStore implements ILastOpenedProjectStore {
  async getPath(softwareDataPath: string): Promise<string | null> {
    const parsed = await readUserDataJson(buildLastOpenedProjectPath(softwareDataPath));
    if (typeof parsed !== "object" || parsed === null) return null;

    const path = (parsed as SerializedLastOpenedProject).path;
    if (typeof path !== "string" || path.length === 0) return null;

    try {
      return validateProjectFilePath(path);
    } catch {
      return null;
    }
  }

  async setPath(softwareDataPath: string, path: string): Promise<void> {
    const payload: SerializedLastOpenedProject = {
      path: validateProjectFilePath(path),
    };
    await writeUserDataJson(
      softwareDataPath,
      buildLastOpenedProjectPath(softwareDataPath),
      payload,
    );
  }

  async clearPath(softwareDataPath: string): Promise<void> {
    await writeUserDataJson(
      softwareDataPath,
      buildLastOpenedProjectPath(softwareDataPath),
      { path: "" },
    );
  }
}

export const lastOpenedProjectStore = new FileLastOpenedProjectStore();
