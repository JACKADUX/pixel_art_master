import type { IPalettePresetRepository } from "@/application/ports/IPalettePresetRepository";
import {
  importPresetIntoPalette,
  type PalettePresetImportMode,
} from "@/application/use-cases/PalettePresetUseCases";
import {
  addPalettePreset,
  createEmptyPalettePresetLibrary,
  getPalettePreset,
  removePalettePreset,
  renamePalettePresetInLibrary,
  updatePresetColorsInLibrary,
  type PalettePresetLibrary,
} from "@/domain/palette/PalettePresetLibrary";
import type { Project } from "@/domain/project/Project";
import { toast } from "@/presentation/stores/toastStore";

export interface PalettePresetDeleteTarget {
  id: string;
  name: string;
}

export interface PalettePresetSliceState {
  palettePresetLibrary: PalettePresetLibrary;
  palettePresetManagerOpen: boolean;
  deletePalettePresetTarget: PalettePresetDeleteTarget | null;
}

export interface PalettePresetSliceActions {
  loadPalettePresets: () => void;
  saveCurrentPaletteAsPreset: (name?: string) => void;
  overwritePalettePreset: (id: string) => void;
  renamePalettePresetAction: (id: string, name: string) => void;
  requestDeletePalettePreset: (id: string) => void;
  cancelDeletePalettePreset: () => void;
  confirmDeletePalettePreset: () => void;
  importPresetToPalette: (id: string, mode: PalettePresetImportMode) => void;
  openPalettePresetManager: () => void;
  closePalettePresetManager: () => void;
}

type PalettePresetSet = (
  partial:
    | Partial<PalettePresetSliceState & { project: Project | null }>
    | ((
        state: PalettePresetSliceState,
      ) => Partial<PalettePresetSliceState & { project: Project | null }>),
) => void;

type PalettePresetGet = () => PalettePresetSliceState & {
  project: Project | null;
};

export function createPalettePresetInitialState(): PalettePresetSliceState {
  return {
    palettePresetLibrary: createEmptyPalettePresetLibrary(),
    palettePresetManagerOpen: false,
    deletePalettePresetTarget: null,
  };
}

export function createPalettePresetSlice(
  set: PalettePresetSet,
  get: PalettePresetGet,
  deps: {
    palettePresetRepository: IPalettePresetRepository;
  },
): PalettePresetSliceState & PalettePresetSliceActions {
  const persist = (library: PalettePresetLibrary) => {
    set({ palettePresetLibrary: library });
    deps.palettePresetRepository.save(library);
  };

  return {
    ...createPalettePresetInitialState(),

    loadPalettePresets: () => {
      const loaded = deps.palettePresetRepository.load();
      if (loaded && typeof loaded === "object" && "presets" in loaded) {
        set({ palettePresetLibrary: loaded as PalettePresetLibrary });
      }
    },

    saveCurrentPaletteAsPreset: (name) => {
      const project = get().project;
      if (!project) return;
      const colors = project.palette.getColors();
      if (colors.length === 0) {
        toast.info("色板为空，无法保存为预设");
        return;
      }
      const { library, preset } = addPalettePreset(
        get().palettePresetLibrary,
        colors,
        name,
      );
      persist(library);
      toast.info(`已保存预设「${preset.name}」`);
    },

    overwritePalettePreset: (id) => {
      const project = get().project;
      if (!project) return;
      const library = get().palettePresetLibrary;
      const preset = getPalettePreset(library, id);
      if (!preset) return;
      const colors = project.palette.getColors();
      if (colors.length === 0) {
        toast.info("色板为空，无法覆盖预设");
        return;
      }
      persist(updatePresetColorsInLibrary(library, id, colors));
      toast.info(`已用当前色板覆盖「${preset.name}」`);
    },

    renamePalettePresetAction: (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      persist(renamePalettePresetInLibrary(get().palettePresetLibrary, id, trimmed));
    },

    requestDeletePalettePreset: (id) => {
      const preset = getPalettePreset(get().palettePresetLibrary, id);
      if (!preset) return;
      set({ deletePalettePresetTarget: { id: preset.id, name: preset.name } });
    },

    cancelDeletePalettePreset: () => set({ deletePalettePresetTarget: null }),

    confirmDeletePalettePreset: () => {
      const target = get().deletePalettePresetTarget;
      if (!target) return;
      persist(removePalettePreset(get().palettePresetLibrary, target.id));
      set({ deletePalettePresetTarget: null });
      toast.info(`已删除预设「${target.name}」`);
    },

    importPresetToPalette: (id, mode) => {
      const project = get().project;
      if (!project) {
        toast.info("请先打开项目");
        return;
      }
      const preset = getPalettePreset(get().palettePresetLibrary, id);
      if (!preset) {
        toast.error("预设不存在");
        return;
      }
      set({ project: importPresetIntoPalette(project, preset, mode) });
      toast.info(
        mode === "replace"
          ? `已用预设「${preset.name}」替换色板`
          : `已从预设「${preset.name}」合并到色板`,
      );
    },

    openPalettePresetManager: () => set({ palettePresetManagerOpen: true }),

    closePalettePresetManager: () => {
      if (get().deletePalettePresetTarget) {
        set({ palettePresetManagerOpen: false, deletePalettePresetTarget: null });
        return;
      }
      set({ palettePresetManagerOpen: false });
    },
  };
}
