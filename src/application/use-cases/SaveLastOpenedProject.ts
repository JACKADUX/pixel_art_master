import type { ILastOpenedProjectStore } from "../ports/ILastOpenedProjectStore";

export function saveLastOpenedProject(
  store: ILastOpenedProjectStore,
  filePath: string,
): void {
  store.setPath(filePath);
}
