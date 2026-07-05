import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import type { IImageProcessor } from "@/application/ports/IImageProcessor";
import type { IPalettePresetRepository } from "@/application/ports/IPalettePresetRepository";
import {
  importPresetIntoPalette,
  type PalettePresetImportMode,
} from "@/application/use-cases/PalettePresetUseCases";
import {
  deriveHexPresetName,
  parseHexPaletteContent,
} from "@/domain/palette/HexPaletteFile";
import { buildPaletteFromLeadingPixels } from "@/domain/palette/ImagePixelPalette";
import {
  addPalettePreset,
  createEmptyPalettePresetLibrary,
  getPalettePreset,
  removePalettePreset,
  renamePalettePresetInLibrary,
  setDefaultPalettePreset,
  updatePresetColorsInLibrary,
  type PalettePresetLibrary,
} from "@/domain/palette/PalettePresetLibrary";
import type { Project } from "@/domain/project/Project";
import type { ISoftwareDataPathStore } from "@/application/ports/ISoftwareDataPathStore";
import { ensureSoftwareDataPathAccess } from "@/application/use-cases/EnsureSoftwareDataPathAccess";
import {
  getActiveSoftwareDataPath,
  isUserDataHydrating,
} from "@/infrastructure/storage/UserDataPersistenceContext";
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
  loadPalettePresets: () => Promise<void>;
  hydratePalettePresetLibrary: (library: PalettePresetLibrary) => void;
  saveCurrentPaletteAsPreset: (name?: string) => Promise<void>;
  importPalettePresetFromHexFile: () => Promise<void>;
  importPalettePresetFromImageFile: () => Promise<void>;
  overwritePalettePreset: (id: string) => void;
  renamePalettePresetAction: (id: string, name: string) => void;
  requestDeletePalettePreset: (id: string) => void;
  cancelDeletePalettePreset: () => void;
  confirmDeletePalettePreset: () => void;
  importPresetToPalette: (id: string, mode: PalettePresetImportMode) => void;
  setDefaultPalettePresetAction: (id: string) => void;
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
  softwareDataPath: string | null;
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
    pathStore: ISoftwareDataPathStore;
    palettePresetRepository: IPalettePresetRepository;
    imageProcessor: IImageProcessor;
  },
): PalettePresetSliceState & PalettePresetSliceActions {
  const resolveSoftwareDataPath = async (): Promise<string | null> => {
    const path = get().softwareDataPath ?? deps.pathStore.getPath();
    if (!path) {
      toast.info("请先选择软件数据路径");
      return null;
    }
    return ensureSoftwareDataPathAccess(deps.pathStore);
  };

  const persist = async (library: PalettePresetLibrary) => {
    set({ palettePresetLibrary: library });
    if (isUserDataHydrating()) return;
    const softwareDataPath = getActiveSoftwareDataPath() ?? (await resolveSoftwareDataPath());
    if (!softwareDataPath) return;
    await deps.palettePresetRepository.save(softwareDataPath, library);
  };

  return {
    ...createPalettePresetInitialState(),

    hydratePalettePresetLibrary: (library) => {
      set({
        palettePresetLibrary: {
          ...createEmptyPalettePresetLibrary(),
          ...library,
          defaultPresetId: library.defaultPresetId ?? null,
        },
      });
    },

    loadPalettePresets: async () => {
      const softwareDataPath = await resolveSoftwareDataPath();
      if (!softwareDataPath) return;

      const loaded = await deps.palettePresetRepository.load(softwareDataPath);
      if (loaded && typeof loaded === "object" && "presets" in loaded) {
        const library = loaded as PalettePresetLibrary;
        set({
          palettePresetLibrary: {
            ...createEmptyPalettePresetLibrary(),
            ...library,
            defaultPresetId: library.defaultPresetId ?? null,
          },
        });
      }
    },

    saveCurrentPaletteAsPreset: async (name) => {
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
      await persist(library);
      toast.info(`已保存预设「${preset.name}」`);
    },

    importPalettePresetFromHexFile: async () => {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Hex 色板", extensions: ["hex", "txt"] }],
      });
      if (!selected || typeof selected !== "string") return;

      let content: string;
      try {
        content = await readTextFile(selected);
      } catch {
        toast.error("无法读取所选文件");
        return;
      }

      const colors = parseHexPaletteContent(content);
      if (colors.length === 0) {
        toast.info("未在文件中找到有效的十六进制颜色");
        return;
      }

      const { library, preset } = addPalettePreset(
        get().palettePresetLibrary,
        colors,
        deriveHexPresetName(selected),
      );
      await persist(library);
      toast.info(`已从 hex 文件导入预设「${preset.name}」（${colors.length} 色）`);
    },

    importPalettePresetFromImageFile: async () => {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "图片", extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp"] },
        ],
      });
      if (!selected || typeof selected !== "string") return;

      let imageData: ImageData;
      try {
        imageData = await deps.imageProcessor.loadImageFromPath(selected);
      } catch {
        toast.error("无法读取所选图片");
        return;
      }

      const colors = buildPaletteFromLeadingPixels(imageData);
      if (colors.length === 0) {
        toast.info("未能从图片中提取颜色");
        return;
      }

      const { library, preset } = addPalettePreset(
        get().palettePresetLibrary,
        colors,
        deriveHexPresetName(selected),
      );
      await persist(library);
      toast.info(`已从图片导入预设「${preset.name}」（${colors.length} 色）`);
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
      void persist(updatePresetColorsInLibrary(library, id, colors));
      toast.info(`已用当前色板覆盖「${preset.name}」`);
    },

    renamePalettePresetAction: (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      void persist(renamePalettePresetInLibrary(get().palettePresetLibrary, id, trimmed));
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
      void persist(removePalettePreset(get().palettePresetLibrary, target.id));
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

    setDefaultPalettePresetAction: (id) => {
      const library = get().palettePresetLibrary;
      const preset = getPalettePreset(library, id);
      if (!preset) return;
      if (library.defaultPresetId === id) {
        toast.info(`「${preset.name}」已是默认色板`);
        return;
      }
      void persist(setDefaultPalettePreset(library, id));
      toast.info(`已将「${preset.name}」设为默认色板`);
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
