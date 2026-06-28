import type { IWorldRepository } from "../ports/IWorldRepository";

export async function deleteWorld(
  repository: IWorldRepository,
  filePath: string,
): Promise<void> {
  await repository.delete(filePath);
}
