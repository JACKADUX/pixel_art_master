import {
  buildAgentProfilesPath,
  buildAppSettingsPath,
  buildColorEditPreferencesPath,
  buildComfyPromptPresetsPath,
  buildComfyUiOutputTypesPath,
  buildComfyUiSettingsPath,
  buildEditorPreferencesPath,
  buildFieldPromptConfigsPath,
  buildImageExportPreferencesPath,
  buildLastOpenedProjectPath,
  buildLlmSettingsPath,
  buildMigrationManifestPath,
  buildPalettePresetsPath,
  buildPixelRestorePreferencesPath,
  buildRecentProjectsPath,
  buildWindowAlwaysOnTopPath,
  buildWorldAgentSettingsPath,
} from "@/domain/softwareDataPath/UserDataPaths";

export interface UserDataMigrationEntry {
  localStorageKey: string;
  buildPath: (softwareDataPath: string) => string;
}

export const USER_DATA_MIGRATION_ENTRIES: readonly UserDataMigrationEntry[] = [
  { localStorageKey: "pixelart.app.settings", buildPath: buildAppSettingsPath },
  { localStorageKey: "pixelart-editor-preferences", buildPath: buildEditorPreferencesPath },
  { localStorageKey: "pixelart-palette-presets", buildPath: buildPalettePresetsPath },
  { localStorageKey: "pixelart-comfy-prompt-presets", buildPath: buildComfyPromptPresetsPath },
  {
    localStorageKey: "pixelart-image-export-preferences",
    buildPath: buildImageExportPreferencesPath,
  },
  { localStorageKey: "pixelart.colorEdit.preferences", buildPath: buildColorEditPreferencesPath },
  {
    localStorageKey: "pixelart-pixel-restore-preferences",
    buildPath: buildPixelRestorePreferencesPath,
  },
  { localStorageKey: "pixelart.llm.settings", buildPath: buildLlmSettingsPath },
  { localStorageKey: "pixelart.comfyui.settings", buildPath: buildComfyUiSettingsPath },
  { localStorageKey: "pixelart.comfyui.outputClassTypes", buildPath: buildComfyUiOutputTypesPath },
  { localStorageKey: "pixelart.world.agentSettings", buildPath: buildWorldAgentSettingsPath },
  { localStorageKey: "pixelart.aiTextField.agentProfiles", buildPath: buildAgentProfilesPath },
  {
    localStorageKey: "pixelart.aiTextField.fieldPromptConfigs",
    buildPath: buildFieldPromptConfigsPath,
  },
  { localStorageKey: "pixelart-recent-projects", buildPath: buildRecentProjectsPath },
  { localStorageKey: "pixelart-last-opened-project", buildPath: buildLastOpenedProjectPath },
  { localStorageKey: "pixelart-always-on-top", buildPath: buildWindowAlwaysOnTopPath },
];

export const MIGRATION_MANIFEST_VERSION = 1;

export function buildMigrationManifestPathFor(softwareDataPath: string): string {
  return buildMigrationManifestPath(softwareDataPath);
}

export function readLocalStorageJson(key: string): unknown | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as unknown;
  } catch {
    return null;
  }
}

export function readLocalStorageString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function clearLocalStorageKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
