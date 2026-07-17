import type { ILuminancePalettePresetRepository } from "@/application/ports/ILuminancePalettePresetRepository";
import type { ISoftwareDataPathStore } from "@/application/ports/ISoftwareDataPathStore";
import { ensureSoftwareDataPathAccess } from "@/application/use-cases/EnsureSoftwareDataPathAccess";
import type { LuminancePaletteData } from "@/domain/luminancePalette/LuminancePalette";
import {
  addLuminancePalettePreset,
  createEmptyLuminancePalettePresetLibrary,
  getLuminancePalettePreset,
  listLuminancePalettePresets,
  removeLuminancePalettePreset,
  renameLuminancePalettePresetInLibrary,
  updateLuminancePalettePresetInLibrary,
  type LuminancePalettePresetLibrary,
} from "@/domain/luminancePalette/LuminancePalettePresetLibrary";
import type { Project } from "@/domain/project/Project";
import {
  getActiveSoftwareDataPath,
  isUserDataHydrating,
} from "@/infrastructure/storage/UserDataPersistenceContext";
import { toast } from "@/presentation/stores/toastStore";

export interface LuminancePalettePresetDeleteTarget {
  id: string;
  name: string;
}

export interface LuminancePalettePresetSliceState {
  luminancePalettePresetLibrary: LuminancePalettePresetLibrary;
  luminancePalettePresetManagerOpen: boolean;
  deleteLuminancePalettePresetTarget: LuminancePalettePresetDeleteTarget | null;
}

export interface LuminancePalettePresetSliceActions {
  loadLuminancePalettePresets: () => Promise<void>;
  hydrateLuminancePalettePresetLibrary: (library: LuminancePalettePresetLibrary) => void;
  saveCurrentLuminancePaletteAsPreset: (name?: string) => Promise<void>;
  overwriteLuminancePalettePreset: (id: string) => void;
  renameLuminancePalettePresetAction: (id: string, name: string) => void;
  requestDeleteLuminancePalettePreset: (id: string) => void;
  cancelDeleteLuminancePalettePreset: () => void;
  confirmDeleteLuminancePalettePreset: () => void;
  importLuminancePalettePresetToProject: (id: string) => void;
  openLuminancePalettePresetManager: () => void;
  closeLuminancePalettePresetManager: () => void;
}

type LuminancePalettePresetSet = (
  partial:
    | Partial<LuminancePalettePresetSliceState & { project: Project | null }>
    | ((
        state: LuminancePalettePresetSliceState,
      ) => Partial<LuminancePalettePresetSliceState & { project: Project | null }>),
) => void;

type LuminancePalettePresetGet = () => LuminancePalettePresetSliceState & {
  project: Project | null;
  softwareDataPath: string | null;
  replaceProjectLuminancePalette: (
    data: Pick<LuminancePaletteData, "groups" | "groupArrangement">,
  ) => void;
};

export function createLuminancePalettePresetInitialState(): LuminancePalettePresetSliceState {
  return {
    luminancePalettePresetLibrary: createEmptyLuminancePalettePresetLibrary(),
    luminancePalettePresetManagerOpen: false,
    deleteLuminancePalettePresetTarget: null,
  };
}

