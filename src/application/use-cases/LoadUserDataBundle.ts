import type { IAgentProfileRepository } from "@/application/ports/IAgentProfileRepository";
import type { IAppSettingsRepository } from "@/application/ports/IAppSettingsRepository";
import type { IColorEditPreferencesRepository } from "@/application/ports/IColorEditPreferencesRepository";
import type { IComfyUiSettingsRepository } from "@/application/ports/IComfyUiSettingsRepository";
import type { IEditorPreferencesRepository } from "@/application/ports/IEditorPreferencesRepository";
import type { IFieldPromptConfigRepository } from "@/application/ports/IFieldPromptConfigRepository";
import type { IImageExportPreferencesRepository } from "@/application/ports/IImageExportPreferencesRepository";
import type { ILlmSettingsRepository } from "@/application/ports/ILlmSettingsRepository";
import type { IPalettePresetRepository } from "@/application/ports/IPalettePresetRepository";
import type { IPixelRestorePreferencesRepository } from "@/application/ports/IPixelRestorePreferencesRepository";
import type { IPromptPresetRepository } from "@/application/ports/IPromptPresetRepository";
import type { IWindowPreferencesStore } from "@/application/ports/IWindowPreferencesStore";
import type { IWorldAgentSettingsRepository } from "@/application/ports/IWorldAgentSettingsRepository";
import { parseAppSettings, type AppSettings } from "@/domain/appSettings/AppSettings";
import type { AgentProfile } from "@/domain/aiTextField/AgentProfile";
import type { FieldPromptConfig } from "@/domain/aiTextField/FieldPromptConfig";
import type { ColorEditPreferences } from "@/domain/colorEdit/ColorEditPreferences";
import type { ComfyServerConfig } from "@/domain/comfyui/ComfyServerConfig";
import { parseImageExportPreferences, type ImageExportPreferences } from "@/domain/export/ImageExportPreferences";
import type { LlmSettingsStore } from "@/domain/llm/LlmSettings";
import {
  createEmptyPalettePresetLibrary,
  type PalettePresetLibrary,
} from "@/domain/palette/PalettePresetLibrary";
import type { PixelRestorePreferences } from "@/domain/pixelRestore/PixelRestorePreferences";
import type { EditorPreferences } from "@/domain/preferences/EditorPreferences";
import type { WorldAgentSettings } from "@/domain/world/WorldAgentSettings";
import { loadAgentProfiles } from "./LoadAgentProfiles";
import { loadComfyOutputClassTypes } from "./LoadComfyOutputClassTypes";
import { loadWorldAgentSettings } from "./LoadWorldAgentSettings";
import { loadComfyUiSettings } from "./LoadComfyUiSettings";
import { loadColorEditPreferences } from "./LoadColorEditPreferences";
import { loadEditorPreferences } from "./LoadEditorPreferences";
import { loadFieldPromptConfigs } from "./LoadFieldPromptConfigs";
import { loadLlmSettings } from "./LoadLlmSettings";
import { loadPixelRestorePreferences } from "./LoadPixelRestorePreferences";
import {
  createEmptyPromptPresetLibrary,
  parsePromptPresetLibrary,
  type PromptPresetLibrary,
} from "@/domain/comfyApp/PromptPresetLibrary";

export interface UserDataBundle {
  appSettings: AppSettings;
  editorPreferences: EditorPreferences | null;
  palettePresetLibrary: PalettePresetLibrary;
  promptPresetLibrary: PromptPresetLibrary;
  imageExportPreferences: ImageExportPreferences;
  colorEditPreferences: ColorEditPreferences | null;
  pixelRestorePreferences: PixelRestorePreferences | null;
  llmSettingsStore: LlmSettingsStore;
  serverConfig: ComfyServerConfig;
  outputClassTypes: string[];
  worldAgentSettings: WorldAgentSettings;
  agentProfiles: AgentProfile[];
  fieldPromptConfigs: Record<string, FieldPromptConfig>;
  alwaysOnTop: boolean;
}

