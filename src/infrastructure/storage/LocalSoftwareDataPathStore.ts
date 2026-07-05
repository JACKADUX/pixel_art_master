import type { ISoftwareDataPathStore } from "@/application/ports/ISoftwareDataPathStore";
import { validateSoftwareDataPath } from "@/domain/softwareDataPath/SoftwareDataPath";

const LEGACY_KEY = "pixelart-projects-directory";
const STORAGE_KEY = "pixelart-software-data-path";

export class LocalSoftwareDataPathStore implements ISoftwareDataPathStore {
  getPath(): string | null {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY);
      return stored ? validateSoftwareDataPath(stored) : null;
    } catch {
      return null;
    }
  }

  setPath(path: string): void {
    const validated = validateSoftwareDataPath(path);
    localStorage.setItem(STORAGE_KEY, validated);
    localStorage.removeItem(LEGACY_KEY);
  }
}

export const softwareDataPathStore = new LocalSoftwareDataPathStore();
