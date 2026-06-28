import { create } from "zustand";
import { loadWorldAgentSettings } from "@/application/use-cases/LoadWorldAgentSettings";
import { saveWorldAgentSettings } from "@/application/use-cases/SaveWorldAgentSettings";
import {
  clampMaxTokens,
  clampTemperature,
  clampTopP,
  extractWorldAgentSettings,
  type DeepSeekModel,
  type ThinkingEffort,
  type WorldAgentSettings,
} from "@/domain/world/WorldAgentSettings";
import { worldAgentSettingsRepository } from "@/infrastructure/storage/LocalWorldAgentSettingsRepository";

interface WorldAgentSettingsStore extends WorldAgentSettings {
  modalOpen: boolean;

  openModal: () => void;
  closeModal: () => void;

  setModel: (model: DeepSeekModel) => void;
  setTemperature: (temperature: number) => void;
  setTopP: (topP: number) => void;
  setSampling: (temperature: number, topP: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setThinkingEnabled: (enabled: boolean) => void;
  setThinkingEffort: (effort: ThinkingEffort) => void;
}

const loadedSettings = loadWorldAgentSettings(worldAgentSettingsRepository);

let isHydrating = true;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

isHydrating = false;

export const useWorldAgentSettingsStore = create<WorldAgentSettingsStore>((set) => ({
  ...loadedSettings,
  modalOpen: false,

  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),

  setModel: (model) => set({ model }),
  setTemperature: (temperature) => set({ temperature: clampTemperature(temperature) }),
  setTopP: (topP) => set({ topP: clampTopP(topP) }),
  setSampling: (temperature, topP) =>
    set({ temperature: clampTemperature(temperature), topP: clampTopP(topP) }),
  setMaxTokens: (maxTokens) => set({ maxTokens: clampMaxTokens(maxTokens) }),
  setThinkingEnabled: (thinkingEnabled) => set({ thinkingEnabled }),
  setThinkingEffort: (thinkingEffort) => set({ thinkingEffort }),
}));

useWorldAgentSettingsStore.subscribe((state, prev) => {
  if (isHydrating) return;
  if (
    state.model === prev.model &&
    state.temperature === prev.temperature &&
    state.topP === prev.topP &&
    state.maxTokens === prev.maxTokens &&
    state.thinkingEnabled === prev.thinkingEnabled &&
    state.thinkingEffort === prev.thinkingEffort
  ) {
    return;
  }

  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveWorldAgentSettings(worldAgentSettingsRepository, extractWorldAgentSettings(state));
    saveTimer = null;
  }, 300);
});
