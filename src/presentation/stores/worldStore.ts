import { create } from "zustand";
import { deleteWorld as deleteWorldUseCase } from "@/application/use-cases/DeleteWorld";
import { listWorldsInWorkspace } from "@/application/use-cases/ListWorldsInWorkspace";
import { loadWorld } from "@/application/use-cases/LoadWorld";
import { resolveWorldSavePath } from "@/application/use-cases/ResolveWorldSavePath";
import { saveWorld } from "@/application/use-cases/SaveWorld";
import {
  addEntity as addEntityOp,
  createEmptyWorld,
  createWorldEntity,
  removeEntity as removeEntityOp,
  renameWorld as renameWorldOp,
  updateEntity as updateEntityOp,
  updateWorldview as updateWorldviewOp,
  type World,
  type WorldEntity,
} from "@/domain/world/World";
import type { WorldSummary } from "@/domain/world/WorldSummary";
import { worldRepository } from "@/infrastructure/storage/JsonWorldRepository";
import { softwareDataPathStore } from "@/infrastructure/storage/LocalSoftwareDataPathStore";
import { toast } from "@/presentation/stores/toastStore";

interface WorldStore {
  open: boolean;
  worlds: WorldSummary[];
  activeWorld: World | null;
  selectedEntityId: string | null;
  workspacePath: string | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  openPage: () => void;
  closePage: () => void;
  reset: () => void;
  refreshWorldList: () => Promise<void>;
  createWorld: () => Promise<void>;
  openWorldByPath: (filePath: string) => Promise<void>;
  deleteWorld: (filePath: string) => Promise<void>;
  closeActiveWorld: () => void;
  renameActiveWorld: (name: string) => Promise<void>;
  setActiveWorldview: (worldview: string) => Promise<void>;
  setSelectedEntity: (entityId: string | null) => void;
  addEntity: () => Promise<void>;
  updateEntity: (
    entityId: string,
    patch: Partial<Omit<WorldEntity, "id" | "createdAt">>,
  ) => Promise<void>;
  removeEntity: (entityId: string) => Promise<void>;
}

const sessionDefaults = {
  open: false,
  worlds: [] as WorldSummary[],
  activeWorld: null as World | null,
  selectedEntityId: null as string | null,
  loading: false,
  saving: false,
  error: null as string | null,
};

export const useWorldStore = create<WorldStore>((set, get) => {
  /** 将当前激活世界持久化到磁盘，并刷新列表 */
  async function persistActiveWorld(world: World): Promise<void> {
    const filePath = world.filePath;
    if (!filePath) {
      set({ activeWorld: world });
      return;
    }
    set({ saving: true });
    try {
      const saved = await saveWorld(worldRepository, world, filePath);
      set({ activeWorld: saved, saving: false });
      await get().refreshWorldList();
    } catch {
      set({ saving: false, error: "保存世界失败" });
      toast.error("保存世界失败");
    }
  }

  return {
    ...sessionDefaults,
    workspacePath: softwareDataPathStore.getPath(),

    openPage: () => {
      set({ open: true });
      void get().refreshWorldList();
    },

    closePage: () => set({ open: false }),

    reset: () =>
      set({
        ...sessionDefaults,
        open: get().open,
        workspacePath: softwareDataPathStore.getPath(),
      }),

    refreshWorldList: async () => {
      const workspacePath = softwareDataPathStore.getPath();
      if (!workspacePath) {
        set({ worlds: [], workspacePath: null });
        return;
      }
      set({ loading: true });
      try {
        const worlds = await listWorldsInWorkspace(worldRepository, softwareDataPathStore);
        set({ worlds, workspacePath, loading: false, error: null });
      } catch {
        set({ loading: false, error: "读取世界列表失败" });
      }
    },

    createWorld: async () => {
      const workspacePath = softwareDataPathStore.getPath();
      if (!workspacePath) {
        toast.info("请先在项目管理中选择软件数据路径");
        return;
      }
      const world = createEmptyWorld();
      try {
        const filePath = await resolveWorldSavePath(softwareDataPathStore, world.name);
        if (!filePath) {
          toast.info("请先在项目管理中选择软件数据路径");
          return;
        }
        const saved = await saveWorld(worldRepository, world, filePath);
        set({
          activeWorld: saved,
          selectedEntityId: null,
          error: null,
        });
        await get().refreshWorldList();
        toast.info("已创建新世界");
      } catch {
        set({ error: "创建世界失败" });
        toast.error("创建世界失败");
      }
    },

    openWorldByPath: async (filePath) => {
      set({ loading: true, error: null });
      try {
        const world = await loadWorld(worldRepository, filePath);
        set({
          activeWorld: world,
          selectedEntityId: null,
          loading: false,
        });
      } catch {
        set({ loading: false, error: "打开世界失败" });
        toast.error("打开世界失败");
      }
    },

    deleteWorld: async (filePath) => {
      try {
        await deleteWorldUseCase(worldRepository, filePath);
        const activeWorld = get().activeWorld;
        if (activeWorld?.filePath === filePath) {
          set({ activeWorld: null, selectedEntityId: null });
        }
        await get().refreshWorldList();
        toast.info("已删除世界");
      } catch {
        toast.error("删除世界失败");
      }
    },

    closeActiveWorld: () => set({ activeWorld: null, selectedEntityId: null }),

    renameActiveWorld: async (name) => {
      const world = get().activeWorld;
      if (!world) return;
      const renamed = renameWorldOp(world, name);
      if (!renamed) return;
      await persistActiveWorld(renamed);
    },

    setActiveWorldview: async (worldview) => {
      const world = get().activeWorld;
      if (!world) return;
      const updated = updateWorldviewOp(world, worldview);
      if (updated === world) return;
      await persistActiveWorld(updated);
    },

    setSelectedEntity: (entityId) => set({ selectedEntityId: entityId }),

    addEntity: async () => {
      const world = get().activeWorld;
      if (!world) return;
      const entity = createWorldEntity();
      const updated = addEntityOp(world, entity);
      set({ selectedEntityId: entity.id });
      await persistActiveWorld(updated);
    },

    updateEntity: async (entityId, patch) => {
      const world = get().activeWorld;
      if (!world) return;
      const updated = updateEntityOp(world, entityId, patch);
      if (updated === world) return;
      await persistActiveWorld(updated);
    },

    removeEntity: async (entityId) => {
      const world = get().activeWorld;
      if (!world) return;
      const updated = removeEntityOp(world, entityId);
      if (updated === world) return;
      if (get().selectedEntityId === entityId) {
        set({ selectedEntityId: null });
      }
      await persistActiveWorld(updated);
    },
  };
});
