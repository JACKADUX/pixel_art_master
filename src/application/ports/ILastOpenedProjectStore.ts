export interface ILastOpenedProjectStore {
  getPath(): string | null;
  setPath(path: string): void;
  clearPath(): void;
}