export interface UserDataRepositories {
  appSettingsRepository: IAppSettingsRepository;
  editorPreferencesRepository: IEditorPreferencesRepository;
  palettePresetRepository: IPalettePresetRepository;
  promptPresetRepository: IPromptPresetRepository;
  imageExportPreferencesRepository: IImageExportPreferencesRepository;
  colorEditPreferencesRepository: IColorEditPreferencesRepository;
  pixelRestorePreferencesRepository: IPixelRestorePreferencesRepository;
  llmSettingsRepository: ILlmSettingsRepository;
  comfyUiSettingsRepository: IComfyUiSettingsRepository;
  worldAgentSettingsRepository: IWorldAgentSettingsRepository;
  agentProfileRepository: IAgentProfileRepository;
  fieldPromptConfigRepository: IFieldPromptConfigRepository;
  windowPreferencesStore: IWindowPreferencesStore;
}

export async function loadUserDataBundle(
  softwareDataPath: string,
  repositories: UserDataRepositories,
): Promise<UserDataBundle> {
  const [
    editorPreferences,
    paletteRaw,
    promptRaw,
    imageExportRaw,
    colorEditPreferences,
    pixelRestorePreferences,
    llmSettingsStore,
    serverConfig,
    outputClassTypes,
    worldAgentSettings,
    agentProfiles,
    fieldPromptConfigs,
    alwaysOnTop,
    appSettingsRaw,
  ] = await Promise.all([
    loadEditorPreferences(repositories.editorPreferencesRepository, softwareDataPath),
    repositories.palettePresetRepository.load(softwareDataPath),
    repositories.promptPresetRepository.load(softwareDataPath),
    repositories.imageExportPreferencesRepository.load(softwareDataPath),
    loadColorEditPreferences(repositories.colorEditPreferencesRepository, softwareDataPath),
    loadPixelRestorePreferences(repositories.pixelRestorePreferencesRepository, softwareDataPath),
    loadLlmSettings(repositories.llmSettingsRepository, softwareDataPath),
    loadComfyUiSettings(repositories.comfyUiSettingsRepository, softwareDataPath),
    loadComfyOutputClassTypes(repositories.comfyUiSettingsRepository, softwareDataPath),
    loadWorldAgentSettings(repositories.worldAgentSettingsRepository, softwareDataPath),
    loadAgentProfiles(repositories.agentProfileRepository, softwareDataPath),
    loadFieldPromptConfigs(repositories.fieldPromptConfigRepository, softwareDataPath),
    repositories.windowPreferencesStore.loadAlwaysOnTop(softwareDataPath),
    repositories.appSettingsRepository.load(softwareDataPath),
  ]);

  const appSettings = parseAppSettings(appSettingsRaw);

  const palettePresetLibrary: PalettePresetLibrary =
    paletteRaw && typeof paletteRaw === "object" && "presets" in paletteRaw
      ? {
          ...createEmptyPalettePresetLibrary(),
          ...(paletteRaw as PalettePresetLibrary),
          defaultPresetId: (paletteRaw as PalettePresetLibrary).defaultPresetId ?? null,
        }
      : createEmptyPalettePresetLibrary();

  const promptPresetLibrary = promptRaw
    ? parsePromptPresetLibrary(promptRaw)
    : createEmptyPromptPresetLibrary();

  const imageExportPreferences = parseImageExportPreferences(imageExportRaw);

  return {
    appSettings,
    editorPreferences,
    palettePresetLibrary,
    promptPresetLibrary,
    imageExportPreferences,
    colorEditPreferences,
    pixelRestorePreferences,
    llmSettingsStore,
    serverConfig,
    outputClassTypes,
    worldAgentSettings,
    agentProfiles,
    fieldPromptConfigs,
    alwaysOnTop,
  };
}
