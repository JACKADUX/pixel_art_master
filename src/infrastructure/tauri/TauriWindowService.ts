import { getCurrentWindow } from "@tauri-apps/api/window";

const STORAGE_KEY = "pixelart-always-on-top";

export class TauriWindowService {
  async setAlwaysOnTop(value: boolean): Promise<void> {
    await getCurrentWindow().setAlwaysOnTop(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }

  async isAlwaysOnTop(): Promise<boolean> {
    return getCurrentWindow().isAlwaysOnTop();
  }

  getStoredPreference(): boolean {
    return localStorage.getItem(STORAGE_KEY) === "true";
  }

  async restorePreference(): Promise<void> {
    const stored = this.getStoredPreference();
    if (stored) {
      await this.setAlwaysOnTop(true);
    }
  }
}

export const windowService = new TauriWindowService();
