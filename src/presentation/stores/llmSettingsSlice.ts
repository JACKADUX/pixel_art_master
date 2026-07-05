import { parseLlmSettingsStore, type LlmSettingsStore } from "@/domain/llm/LlmSettings";
import { saveLlmSettings } from "@/application/use-cases/SaveLlmSettings";
import type { ILlmSettingsRepository } from "@/application/ports/ILlmSettingsRepository";
import {
  clampLlmTimeoutMs,
  resolveActiveLlmSettings,
  setActiveProvider,
  updateActiveProviderConfig,
  type LlmSettings,
} from "@/domain/llm/LlmSettings";
import type { LlmProviderId } from "@/domain/llm/LlmProvider";
import {
  getActiveSoftwareDataPath,
  isUserDataHydrating,
} from "@/infrastructure/storage/UserDataPersistenceContext";

export interface LlmSettingsSliceState {
  llmSettingsStore: LlmSettingsStore;
}

export interface LlmSettingsSliceActions {
  setLlmSettingsStore: (store: LlmSettingsStore) => void;
  setLlmProvider: (provider: LlmProviderId) => void;
  setLlmApiKey: (apiKey: string) => void;
  setLlmBaseUrl: (baseUrl: string) => void;
  setLlmModel: (model: string) => void;
  setLlmTimeoutSeconds: (seconds: number) => void;
  getActiveLlmSettings: () => LlmSettings;
}

type LlmSettingsSet = (
  partial:
    | Partial<LlmSettingsSliceState>
    | ((state: LlmSettingsSliceState) => Partial<LlmSettingsSliceState>),
) => void;

type LlmSettingsGet = () => LlmSettingsSliceState;

export function createLlmSettingsInitialState(): LlmSettingsSliceState {
  return {
    llmSettingsStore: parseLlmSettingsStore(null),
  };
}

export function createLlmSettingsSlice(
  set: LlmSettingsSet,
  get: LlmSettingsGet,
  _repository: ILlmSettingsRepository,
): LlmSettingsSliceState & LlmSettingsSliceActions {
  return {
    ...createLlmSettingsInitialState(),

    setLlmSettingsStore: (store) => set({ llmSettingsStore: store }),

    setLlmProvider: (provider) =>
      set((state) => ({
        llmSettingsStore: setActiveProvider(state.llmSettingsStore, provider),
      })),

    setLlmApiKey: (apiKey) =>
      set((state) => ({
        llmSettingsStore: updateActiveProviderConfig(state.llmSettingsStore, { apiKey }),
      })),

    setLlmBaseUrl: (baseUrl) =>
      set((state) => ({
        llmSettingsStore: updateActiveProviderConfig(state.llmSettingsStore, { baseUrl }),
      })),

    setLlmModel: (model) =>
      set((state) => ({
        llmSettingsStore: updateActiveProviderConfig(state.llmSettingsStore, { model }),
      })),

    setLlmTimeoutSeconds: (seconds) =>
      set((state) => ({
        llmSettingsStore: updateActiveProviderConfig(state.llmSettingsStore, {
          timeoutMs: clampLlmTimeoutMs(seconds * 1000),
        }),
      })),

    getActiveLlmSettings: () => resolveActiveLlmSettings(get().llmSettingsStore),
  };
}

let llmSettingsSaveTimer: ReturnType<typeof setTimeout> | null = null;

export function subscribeLlmSettingsPersistence(
  getState: () => LlmSettingsSliceState,
  repository: ILlmSettingsRepository,
): void {
  if (isUserDataHydrating()) return;

  const softwareDataPath = getActiveSoftwareDataPath();
  if (!softwareDataPath) return;

  if (llmSettingsSaveTimer) {
    clearTimeout(llmSettingsSaveTimer);
  }

  llmSettingsSaveTimer = setTimeout(() => {
    void saveLlmSettings(repository, softwareDataPath, getState().llmSettingsStore);
    llmSettingsSaveTimer = null;
  }, 300);
}

export function setLlmSettingsHydrating(_value: boolean): void {
  // Kept for API compatibility with appStore init.
}
