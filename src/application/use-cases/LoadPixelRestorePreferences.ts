import {
  parsePixelRestorePreferences,
  type PixelRestorePreferences,
} from "@/domain/pixelRestore/PixelRestorePreferences";
import type { IPixelRestorePreferencesRepository } from "../ports/IPixelRestorePreferencesRepository";

export function loadPixelRestorePreferences(
  repository: IPixelRestorePreferencesRepository,
): PixelRestorePreferences | null {
  const raw = repository.load();
  if (raw === null) return null;
  return parsePixelRestorePreferences(raw);
}
