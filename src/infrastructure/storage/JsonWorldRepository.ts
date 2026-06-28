import type { IWorldRepository } from "@/application/ports/IWorldRepository";
import type { World } from "@/domain/world/World";
import type { WorldSummary } from "@/domain/world/WorldSummary";
import { isWorldFileName } from "@/domain/world/WorldWorkspace";
import { readDir, readTextFile, remove, writeTextFile } from "@tauri-apps/plugin-fs";
import { deserializeWorld, parseWorldSummary, serializeWorld } from "./WorldSerializer";

export class JsonWorldRepository implements IWorldRepository {
  async save(world: World, filePath: string): Promise<void> {
    const json = serializeWorld(world);
    await writeTextFile(filePath, json);
  }

  async load(filePath: string): Promise<World> {
    const json = await readTextFile(filePath);
    return deserializeWorld(json, filePath);
  }

  async listSummariesInDirectory(dir: string): Promise<WorldSummary[]> {
    const entries = await readDir(dir);
    const summaries: WorldSummary[] = [];

    for (const entry of entries) {
      if (!entry.isFile || !isWorldFileName(entry.name)) {
        continue;
      }
      const separator = dir.includes("\\") ? "\\" : "/";
      const normalizedDir = dir.replace(/[/\\]+$/, "");
      const filePath = `${normalizedDir}${separator}${entry.name}`;
      try {
        const json = await readTextFile(filePath);
        summaries.push(parseWorldSummary(json, filePath));
      } catch {
        // skip unreadable or invalid world files
      }
    }

    return summaries;
  }

  async delete(filePath: string): Promise<void> {
    await remove(filePath);
  }
}

export const worldRepository = new JsonWorldRepository();
