import type {
  ComfyAppRecord,
  IComfyAppRepository,
} from "@/application/ports/IComfyAppRepository";
import type { ComfyApp } from "@/domain/comfyApp/ComfyApp";
import {
  buildComfyAppDir,
  buildComfyAppManifestPath,
  buildComfyAppWorkflowPath,
  buildComfyWorkflowRoot,
} from "@/domain/comfyApp/ComfyAppPaths";
import {
  parseComfyAppManifestJson,
  serializeComfyApp,
} from "@/domain/comfyApp/ComfyAppManifest";
import { parseComfyApiWorkflow, type ComfyApiWorkflow } from "@/domain/comfyui/ComfyWorkflow";
import { mkdir, readDir, readTextFile, remove, writeTextFile } from "@tauri-apps/plugin-fs";

export class FileComfyAppRepository implements IComfyAppRepository {
  async save(
    workspacePath: string,
    app: ComfyApp,
    workflow: ComfyApiWorkflow,
  ): Promise<void> {
    const dir = buildComfyAppDir(workspacePath, app.id);
    await mkdir(dir, { recursive: true });
    await writeTextFile(
      buildComfyAppWorkflowPath(workspacePath, app.id),
      JSON.stringify(workflow, null, 2),
    );
    await writeTextFile(
      buildComfyAppManifestPath(workspacePath, app.id),
      serializeComfyApp(app),
    );
  }

  async list(workspacePath: string): Promise<ComfyApp[]> {
    const root = buildComfyWorkflowRoot(workspacePath);
    let entries: Awaited<ReturnType<typeof readDir>>;
    try {
      entries = await readDir(root);
    } catch {
      return [];
    }

    const apps: ComfyApp[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory) continue;
      const manifestPath = buildComfyAppManifestPath(workspacePath, entry.name);
      try {
        const json = await readTextFile(manifestPath);
        const app = parseComfyAppManifestJson(json);
        if (app) apps.push(app);
      } catch {
        // 忽略无清单或损坏的子目录
      }
    }

    apps.sort((a, b) => b.updatedAt - a.updatedAt);
    return apps;
  }

  async load(workspacePath: string, appId: string): Promise<ComfyAppRecord | null> {
    try {
      const manifestJson = await readTextFile(
        buildComfyAppManifestPath(workspacePath, appId),
      );
      const app = parseComfyAppManifestJson(manifestJson);
      if (!app) return null;

      const workflowJson = await readTextFile(
        buildComfyAppWorkflowPath(workspacePath, appId),
      );
      const workflow = parseComfyApiWorkflow(JSON.parse(workflowJson));
      return { app, workflow };
    } catch {
      return null;
    }
  }

  async delete(workspacePath: string, appId: string): Promise<void> {
    const dir = buildComfyAppDir(workspacePath, appId);
    try {
      await remove(dir, { recursive: true });
    } catch {
      // 忽略不存在的目录
    }
  }
}

export const comfyAppRepository = new FileComfyAppRepository();
