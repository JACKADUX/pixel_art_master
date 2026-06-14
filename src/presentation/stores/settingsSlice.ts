export interface SettingsSliceState {
  settingsModalOpen: boolean;
}

export interface SettingsSliceActions {
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
}

type SettingsSet = (
  partial:
    | Partial<SettingsSliceState>
    | ((state: SettingsSliceState) => Partial<SettingsSliceState>),
) => void;

export function createSettingsInitialState(): SettingsSliceState {
  return {
    settingsModalOpen: false,
  };
}

export function createSettingsSlice(set: SettingsSet): SettingsSliceState & SettingsSliceActions {
  return {
    ...createSettingsInitialState(),

    openSettingsModal: () => set({ settingsModalOpen: true }),

    closeSettingsModal: () => set({ settingsModalOpen: false }),
  };
}
