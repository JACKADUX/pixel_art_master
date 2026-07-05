import {
  parsePixelRestorePreferences,
  type PixelRestorePreferences,
} from "@/domain/pixelRestore/PixelRestorePreferences";
import type { IPixelRestorePreferencesRepository } from "../ports/IPixelRestorePreferencesRepository";

export async function loadPixelRestorePreferences(
  repository: IPixelRestorePreferencesRepository,
  softwareDataPath: string,
): Promise<PixelRestorePreferences | null> {
  const raw = await repository.load(softwareDataPath);
  if (raw === null) return null;
  return parsePixelRestorePreferences(raw);
}
