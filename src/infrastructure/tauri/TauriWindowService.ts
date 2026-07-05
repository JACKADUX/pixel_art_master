import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { IWindowPreferencesStore } from "@/application/ports/IWindowPreferencesStore";
import { windowPreferencesStore } from "@/infrastructure/storage/FileWindowPreferencesStore";

/** Restore OS-level keyboard focus to the app window (Tauri webview can lose it after dialogs). */
export async function ensureTauriWindowFocus(): Promise<void> {
  if (!isTauri()) return;
  try {
    await getCurrentWindow().setFocus();
  } catch {
    // Ignore focus errors in unsupported environments.
  }
}

export class TauriWindowService {
  constructor(private readonly preferencesStore: IWindowPreferencesStore) {}

  async setAlwaysOnTop(value: boolean, softwareDataPath: string): Promise<void> {
    await getCurrentWindow().setAlwaysOnTop(value);
    await this.preferencesStore.saveAlwaysOnTop(softwareDataPath, value);
  }

  async isAlwaysOnTop(): Promise<boolean> {
    return getCurrentWindow().isAlwaysOnTop();
  }

  async getStoredPreference(softwareDataPath: string): Promise<boolean> {
    return this.preferencesStore.loadAlwaysOnTop(softwareDataPath);
  }

  async restorePreference(softwareDataPath: string): Promise<void> {
    const stored = await this.getStoredPreference(softwareDataPath);
    if (stored) {
      await this.setAlwaysOnTop(true, softwareDataPath);
    }
  }
}

export const windowService = new TauriWindowService(windowPreferencesStore);
