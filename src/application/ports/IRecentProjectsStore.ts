export interface IRecentProjectsStore {
  getRecent(softwareDataPath: string): Promise<string[]>;
  addRecent(softwareDataPath: string, filePath: string): Promise<void>;
  removeRecent(softwareDataPath: string, filePath: string): Promise<void>;
}
