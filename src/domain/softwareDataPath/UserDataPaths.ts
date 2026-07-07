export const USER_DATA_DIR = ".pixelart-user-data";

export const MIGRATION_MANIFEST_FILE = "migration-manifest.json";
export const APP_SETTINGS_FILE = "app-settings.json";
export const EDITOR_PREFERENCES_FILE = "editor-preferences.json";
export const PALETTE_PRESETS_FILE = "palette-presets.json";
export const COMFY_PROMPT_PRESETS_FILE = "comfy-prompt-presets.json";
export const IMAGE_EXPORT_PREFERENCES_FILE = "image-export-preferences.json";
export const COLOR_EDIT_PREFERENCES_FILE = "color-edit-preferences.json";
export const PIXEL_RESTORE_PREFERENCES_FILE = "pixel-restore-preferences.json";
export const COLOR_VARIATION_ANALYSIS_PREFERENCES_FILE =
  "color-variation-analysis-preferences.json";
export const LLM_SETTINGS_FILE = "llm-settings.json";
export const COMFYUI_SETTINGS_FILE = "comfyui-settings.json";
export const COMFYUI_OUTPUT_TYPES_FILE = "comfyui-output-types.json";
export const WORLD_AGENT_SETTINGS_FILE = "world-agent-settings.json";
export const AGENT_PROFILES_FILE = "agent-profiles.json";
export const FIELD_PROMPT_CONFIGS_FILE = "field-prompt-configs.json";
export const RECENT_PROJECTS_FILE = "recent-projects.json";
export const LAST_OPENED_PROJECT_FILE = "last-opened-project.json";
export const WINDOW_ALWAYS_ON_TOP_FILE = "window-always-on-top.json";

export function joinPath(base: string, segment: string): string {
  const separator = base.includes("\\") ? "\\" : "/";
  const normalized = base.replace(/[/\\]+$/, "");
  return `${normalized}${separator}${segment}`;
}

export function buildUserDataRoot(softwareDataPath: string): string {
  return joinPath(softwareDataPath, USER_DATA_DIR);
}

export function buildMigrationManifestPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), MIGRATION_MANIFEST_FILE);
}

export function buildAppSettingsPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), APP_SETTINGS_FILE);
}

export function buildEditorPreferencesPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), EDITOR_PREFERENCES_FILE);
}

export function buildPalettePresetsPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), PALETTE_PRESETS_FILE);
}

export function buildComfyPromptPresetsPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), COMFY_PROMPT_PRESETS_FILE);
}

export function buildImageExportPreferencesPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), IMAGE_EXPORT_PREFERENCES_FILE);
}

export function buildColorEditPreferencesPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), COLOR_EDIT_PREFERENCES_FILE);
}

export function buildPixelRestorePreferencesPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), PIXEL_RESTORE_PREFERENCES_FILE);
}

export function buildColorVariationAnalysisPreferencesPath(softwareDataPath: string): string {
  return joinPath(
    buildUserDataRoot(softwareDataPath),
    COLOR_VARIATION_ANALYSIS_PREFERENCES_FILE,
  );
}

export function buildLlmSettingsPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), LLM_SETTINGS_FILE);
}

export function buildComfyUiSettingsPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), COMFYUI_SETTINGS_FILE);
}

export function buildComfyUiOutputTypesPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), COMFYUI_OUTPUT_TYPES_FILE);
}

export function buildWorldAgentSettingsPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), WORLD_AGENT_SETTINGS_FILE);
}

export function buildAgentProfilesPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), AGENT_PROFILES_FILE);
}

export function buildFieldPromptConfigsPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), FIELD_PROMPT_CONFIGS_FILE);
}

export function buildRecentProjectsPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), RECENT_PROJECTS_FILE);
}

export function buildLastOpenedProjectPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), LAST_OPENED_PROJECT_FILE);
}

export function buildWindowAlwaysOnTopPath(softwareDataPath: string): string {
  return joinPath(buildUserDataRoot(softwareDataPath), WINDOW_ALWAYS_ON_TOP_FILE);
}