export function createLuminancePalettePresetSlice(
  set: LuminancePalettePresetSet,
  get: LuminancePalettePresetGet,
  deps: {
    pathStore: ISoftwareDataPathStore;
    luminancePalettePresetRepository: ILuminancePalettePresetRepository;
  },
): LuminancePalettePresetSliceState & LuminancePalettePresetSliceActions {
  const resolveSoftwareDataPath = async (): Promise<string | null> => {
    const path = get().softwareDataPath ?? deps.pathStore.getPath();
    if (!path) {
      toast.info("请先选择软件数据路径");
      return null;
    }
    return ensureSoftwareDataPathAccess(deps.pathStore);
  };

  const persist = async (library: LuminancePalettePresetLibrary) => {
    set({ luminancePalettePresetLibrary: library });
    if (isUserDataHydrating()) return;
    const softwareDataPath = getActiveSoftwareDataPath() ?? (await resolveSoftwareDataPath());
    if (!softwareDataPath) return;
    await deps.luminancePalettePresetRepository.save(softwareDataPath, library);
  };

  return {
    ...createLuminancePalettePresetInitialState(),

    hydrateLuminancePalettePresetLibrary: (library) => {
      set({
        luminancePalettePresetLibrary: {
          ...createEmptyLuminancePalettePresetLibrary(),
          ...library,
        },
      });
    },

    loadLuminancePalettePresets: async () => {
      const softwareDataPath = await resolveSoftwareDataPath();
      if (!softwareDataPath) return;

      const loaded = await deps.luminancePalettePresetRepository.load(softwareDataPath);
      if (loaded && typeof loaded === "object" && "presets" in loaded) {
        const library = loaded as LuminancePalettePresetLibrary;
        set({
          luminancePalettePresetLibrary: {
            ...createEmptyLuminancePalettePresetLibrary(),
            ...library,
          },
        });
      }
    },

    saveCurrentLuminancePaletteAsPreset: async (name) => {
      const project = get().project;
      if (!project) return;
      if (project.luminancePalette.groups.length === 0) {
        toast.info("明度色板为空，无法保存为预设");
        return;
      }
      const { library, preset } = addLuminancePalettePreset(
        get().luminancePalettePresetLibrary,
        {
          groups: project.luminancePalette.groups,
          groupArrangement: project.luminancePalette.groupArrangement,
        },
        name,
      );
      await persist(library);
      toast.info(`已保存预设「${preset.name}」`);
    },

    overwriteLuminancePalettePreset: (id) => {
      const project = get().project;
      if (!project) return;
      const library = get().luminancePalettePresetLibrary;
      const preset = getLuminancePalettePreset(library, id);
      if (!preset) return;
      if (project.luminancePalette.groups.length === 0) {
        toast.info("明度色板为空，无法覆盖预设");
        return;
      }
      void persist(
        updateLuminancePalettePresetInLibrary(library, id, {
          groups: project.luminancePalette.groups,
          groupArrangement: project.luminancePalette.groupArrangement,
        }),
      );
      toast.info(`已用当前明度色板覆盖「${preset.name}」`);
    },

    renameLuminancePalettePresetAction: (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      void persist(renameLuminancePalettePresetInLibrary(get().luminancePalettePresetLibrary, id, trimmed));
    },

    requestDeleteLuminancePalettePreset: (id) => {
      const preset = getLuminancePalettePreset(get().luminancePalettePresetLibrary, id);
      if (!preset) return;
      set({ deleteLuminancePalettePresetTarget: { id: preset.id, name: preset.name } });
    },

    cancelDeleteLuminancePalettePreset: () => set({ deleteLuminancePalettePresetTarget: null }),

    confirmDeleteLuminancePalettePreset: () => {
      const target = get().deleteLuminancePalettePresetTarget;
      if (!target) return;
      void persist(removeLuminancePalettePreset(get().luminancePalettePresetLibrary, target.id));
      set({ deleteLuminancePalettePresetTarget: null });
      toast.info(`已删除预设「${target.name}」`);
    },

    importLuminancePalettePresetToProject: (id) => {
      const project = get().project;
      if (!project) {
        toast.info("请先打开项目");
        return;
      }
      const preset = getLuminancePalettePreset(get().luminancePalettePresetLibrary, id);
      if (!preset) {
        toast.error("预设不存在");
        return;
      }
      get().replaceProjectLuminancePalette(preset.data);
      toast.info(`已导入预设「${preset.name}」`);
    },

    openLuminancePalettePresetManager: () => set({ luminancePalettePresetManagerOpen: true }),

    closeLuminancePalettePresetManager: () => {
      if (get().deleteLuminancePalettePresetTarget) {
        set({
          luminancePalettePresetManagerOpen: false,
          deleteLuminancePalettePresetTarget: null,
        });
        return;
      }
      set({ luminancePalettePresetManagerOpen: false });
    },
  };
}

export { listLuminancePalettePresets };
