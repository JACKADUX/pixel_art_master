import { loadLlmSettings } from "@/application/use-cases/LoadLlmSettings";
import { saveLlmSettings } from "@/application/use-cases/SaveLlmSettings";
import type { ILlmSettingsRepository } from "@/application/ports/ILlmSettingsRepository";
import {
  clampLlmTimeoutMs,
  resolveActiveLlmSettings,
  setActiveProvider,
  updateActiveProviderConfig,
  type LlmSettings,
  type LlmSettingsStore,
} from "@/domain/llm/LlmSettings";
import type { LlmProviderId } from "@/domain/llm/LlmProvider";

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

export function createLlmSettingsInitialState(
  repository: ILlmSettingsRepository,
): LlmSettingsSliceState {
  return {
    llmSettingsStore: loadLlmSettings(repository),
  };
}

export function createLlmSettingsSlice(
  set: LlmSettingsSet,
  get: LlmSettingsGet,
  repository: ILlmSettingsRepository,
): LlmSettingsSliceState & LlmSettingsSliceActions {
  return {
    ...createLlmSettingsInitialState(repository),

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
  if (llmSettingsSaveTimer) {
    clearTimeout(llmSettingsSaveTimer);
  }

  llmSettingsSaveTimer = setTimeout(() => {
    saveLlmSettings(repository, getState().llmSettingsStore);
    llmSettingsSaveTimer = null;
  }, 300);
}

/** 从 store 状态选取当前活跃 LLM 配置 */
export function selectActiveLlmSettings(state: LlmSettingsSliceState): LlmSettings {
  return resolveActiveLlmSettings(state.llmSettingsStore);
}
