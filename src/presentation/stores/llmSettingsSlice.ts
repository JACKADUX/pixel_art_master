import { loadLlmSettings } from "@/application/use-cases/LoadLlmSettings";
import { saveLlmSettings } from "@/application/use-cases/SaveLlmSettings";
import type { ILlmSettingsRepository } from "@/application/ports/ILlmSettingsRepository";
import {
  clampLlmTimeoutMs,
  normalizeBaseUrl,
  withLlmProvider,
  type LlmSettings,
} from "@/domain/llm/LlmSettings";
import type { LlmProviderId } from "@/domain/llm/LlmProvider";

export interface LlmSettingsSliceState {
  llmSettings: LlmSettings;
}

export interface LlmSettingsSliceActions {
  setLlmSettings: (settings: LlmSettings) => void;
  updateLlmSettings: (partial: Partial<LlmSettings>) => void;
  setLlmProvider: (provider: LlmProviderId) => void;
  setLlmApiKey: (apiKey: string) => void;
  setLlmBaseUrl: (baseUrl: string) => void;
  setLlmModel: (model: string) => void;
  setLlmTimeoutSeconds: (seconds: number) => void;
}

type LlmSettingsSet = (
  partial:
    | Partial<LlmSettingsSliceState>
    | ((state: LlmSettingsSliceState) => Partial<LlmSettingsSliceState>),
) => void;

export function createLlmSettingsInitialState(
  repository: ILlmSettingsRepository,
): LlmSettingsSliceState {
  return {
    llmSettings: loadLlmSettings(repository),
  };
}

export function createLlmSettingsSlice(
  set: LlmSettingsSet,
  repository: ILlmSettingsRepository,
): LlmSettingsSliceState & LlmSettingsSliceActions {
  return {
    ...createLlmSettingsInitialState(repository),

    setLlmSettings: (settings) => set({ llmSettings: settings }),

    updateLlmSettings: (partial) =>
      set((state) => ({
        llmSettings: { ...state.llmSettings, ...partial },
      })),

    setLlmProvider: (provider) =>
      set((state) => ({
        llmSettings: withLlmProvider(state.llmSettings, provider),
      })),

    setLlmApiKey: (apiKey) =>
      set((state) => ({
        llmSettings: { ...state.llmSettings, apiKey },
      })),

    setLlmBaseUrl: (baseUrl) =>
      set((state) => ({
        llmSettings: { ...state.llmSettings, baseUrl: normalizeBaseUrl(baseUrl) },
      })),

    setLlmModel: (model) =>
      set((state) => ({
        llmSettings: { ...state.llmSettings, model: model.trim() },
      })),

    setLlmTimeoutSeconds: (seconds) =>
      set((state) => ({
        llmSettings: {
          ...state.llmSettings,
          timeoutMs: clampLlmTimeoutMs(seconds * 1000),
        },
      })),
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
    saveLlmSettings(repository, getState().llmSettings);
    llmSettingsSaveTimer = null;
  }, 300);
}
