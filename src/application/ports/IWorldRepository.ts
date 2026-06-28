import type { World } from "@/domain/world/World";
import type { WorldSummary } from "@/domain/world/WorldSummary";

export interface IWorldRepository {
  save(world: World, filePath: string): Promise<void>;
  load(filePath: string): Promise<World>;
  listSummariesInDirectory(dir: string): Promise<WorldSummary[]>;
  delete(filePath: string): Promise<void>;
}
