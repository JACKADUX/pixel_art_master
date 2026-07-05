export interface ILastOpenedProjectStore {
  getPath(softwareDataPath: string): Promise<string | null>;
  setPath(softwareDataPath: string, path: string): Promise<void>;
  clearPath(softwareDataPath: string): Promise<void>;
}
