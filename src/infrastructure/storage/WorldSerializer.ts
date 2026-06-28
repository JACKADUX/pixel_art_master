import type { World, WorldEntity } from "@/domain/world/World";
import { dedupeTags } from "@/domain/world/World";
import type { WorldSummary } from "@/domain/world/WorldSummary";

export const WORLD_FILE_VERSION = 1;

interface SerializedWorldEntity {
  id: string;
  name: string;
  summary: string;
  description: string;
  backstory: string;
  tags: string[];
  attributes: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface SerializedWorldV1 {
  version: 1;
  id: string;
  name: string;
  worldview: string;
  entities: SerializedWorldEntity[];
  createdAt: string;
  updatedAt: string;
}

function parseEntity(raw: Partial<SerializedWorldEntity>): WorldEntity {
  const now = new Date().toISOString();
  const attributes =
    raw.attributes && typeof raw.attributes === "object" ? raw.attributes : {};
  const tags = Array.isArray(raw.tags)
    ? dedupeTags(raw.tags.filter((tag): tag is string => typeof tag === "string"))
    : [];
  return {
    id: raw.id ?? crypto.randomUUID(),
    name: raw.name ?? "新对象",
    summary: raw.summary ?? "",
    description: raw.description ?? "",
    backstory: raw.backstory ?? "",
    tags,
    attributes,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

export function serializeWorld(world: World): string {
  const data: SerializedWorldV1 = {
    version: WORLD_FILE_VERSION,
    id: world.id,
    name: world.name,
    worldview: world.worldview,
    entities: world.entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      summary: entity.summary,
      description: entity.description,
      backstory: entity.backstory,
      tags: entity.tags,
      attributes: entity.attributes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    })),
    createdAt: world.createdAt,
    updatedAt: world.updatedAt,
  };
  return JSON.stringify(data, null, 2);
}

export function deserializeWorld(json: string, filePath: string): World {
  const data = JSON.parse(json) as Partial<SerializedWorldV1> & { version?: number };
  if (data.version !== WORLD_FILE_VERSION) {
    throw new Error(`不支持的世界文件版本: ${data.version}`);
  }
  const now = new Date().toISOString();
  const entities = Array.isArray(data.entities)
    ? data.entities.map((entity) => parseEntity(entity))
    : [];
  return {
    id: data.id ?? crypto.randomUUID(),
    name: data.name ?? "未命名世界",
    worldview: data.worldview ?? "",
    entities,
    filePath,
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
  };
}

export function parseWorldSummary(json: string, filePath: string): WorldSummary {
  const data = JSON.parse(json) as Partial<SerializedWorldV1>;
  const fileName = filePath.split(/[/\\]/).pop() ?? "未命名世界";
  const fallbackName = fileName.replace(/\.world\.json$/, "") || "未命名世界";
  return {
    filePath,
    id: data.id ?? filePath,
    name: data.name ?? fallbackName,
    worldview: data.worldview ?? "",
    entityCount: Array.isArray(data.entities) ? data.entities.length : 0,
    updatedAt: data.updatedAt ?? new Date(0).toISOString(),
  };
}
