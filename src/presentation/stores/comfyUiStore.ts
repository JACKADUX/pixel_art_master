import { create } from "zustand";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { importComfyWorkflow } from "@/application/use-cases/ImportComfyWorkflow";
import { saveComfyUiSettings } from "@/application/use-cases/SaveComfyUiSettings";
import { runComfyWorkflow } from "@/application/use-cases/RunComfyWorkflow";
import {
  comfyErrorMessage,
  isComfyError,
} from "@/domain/comfyui/ComfyError";
import {
  createComfyServerConfig,
  type ComfyServerConfig,
} from "@/domain/comfyui/ComfyServerConfig";
import {
  extractEditableParameters,
  setParameterValue,
  type ComfyParameter,
} from "@/domain/comfyui/ComfyParameter";
import {
  DEFAULT_OUTPUT_CLASS_TYPES,
  getExportableNodeIds,
  normalizeOutputClassTypes,
} from "@/domain/comfyui/ComfyOutputNode";
import { saveComfyOutputClassTypes } from "@/application/use-cases/SaveComfyOutputClassTypes";
import {
  initialRunProgress,
  reduceProgress,
  type ComfyRunProgress,
} from "@/domain/comfyui/ComfyProgress";
import type { ComfyImageRef } from "@/domain/comfyui/ComfyResult";
import { getNodeTitle, type ComfyApiWorkflow } from "@/domain/comfyui/ComfyWorkflow";
import { comfyUiClient } from "@/infrastructure/comfyui/createComfyUiClient";
import { comfyUiSettingsRepository } from "@/infrastructure/storage/FileComfyUiSettingsRepository";
import {
  getActiveSoftwareDataPath,
  isUserDataHydrating,
} from "@/infrastructure/storage/UserDataPersistenceContext";
import { toast } from "@/presentation/stores/toastStore";

export interface ComfyResultItem {
  id: string;
  ref: ComfyImageRef;
  blob: Blob;
  objectUrl: string;
}

interface ComfyUiStore {
  open: boolean;
  serverConfig: ComfyServerConfig;
  workflow: ComfyApiWorkflow | null;
  workflowName: string | null;
  parameters: ComfyParameter[];
  /** “可导出图片”节点类型白名单（全局设置，跨工作流保留） */
  outputClassTypes: string[];
  /** 当前勾选要导出结果图的节点 id */
  selectedOutputNodeIds: string[];
  progress: ComfyRunProgress;
  results: ComfyResultItem[];
  running: boolean;
  error: string | null;
  abortController: AbortController | null;

  openPage: () => void;
  closePage: () => void;
  reset: () => void;
  hydrateSettings: (serverConfig: ComfyServerConfig, outputClassTypes: string[]) => void;
  setServerAddress: (address: string) => void;
  importWorkflow: (jsonText: string, name: string) => void;
  importWorkflowFromFile: (file: File) => Promise<void>;
  loadWorkflowObject: (workflow: ComfyApiWorkflow, name: string) => void;
  setWorkflowName: (name: string) => void;
  setParameter: (id: string, value: string | number | boolean) => void;
  toggleOutputNode: (nodeId: string) => void;
  setSelectedOutputNodeIds: (nodeIds: string[]) => void;
  setOutputClassTypes: (types: string[]) => void;
  run: () => Promise<void>;
  abort: () => void;
  clearResults: () => void;
  saveResultToLocal: (item: ComfyResultItem) => Promise<void>;
}

function revokeResults(results: ComfyResultItem[]): void {
  for (const item of results) {
    URL.revokeObjectURL(item.objectUrl);
  }
}

function applyOutputClassTypes(
  state: Pick<ComfyUiStore, "workflow" | "outputClassTypes" | "selectedOutputNodeIds">,
  normalized: string[],
): Partial<Pick<ComfyUiStore, "outputClassTypes" | "selectedOutputNodeIds">> {
  const { workflow, outputClassTypes: prevTypes, selectedOutputNodeIds } = state;
  if (!workflow) {
    return { outputClassTypes: normalized };
  }
  const prevExportable = new Set(getExportableNodeIds(workflow, prevTypes));
  const nextExportable = getExportableNodeIds(workflow, normalized);
  const keep = selectedOutputNodeIds.filter((id) => nextExportable.includes(id));
  const added = nextExportable.filter((id) => !prevExportable.has(id));
  return {
    outputClassTypes: normalized,
    selectedOutputNodeIds: [...new Set([...keep, ...added])],
  };
}

const sessionDefaults = {
  workflow: null as ComfyApiWorkflow | null,
  workflowName: null as string | null,
  parameters: [] as ComfyParameter[],
  selectedOutputNodeIds: [] as string[],
  progress: initialRunProgress,
  results: [] as ComfyResultItem[],
  running: false,
  error: null as string | null,
  abortController: null as AbortController | null,
};

