export interface HelpSliceState {
  aboutModalOpen: boolean;
  shortcutReferenceModalOpen: boolean;
}

export interface HelpSliceActions {
  openAboutModal: () => void;
  closeAboutModal: () => void;
  openShortcutReferenceModal: () => void;
  closeShortcutReferenceModal: () => void;
}

type HelpSet = (
  partial:
    | Partial<HelpSliceState>
    | ((state: HelpSliceState) => Partial<HelpSliceState>),
) => void;

export function createHelpInitialState(): HelpSliceState {
  return {
    aboutModalOpen: false,
    shortcutReferenceModalOpen: false,
  };
}

export function createHelpSlice(set: HelpSet): HelpSliceState & HelpSliceActions {
  return {
    ...createHelpInitialState(),

    openAboutModal: () => set({ aboutModalOpen: true }),

    closeAboutModal: () => set({ aboutModalOpen: false }),

    openShortcutReferenceModal: () => set({ shortcutReferenceModalOpen: true }),

    closeShortcutReferenceModal: () => set({ shortcutReferenceModalOpen: false }),
  };
}
