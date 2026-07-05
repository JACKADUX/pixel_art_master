import { create } from "zustand";
import { saveWorldAgentSettings } from "@/application/use-cases/SaveWorldAgentSettings";
import {
  clampMaxTokens,
  clampTemperature,
  clampTopP,
  extractWorldAgentSettings,
  parseWorldAgentSettings,
  type DeepSeekModel,
  type ThinkingEffort,
  type WorldAgentSettings,
} from "@/domain/world/WorldAgentSettings";
import { worldAgentSettingsRepository } from "@/infrastructure/storage/FileWorldAgentSettingsRepository";
import {
  getActiveSoftwareDataPath,
  isUserDataHydrating,
} from "@/infrastructure/storage/UserDataPersistenceContext";

interface WorldAgentSettingsStore extends WorldAgentSettings {
  modalOpen: boolean;

  openModal: () => void;
  closeModal: () => void;
  hydrateSettings: (settings: WorldAgentSettings) => void;

  setModel: (model: DeepSeekModel) => void;
  setTemperature: (temperature: number) => void;
  setTopP: (topP: number) => void;
  setSampling: (temperature: number, topP: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setThinkingEnabled: (enabled: boolean) => void;
  setThinkingEffort: (effort: ThinkingEffort) => void;
}

let isHydrating = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useWorldAgentSettingsStore = create<WorldAgentSettingsStore>((set) => ({
  ...parseWorldAgentSettings(null),
  modalOpen: false,

  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),

  hydrateSettings: (settings) => {
    isHydrating = true;
    set({ ...settings });
    isHydrating = false;
  },

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
  if (isHydrating || isUserDataHydrating()) return;
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
    const softwareDataPath = getActiveSoftwareDataPath();
    if (!softwareDataPath) {
      saveTimer = null;
      return;
    }
    void saveWorldAgentSettings(
      worldAgentSettingsRepository,
      softwareDataPath,
      extractWorldAgentSettings(state),
    );
    saveTimer = null;
  }, 300);
});
