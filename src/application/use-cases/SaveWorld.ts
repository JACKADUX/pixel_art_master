import type { World } from "@/domain/world/World";
import { touchWorld } from "@/domain/world/World";
import type { IWorldRepository } from "../ports/IWorldRepository";

export async function saveWorld(
  repository: IWorldRepository,
  world: World,
  filePath: string,
): Promise<World> {
  const updated = touchWorld({ ...world, filePath });
  await repository.save(updated, filePath);
  return updated;
}
