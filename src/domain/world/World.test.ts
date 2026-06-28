import { describe, expect, it } from "vitest";
import {
  addEntity,
  collectWorldTags,
  createEmptyWorld,
  createWorldEntity,
  dedupeTags,
  formatTags,
  parseTags,
  removeEntity,
  renameWorld,
  updateEntity,
  updateWorldview,
} from "./World";

describe("World", () => {
  it("creates an empty world with defaults", () => {
    const world = createEmptyWorld("我的世界");
    expect(world.name).toBe("我的世界");
    expect(world.worldview).toBe("");
    expect(world.entities).toEqual([]);
    expect(world.filePath).toBeNull();
    expect(world.id).toBeTruthy();
  });

  it("creates a unified entity with empty tags", () => {
    const entity = createWorldEntity("勇者");
    expect(entity.name).toBe("勇者");
    expect(entity.tags).toEqual([]);
    expect(entity).not.toHaveProperty("category");
  });

  it("renames a world only when changed and non-empty", () => {
    const world = createEmptyWorld("旧名");
    expect(renameWorld(world, "旧名")).toBeNull();
    expect(renameWorld(world, "  ")).toBeNull();
    expect(renameWorld(world, "新名")?.name).toBe("新名");
  });

  it("updates worldview and bumps updatedAt", () => {
    const world = createEmptyWorld("w");
    expect(updateWorldview(world, "")).toBe(world);
    expect(updateWorldview(world, "一个魔法世界").worldview).toBe("一个魔法世界");
  });

  it("adds, updates and removes entities", () => {
    let world = createEmptyWorld("w");
    const entity = createWorldEntity("勇者");
    world = addEntity(world, entity);
    expect(world.entities).toHaveLength(1);

    world = updateEntity(world, entity.id, { tags: ["主角", "人类"] });
    expect(world.entities[0].tags).toEqual(["主角", "人类"]);

    expect(updateEntity(world, "missing", { name: "x" })).toBe(world);

    world = removeEntity(world, entity.id);
    expect(world.entities).toHaveLength(0);
  });
});

describe("tags", () => {
  it("parses comma separated tags with dedupe and trimming", () => {
    expect(parseTags("主角, 人类，英雄、主角")).toEqual(["主角", "人类", "英雄"]);
    expect(parseTags("  ")).toEqual([]);
  });

  it("dedupes case-insensitively keeping first occurrence", () => {
    expect(dedupeTags(["Hero", "hero", "HERO", "Mage"])).toEqual(["Hero", "Mage"]);
  });

  it("formats tags back to a comma separated string", () => {
    expect(formatTags(["主角", "人类"])).toBe("主角, 人类");
  });

  it("collects unique sorted tags across the world", () => {
    let world = createEmptyWorld("w");
    world = addEntity(world, { ...createWorldEntity("A"), tags: ["森林", "魔法"] });
    world = addEntity(world, { ...createWorldEntity("B"), tags: ["魔法", "城市"] });
    const tags = collectWorldTags(world);
    expect(tags).toHaveLength(3);
    expect(tags).toContain("城市");
    expect(tags).toContain("森林");
    expect(tags).toContain("魔法");
  });
});