export const useComfyUiStore = create<ComfyUiStore>((set, get) => ({
  open: false,
  serverConfig: createComfyServerConfig(),
  outputClassTypes: [...DEFAULT_OUTPUT_CLASS_TYPES],
  ...sessionDefaults,

  openPage: () => set({ open: true }),

  closePage: () => {
    get().abort();
    set({ open: false });
  },

  reset: () => {
    get().abort();
    revokeResults(get().results);
    set({ ...sessionDefaults });
  },

  hydrateSettings: (serverConfig, outputClassTypes) => {
    set({ serverConfig, outputClassTypes });
  },

  setServerAddress: (address) => {
    const serverConfig = createComfyServerConfig(address);
    set({ serverConfig });
    if (isUserDataHydrating()) return;
    const softwareDataPath = getActiveSoftwareDataPath();
    if (!softwareDataPath) return;
    void saveComfyUiSettings(comfyUiSettingsRepository, softwareDataPath, serverConfig);
  },

  importWorkflow: (jsonText, name) => {
    try {
      const { workflow, parameters } = importComfyWorkflow(jsonText);
      revokeResults(get().results);
      set({
        workflow,
        parameters,
        selectedOutputNodeIds: getExportableNodeIds(workflow, get().outputClassTypes),
        workflowName: name,
        results: [],
        progress: initialRunProgress,
        error: null,
      });
      toast.info(`已导入工作流：${name}`);
    } catch (error) {
      set({ error: comfyErrorMessage(error) });
    }
  },

  importWorkflowFromFile: async (file) => {
    try {
      const text = await file.text();
      get().importWorkflow(text, file.name);
    } catch {
      set({ error: "读取工作流文件失败" });
    }
  },

  loadWorkflowObject: (workflow, name) => {
    revokeResults(get().results);
    set({
      workflow,
      parameters: extractEditableParameters(workflow),
      selectedOutputNodeIds: getExportableNodeIds(workflow, get().outputClassTypes),
      workflowName: name,
      results: [],
      progress: initialRunProgress,
      error: null,
    });
  },

  setWorkflowName: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set({ workflowName: trimmed });
  },

  setParameter: (id, value) =>
    set((state) => ({ parameters: setParameterValue(state.parameters, id, value) })),

  toggleOutputNode: (nodeId) =>
    set((state) => {
      const selected = new Set(state.selectedOutputNodeIds);
      if (selected.has(nodeId)) {
        selected.delete(nodeId);
      } else {
        selected.add(nodeId);
      }
      return { selectedOutputNodeIds: [...selected] };
    }),

  setSelectedOutputNodeIds: (nodeIds) => set({ selectedOutputNodeIds: [...nodeIds] }),

  setOutputClassTypes: (types) => {
    const normalized = normalizeOutputClassTypes(types);
    set((state) => applyOutputClassTypes(state, normalized));
    if (isUserDataHydrating()) return;
    const softwareDataPath = getActiveSoftwareDataPath();
    if (!softwareDataPath) return;
    void saveComfyOutputClassTypes(comfyUiSettingsRepository, softwareDataPath, normalized);
  },

  run: async () => {
    const {
      running,
      workflow,
      parameters,
      serverConfig,
      outputClassTypes,
      selectedOutputNodeIds,
    } = get();
    if (running) return;
    if (!workflow) {
      set({ error: "请先导入工作流" });
      return;
    }

    revokeResults(get().results);
    const abortController = new AbortController();
    set({
      running: true,
      error: null,
      results: [],
      abortController,
      progress: { ...initialRunProgress, status: "queued" },
    });

    const clientId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `client-${Date.now()}`;

    try {
      for await (const event of runComfyWorkflow(
        comfyUiClient,
        serverConfig,
        workflow,
        parameters,
        clientId,
        abortController.signal,
        {
          // 工作流存在可导出节点时按勾选过滤；否则不过滤（避免结果全空）
          allowedOutputNodeIds:
            getExportableNodeIds(workflow, outputClassTypes).length > 0
              ? selectedOutputNodeIds
              : undefined,
        },
      )) {
        if (event.kind === "progress") {
          set((state) => ({ progress: reduceProgress(state.progress, event.event) }));
        } else if (event.kind === "error") {
          set((state) => ({
            error: event.message,
            progress: { ...state.progress, status: "error" },
          }));
        } else if (event.kind === "result") {
          const items: ComfyResultItem[] = event.images.map((image) => ({
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `${image.ref.filename}-${Math.random()}`,
            ref: image.ref,
            blob: image.blob,
            objectUrl: URL.createObjectURL(image.blob),
          }));
          set((state) => ({
            results: items,
            progress: { ...state.progress, status: "completed", percent: 100 },
          }));

          // 诊断：勾选了节点却没收集到图时，提示实际产出图片的节点
          if (items.length === 0) {
            const wf = get().workflow;
            const labels = event.producedNodeIds.map((id) => {
              const node = wf?.[id];
              const title = node ? getNodeTitle(node) : null;
              return title ? `${title} (#${id})` : `#${id}`;
            });
            if (labels.length > 0) {
              toast.info(`所选节点未产出结果图。实际产出图片的节点：${labels.join("、")}。请在对应节点卡片勾选「导出图片」。`);
            } else {
              toast.info("本次执行没有产出可显示的结果图（所选节点可能仅有实时预览，无可保存的图片）。");
            }
          }
        }
      }
    } catch (error) {
      const aborted = isComfyError(error) && error.code === "aborted";
      set((state) => ({
        error: aborted ? null : comfyErrorMessage(error),
        progress: { ...state.progress, status: aborted ? "idle" : "error" },
      }));
    } finally {
      set({ running: false, abortController: null });
    }
  },

  abort: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ abortController: null, running: false });
  },

  clearResults: () => {
    revokeResults(get().results);
    set({ results: [] });
  },

  saveResultToLocal: async (item) => {
    try {
      const path = await save({
        defaultPath: item.ref.filename || "comfyui-output.png",
        filters: [{ name: "图片", extensions: ["png", "jpg", "jpeg", "webp"] }],
      });
      if (!path) return;
      const bytes = new Uint8Array(await item.blob.arrayBuffer());
      await writeFile(path, bytes);
      toast.info(`已保存到 ${path}`);
    } catch {
      toast.error("保存图片失败");
    }
  },
}));
