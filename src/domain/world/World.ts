/**
 * 世界中的一个具体对象实例（统一类型，不再按大类区分）。
 * summary / description / backstory 为后续 LLM 生成的填充字段，初始可为空串。
 * tags 为多标签，用于灵活分类与检索。
 */
export interface WorldEntity {
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

/** 世界聚合根 */
export interface World {
  id: string;
  name: string;
  worldview: string;
  entities: WorldEntity[];
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 生成基于创建时间的默认世界名（文件名安全） */
export function createDefaultWorldName(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}-${minutes}-${seconds}`;
}

export function createEmptyWorld(name?: string): World {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name?.trim() || createDefaultWorldName(),
    worldview: "",
    entities: [],
    filePath: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createWorldEntity(name = "新对象"): WorldEntity {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: name.trim() || "新对象",
    summary: "",
    description: "",
    backstory: "",
    tags: [],
    attributes: {},
    createdAt: now,
    updatedAt: now,
  };
}

/** 规范化单个标签：去首尾空白 */
export function normalizeTag(tag: string): string {
  return tag.trim();
}

/**
 * 将逗号分隔的字符串解析为去重后的标签数组。
 * 同时支持中英文逗号、顿号作为分隔符。
 */
export function parseTags(input: string): string[] {
  return dedupeTags(
    input
      .split(/[,，、]/)
      .map((tag) => normalizeTag(tag))
      .filter((tag) => tag.length > 0),
  );
}

/** 将标签数组拼接为逗号分隔的字符串 */
export function formatTags(tags: string[]): string {
  return tags.join(", ");
}

/** 去重（保持原顺序，区分大小写按原样保留，重复以首次出现为准） */
export function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = normalizeTag(raw);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
  }
  return result;
}

/** 收集整个世界中已使用过的全部标签（去重、按名称排序），用于复用建议 */
export function collectWorldTags(world: World): string[] {
  const all = world.entities.flatMap((entity) => entity.tags);
  return dedupeTags(all).sort((a, b) => a.localeCompare(b));
}

export function touchWorld(world: World): World {
  return { ...world, updatedAt: new Date().toISOString() };
}

/** 重命名世界；名称未变化或为空时返回 null */
export function renameWorld(world: World, name: string): World | null {
  const trimmed = name.trim();
  if (!trimmed || trimmed === world.name) {
    return null;
  }
  return touchWorld({ ...world, name: trimmed });
}

export function updateWorldview(world: World, worldview: string): World {
  if (worldview === world.worldview) {
    return world;
  }
  return touchWorld({ ...world, worldview });
}

export function addEntity(world: World, entity: WorldEntity): World {
  return touchWorld({ ...world, entities: [...world.entities, entity] });
}

export function updateEntity(
  world: World,
  entityId: string,
  patch: Partial<Omit<WorldEntity, "id" | "createdAt">>,
): World {
  let changed = false;
  const entities = world.entities.map((entity) => {
    if (entity.id !== entityId) {
      return entity;
    }
    changed = true;
    return { ...entity, ...patch, updatedAt: new Date().toISOString() };
  });
  if (!changed) {
    return world;
  }
  return touchWorld({ ...world, entities });
}

export function removeEntity(world: World, entityId: string): World {
  const entities = world.entities.filter((entity) => entity.id !== entityId);
  if (entities.length === world.entities.length) {
    return world;
  }
  return touchWorld({ ...world, entities });
}
