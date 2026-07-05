import { exists } from "@tauri-apps/plugin-fs";
import {
  MIGRATION_MANIFEST_VERSION,
  USER_DATA_MIGRATION_ENTRIES,
  buildMigrationManifestPathFor,
  clearLocalStorageKey,
  readLocalStorageJson,
  readLocalStorageString,
} from "@/infrastructure/storage/UserDataMigrationKeys";
import {
  ensureUserDataDir,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

function wrapLastOpenedProject(raw: string): { path: string } {
  return { path: raw };
}

function wrapAlwaysOnTop(raw: string): { alwaysOnTop: boolean } {
  return { alwaysOnTop: raw === "true" };
}

export async function migrateUserDataFromLocalStorage(
  softwareDataPath: string,
): Promise<void> {
  await ensureUserDataDir(softwareDataPath);

  const manifestPath = buildMigrationManifestPathFor(softwareDataPath);
  if (await exists(manifestPath)) {
    return;
  }

  for (const entry of USER_DATA_MIGRATION_ENTRIES) {
    const filePath = entry.buildPath(softwareDataPath);
    if (await exists(filePath)) {
      continue;
    }

    let payload: unknown | null = null;

    if (entry.localStorageKey === "pixelart-last-opened-project") {
      const raw = readLocalStorageString(entry.localStorageKey);
      if (raw) payload = wrapLastOpenedProject(raw);
    } else if (entry.localStorageKey === "pixelart-always-on-top") {
      const raw = readLocalStorageString(entry.localStorageKey);
      if (raw !== null) payload = wrapAlwaysOnTop(raw);
    } else {
      payload = readLocalStorageJson(entry.localStorageKey);
    }

    if (payload === null) {
      continue;
    }

    await writeUserDataJson(softwareDataPath, filePath, payload);
    clearLocalStorageKey(entry.localStorageKey);
  }

  await writeUserDataJson(softwareDataPath, manifestPath, {
    version: MIGRATION_MANIFEST_VERSION,
    migratedAt: new Date().toISOString(),
  });
}
