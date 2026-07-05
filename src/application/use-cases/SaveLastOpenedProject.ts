import type { ILastOpenedProjectStore } from "../ports/ILastOpenedProjectStore";

export async function saveLastOpenedProject(
  store: ILastOpenedProjectStore,
  softwareDataPath: string,
  filePath: string,
): Promise<void> {
  await store.setPath(softwareDataPath, filePath);
}
