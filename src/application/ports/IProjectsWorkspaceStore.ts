export interface IProjectsWorkspaceStore {
  getPath(): string | null;
  setPath(path: string): void;
}
