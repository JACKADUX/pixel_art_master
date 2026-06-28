export interface IWorldsWorkspaceStore {
  getPath(): string | null;
  setPath(path: string): void;
}
