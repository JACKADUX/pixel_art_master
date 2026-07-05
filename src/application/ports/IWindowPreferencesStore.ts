export interface IWindowPreferencesStore {
  loadAlwaysOnTop(softwareDataPath: string): Promise<boolean>;
  saveAlwaysOnTop(softwareDataPath: string, alwaysOnTop: boolean): Promise<void>;
}
