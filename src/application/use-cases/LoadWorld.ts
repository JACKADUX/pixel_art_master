import type { World } from "@/domain/world/World";
import type { IWorldRepository } from "../ports/IWorldRepository";

export async function loadWorld(
  repository: IWorldRepository,
  filePath: string,
): Promise<World> {
  const world = await repository.load(filePath);
  return { ...world, filePath };
}
