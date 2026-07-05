export interface ISoftwareDataPathStore {
  getPath(): string | null;
  setPath(path: string): void;
}
