import { create } from "zustand";
import { listComfyApps } from "@/application/use-cases/ListComfyApps";
import { saveComfyApp } from "@/application/use-cases/SaveComfyApp";
import { loadComfyApp } from "@/application/use-cases/LoadComfyApp";
import { deleteComfyApp } from "@/application/use-cases/DeleteComfyApp";
import { duplicateComfyAppToWorkspace } from "@/application/use-cases/DuplicateComfyApp";
import { uploadComfyImage } from "@/application/use-cases/UploadComfyImage";
import { runComfyWorkflow } from "@/application/use-cases/RunComfyWorkflow";
import { createComfyApp, type ComfyApp } from "@/domain/comfyApp/ComfyApp";
import {
  componentParameterIds,
  DEFAULT_RATIO_SIZE_CONFIG,
  type AppComponent,
} from "@/domain/comfyApp/ComfyAppComponent";
import {
  parseHexText,
  paletteItemsToValueString,
  type PaletteColorItem,
} from "@/domain/comfyApp/PaletteComponent";
import { generateRandomPositiveInteger } from "@/domain/comfyApp/RandomNumber";
import { mergePromptValue, type PromptItem } from "@/domain/comfyApp/PromptComponent";
import {
  addPromptPreset,
  createEmptyPromptPresetLibrary,
  removePromptPreset,
  renamePromptPresetInLibrary,
  type PromptPresetLibrary,
} from "@/domain/comfyApp/PromptPresetLibrary";
import { promptPresetRepository } from "@/infrastructure/storage/FilePromptPresetRepository";
import { getActiveSoftwareDataPath } from "@/infrastructure/storage/UserDataPersistenceContext";
import {
  computeRatioSize,
  findAspectRatioPreset,
  FREE_RATIO_ID,
  type RatioOrientation,
} from "@/domain/comfyApp/RatioSize";
import {
  clonePresetValues,
  createParameterPreset,
  type PresetComponentValue,
  type PresetValues,
} from "@/domain/comfyApp/ParameterPreset";
import {
  comfyErrorMessage,
  isComfyError,
} from "@/domain/comfyui/ComfyError";
import {
  extractEditableParameters,
  setParameterValue,
} from "@/domain/comfyui/ComfyParameter";
import { getExportableNodeIds } from "@/domain/comfyui/ComfyOutputNode";
import {
  initialRunProgress,
  reduceProgress,
  type ComfyRunProgress,
} from "@/domain/comfyui/ComfyProgress";
import type { ComfyApiWorkflow } from "@/domain/comfyui/ComfyWorkflow";
import { comfyUiClient } from "@/infrastructure/comfyui/createComfyUiClient";
import { comfyAppRepository } from "@/infrastructure/storage/FileComfyAppRepository";
import { softwareDataPathStore } from "@/infrastructure/storage/LocalSoftwareDataPathStore";
import type { RunnerScope } from "@/domain/comfyApp/RunnerScope";
import {
  createInitialRunnerPanel,
  type RunnerPanelState,
} from "@/domain/comfyApp/RunnerPanelState";
import type { PanelEdgeAnchor } from "@/domain/viewport/FloatingPanelAnchor";
import { toast } from "@/presentation/stores/toastStore";
import { useComfyUiStore, type ComfyResultItem } from "@/presentation/stores/comfyUiStore";

/** 运行弹窗中各组件的取值 */
export interface RatioRunnerValue {
  kind: "ratio";
  ratioId: string;
  maxEdge: number;
  orientation: RatioOrientation;
  /** ratioId 为 "free" 时使用的显式宽高 */
  width?: number;
  height?: number;
}
export interface ImageRunnerValue {
  kind: "image";
  /** 已上传到服务器的文件名（可直接写入 LoadImage） */
  filename: string;
  /** 本地预览地址 */
  previewUrl: string | null;
}
export interface ScalarRunnerValue {
  kind: "scalar";
  value: string | number | boolean;
}
export interface PaletteRunnerValue {
  kind: "palette";
  colors: PaletteColorItem[];
}
export interface RandomNumberRunnerValue {
  kind: "randomNumber";
  value: number;
  randomEnabled: boolean;
}
export interface PromptRunnerValue {
  kind: "prompt";
  text: string;
  prompts: PromptItem[];
}
export type RunnerComponentValue =
  | RatioRunnerValue
  | ImageRunnerValue
  | ScalarRunnerValue
  | PaletteRunnerValue
  | RandomNumberRunnerValue
  | PromptRunnerValue;

/** 单个作用域下的 ComfyUI 应用运行态 */
interface RunnerInstanceState {
  app: ComfyApp | null;
  workflow: ComfyApiWorkflow | null;
  values: Record<string, RunnerComponentValue>;
  activePresetId: string | null;
  running: boolean;
  progress: ComfyRunProgress;
  results: ComfyResultItem[];
  error: string | null;
  abortController: AbortController | null;
  editing: boolean;
  panel: RunnerPanelState;
}

type RunnersState = Record<RunnerScope, RunnerInstanceState>;

function createInitialRunnerInstance(): RunnerInstanceState {
  return {
    app: null,
    workflow: null,
    values: {},
    activePresetId: null,
    running: false,
    progress: initialRunProgress,
    results: [],
    error: null,
    abortController: null,
    editing: false,
    panel: createInitialRunnerPanel(),
  };
}

function createInitialRunners(): RunnersState {
  return {
    canvas: createInitialRunnerInstance(),
    workflow: createInitialRunnerInstance(),
  };
}

function patchRunner(
  state: { runners: RunnersState },
  scope: RunnerScope,
  patch: Partial<RunnerInstanceState>,
): RunnersState {
  return {
    ...state.runners,
    [scope]: { ...state.runners[scope], ...patch },
  };
}

function revokeResults(results: ComfyResultItem[]): void {
  for (const item of results) {
    URL.revokeObjectURL(item.objectUrl);
  }
}

/** 持久化应用清单（用于预设/默认参数的增删改），失败仅提示不抛出 */
async function writeRunnerApp(
  app: ComfyApp,
  workflow: ComfyApiWorkflow | null,
): Promise<ComfyApp | null> {
  if (!workflow) return null;
  try {
    return await saveComfyApp(softwareDataPathStore, comfyAppRepository, app, workflow);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "保存预设失败");
    return null;
  }
}

function randomId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** 运行取值 -> 预设取值（剥离本地预览地址等不可序列化字段） */
function runnerValueToPreset(value: RunnerComponentValue): PresetComponentValue {
  if (value.kind === "ratio") {
    return {
      kind: "ratio",
      ratioId: value.ratioId,
      maxEdge: value.maxEdge,
      orientation: value.orientation,
      width: value.width,
      height: value.height,
    };
  }
  if (value.kind === "image") {
    return { kind: "image", filename: value.filename };
  }
  if (value.kind === "palette") {
    return { kind: "palette", colors: value.colors.map((color) => ({ ...color })) };
  }
  if (value.kind === "randomNumber") {
    return { kind: "randomNumber", value: value.value, randomEnabled: value.randomEnabled };
  }
  if (value.kind === "prompt") {
    return { kind: "prompt", text: value.text, prompts: value.prompts.map((p) => ({ ...p })) };
  }
  return { kind: "scalar", value: value.value };
}

/** 预设取值 -> 运行取值（图片预览地址置空，待用户重新选择/沿用文件名） */
function presetValueToRunner(value: PresetComponentValue): RunnerComponentValue {
  if (value.kind === "ratio") {
    return {
      kind: "ratio",
      ratioId: value.ratioId,
      maxEdge: value.maxEdge,
      orientation: value.orientation,
      width: value.width,
      height: value.height,
    };
  }
  if (value.kind === "image") {
    return { kind: "image", filename: value.filename, previewUrl: null };
  }
  if (value.kind === "palette") {
    return { kind: "palette", colors: value.colors.map((color) => ({ ...color })) };
  }
  if (value.kind === "randomNumber") {
    return { kind: "randomNumber", value: value.value, randomEnabled: value.randomEnabled };
  }
  if (value.kind === "prompt") {
    return { kind: "prompt", text: value.text, prompts: value.prompts.map((p) => ({ ...p })) };
  }
  return { kind: "scalar", value: value.value };
}

/** 把当前全部运行取值快照为预设取值映射 */
function snapshotRunnerValues(values: Record<string, RunnerComponentValue>): PresetValues {
  const snapshot: PresetValues = {};
  for (const [componentId, value] of Object.entries(values)) {
    snapshot[componentId] = runnerValueToPreset(value);
  }
  return snapshot;
}

/**
 * 把预设取值覆盖到现有运行取值上。
 * 仅当组件 id 已存在且取值类型一致时覆盖，避免工作流变更后产生不匹配。
 */
function applyPresetToRunnerValues(
  current: Record<string, RunnerComponentValue>,
  presetValues: PresetValues,
): Record<string, RunnerComponentValue> {
  const next = { ...current };
  for (const [componentId, presetValue] of Object.entries(presetValues)) {
    const existing = next[componentId];
    if (!existing || existing.kind !== presetValue.kind) continue;
    // 释放被替换图片的预览地址，避免内存泄漏
    if (existing.kind === "image" && existing.previewUrl) {
      URL.revokeObjectURL(existing.previewUrl);
    }
    next[componentId] = presetValueToRunner(presetValue);
  }
  return next;
}

interface ComfyAppStore {
  // ----- 应用列表 -----
  apps: ComfyApp[];
  appsLoading: boolean;
  appsError: string | null;
  refreshApps: () => Promise<void>;
  deleteApp: (appId: string) => Promise<void>;
  duplicateApp: (appId: string) => Promise<void>;

  // ----- 构建草稿（针对 comfyUiStore 当前导入的工作流） -----
  draftComponents: AppComponent[];
  editingAppId: string | null;
  /** 正在编辑的应用原始记录（用于保存时保留预设等元数据） */
  editingApp: ComfyApp | null;
  /** 应用描述草稿（内联编辑，保存时写入应用） */
  draftDescription: string;
  resetDraft: () => void;
  setDraftDescription: (value: string) => void;
  findComponentByParameter: (parameterId: string) => AppComponent | undefined;
  upsertComponent: (component: AppComponent) => void;
  removeComponentByParameter: (parameterId: string) => void;
  /** 保存为新应用（首次保存时由弹窗提供名称，描述取自 draftDescription） */
  saveAsApp: (name: string) => Promise<boolean>;
  /** 直接更新当前编辑中的应用（沿用原名称，不弹窗） */
  updateApp: () => Promise<boolean>;
  editApp: (appId: string) => Promise<void>;

  // ----- 运行弹窗（画布 / 工作流页各一套独立实例） -----
  runners: RunnersState;
  openRunner: (appId: string, scope: RunnerScope) => Promise<void>;
  closeRunner: (scope: RunnerScope) => void;
  /** 设置浮窗位置（吸附计算由组件层完成后写回纯几何数据） */
  setRunnerPanelPosition: (
    scope: RunnerScope,
    position: { x: number; y: number },
    edgeAnchor?: PanelEdgeAnchor,
  ) => void;
  /** 设置浮窗整体边界（角拖拽缩放后写回） */
  setRunnerPanelBounds: (
    scope: RunnerScope,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
  /** 固化贴边锚点（拖动结束时调用） */
  setRunnerPanelEdgeAnchor: (scope: RunnerScope, edgeAnchor: PanelEdgeAnchor) => void;
  setRunnerValue: (
    scope: RunnerScope,
    componentId: string,
    value: RunnerComponentValue,
  ) => void;
  setRunnerEditing: (scope: RunnerScope, editing: boolean) => void;
  /** 切换某组件在运行窗口中的隐藏状态（持久化到应用文件） */
  toggleRunnerComponentHidden: (scope: RunnerScope, componentId: string) => void;

  // ----- 参数预设 -----
  /** 切换到指定预设（null 表示「自定义」，仅清除高亮不改取值） */
  selectRunnerPreset: (scope: RunnerScope, presetId: string | null) => void;
  /** 用当前取值新建预设并设为默认 */
  saveRunnerPreset: (scope: RunnerScope, name: string) => Promise<void>;
  /** 用当前取值覆盖指定预设 */
  updateRunnerPreset: (scope: RunnerScope, presetId: string) => Promise<void>;
  /** 重命名预设 */
  renameRunnerPreset: (scope: RunnerScope, presetId: string, name: string) => Promise<void>;
  /** 删除预设 */
  deleteRunnerPreset: (scope: RunnerScope, presetId: string) => Promise<void>;
  uploadRunnerImage: (
    scope: RunnerScope,
    componentId: string,
    bytes: Uint8Array,
    filename: string,
    previewUrl: string,
  ) => Promise<void>;
  runApp: (scope: RunnerScope) => Promise<void>;
  abortRunner: (scope: RunnerScope) => void;

  // ----- 提示词预设库（跨参数复用，软件数据路径持久化） -----
  promptPresetLibrary: PromptPresetLibrary;
  hydratePromptPresetLibrary: (library: PromptPresetLibrary) => void;
  savePromptPresetGroup: (name: string, prompts: string[]) => void;
  deletePromptPresetGroup: (id: string) => void;
  renamePromptPresetGroup: (id: string, name: string) => void;
}

async function persistPromptPresetLibrary(library: PromptPresetLibrary): Promise<void> {
  const softwareDataPath = getActiveSoftwareDataPath();
  if (!softwareDataPath) return;
  await promptPresetRepository.save(softwareDataPath, library);
}

export const useComfyAppStore = create<ComfyAppStore>((set, get) => ({
  apps: [],
  appsLoading: false,
  appsError: null,
  promptPresetLibrary: createEmptyPromptPresetLibrary(),

  hydratePromptPresetLibrary: (library) => set({ promptPresetLibrary: library }),

  refreshApps: async () => {
    set({ appsLoading: true, appsError: null });
    try {
      const apps = await listComfyApps(softwareDataPathStore, comfyAppRepository);
      set({ apps, appsLoading: false });
    } catch (error) {
      set({
        appsLoading: false,
        appsError: error instanceof Error ? error.message : "加载应用列表失败",
      });
    }
  },

  deleteApp: async (appId) => {
    try {
      await deleteComfyApp(softwareDataPathStore, comfyAppRepository, appId);
      toast.info("已删除应用");
      await get().refreshApps();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除应用失败");
    }
  },

  duplicateApp: async (appId) => {
    try {
      const copy = await duplicateComfyAppToWorkspace(
        softwareDataPathStore,
        comfyAppRepository,
        appId,
      );
      if (copy) {
        toast.info(`已复制为「${copy.name}」`);
        await get().refreshApps();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "复制应用失败");
    }
  },

  draftComponents: [],
  editingAppId: null,
  editingApp: null,
  draftDescription: "",

  resetDraft: () =>
    set({ draftComponents: [], editingAppId: null, editingApp: null, draftDescription: "" }),

  setDraftDescription: (value) => set({ draftDescription: value }),

  findComponentByParameter: (parameterId) =>
    get().draftComponents.find((component) =>
      componentParameterIds(component).includes(parameterId),
    ),

  upsertComponent: (component) =>
    set((state) => {
      const filtered = state.draftComponents.filter((existing) => existing.id !== component.id);
      return { draftComponents: [...filtered, component] };
    }),

  removeComponentByParameter: (parameterId) =>
    set((state) => ({
      draftComponents: state.draftComponents.filter(
        (component) => !componentParameterIds(component).includes(parameterId),
      ),
    })),

  saveAsApp: async (name) => {
    const { draftComponents, editingAppId } = get();
    const workflow = useComfyUiStore.getState().workflow;
    if (!workflow) {
      toast.error("请先导入工作流");
      return false;
    }
    if (draftComponents.length === 0) {
      toast.error("请至少提取一个参数作为应用组件");
      return false;
    }

    const ordered = [...draftComponents]
      .sort((a, b) => a.order - b.order)
      .map((component, index) => ({ ...component, order: index }));

    const { outputClassTypes, selectedOutputNodeIds } = useComfyUiStore.getState();
    const exportableCount = getExportableNodeIds(workflow, outputClassTypes).length;
    // 只要存在可导出节点，就持久化当前勾选（与编辑器一致：始终按勾选过滤）。
    // 无可导出节点时保持 undefined（不过滤），避免结果全空。
    const editingApp = get().editingApp;
    const app = createComfyApp({
      id: editingAppId ?? undefined,
      name,
      description: get().draftDescription,
      components: ordered,
      outputNodeIds: exportableCount > 0 ? [...selectedOutputNodeIds] : undefined,
      // 编辑既有应用时保留已保存的预设与默认参数
      presets: editingApp?.presets,
      defaultPresetId: editingApp?.defaultPresetId,
      defaultValues: editingApp?.defaultValues,
      hiddenComponentIds: editingApp?.hiddenComponentIds,
    });

    try {
      const saved = await saveComfyApp(softwareDataPathStore, comfyAppRepository, app, workflow);
      toast.info(`已保存应用「${app.name}」`);
      set({ editingAppId: saved.id, editingApp: saved, draftDescription: saved.description });
      await get().refreshApps();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存应用失败");
      return false;
    }
  },

  updateApp: async () => {
    const { editingApp } = get();
    if (!editingApp) {
      toast.error("当前没有正在编辑的应用");
      return false;
    }
    // 使用编辑器中（可能已被用户修改的）当前名称，而非载入时的旧名称
    const currentName = useComfyUiStore.getState().workflowName?.replace(/\.json$/i, "").trim();
    return get().saveAsApp(currentName || editingApp.name);
  },

  editApp: async (appId) => {
    try {
      const record = await loadComfyApp(softwareDataPathStore, comfyAppRepository, appId);
      if (!record) {
        toast.error("未找到应用文件");
        return;
      }
      // 载入备份工作流到工作流编辑器，并回填组件草稿
      useComfyUiStore.getState().loadWorkflowObject(record.workflow, record.app.name);
      // 恢复已保存的输出节点限制（loadWorkflowObject 默认会全选，需覆盖）
      if (record.app.outputNodeIds) {
        useComfyUiStore.getState().setSelectedOutputNodeIds(record.app.outputNodeIds);
      }
      set({
        draftComponents: record.app.components.map((component) => ({ ...component })),
        editingAppId: record.app.id,
        editingApp: record.app,
        draftDescription: record.app.description,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "载入应用失败");
    }
  },

  runners: createInitialRunners(),

  setRunnerPanelPosition: (scope, position, edgeAnchor) =>
    set((state) => ({
      runners: patchRunner(state, scope, {
        panel: {
          ...state.runners[scope].panel,
          position,
          ...(edgeAnchor ? { edgeAnchor } : {}),
        },
      }),
    })),

  setRunnerPanelBounds: (scope, x, y, width, height) =>
    set((state) => ({
      runners: patchRunner(state, scope, {
        panel: {
          ...state.runners[scope].panel,
          position: { x, y },
          size: { width, height },
        },
      }),
    })),

  setRunnerPanelEdgeAnchor: (scope, edgeAnchor) =>
    set((state) => ({
      runners: patchRunner(state, scope, {
        panel: { ...state.runners[scope].panel, edgeAnchor },
      }),
    })),

  openRunner: async (appId, scope) => {
    try {
      const record = await loadComfyApp(softwareDataPathStore, comfyAppRepository, appId);
      if (!record) {
        toast.error("未找到应用文件");
        return;
      }

      const base = extractEditableParameters(record.workflow);
      const paramById = new Map(base.map((parameter) => [parameter.id, parameter]));

      // 用工作流当前值初始化各组件取值
      let values: Record<string, RunnerComponentValue> = {};
      for (const component of record.app.components) {
        if (component.type === "ratioSize") {
          const config = component.ratio ?? DEFAULT_RATIO_SIZE_CONFIG;
          values[component.id] = {
            kind: "ratio",
            ratioId: config.defaultRatioId,
            maxEdge: config.defaultMaxEdge,
            orientation: "landscape",
          };
        } else if (component.type === "imageUpload") {
          values[component.id] = { kind: "image", filename: "", previewUrl: null };
        } else if (component.type === "palette") {
          const parameter = component.parameterId
            ? paramById.get(component.parameterId)
            : undefined;
          values[component.id] = {
            kind: "palette",
            colors: parseHexText(parameter ? String(parameter.value ?? "") : ""),
          };
        } else if (component.type === "randomNumber") {
          const parameter = component.parameterId
            ? paramById.get(component.parameterId)
            : undefined;
          const numeric = parameter ? Number(parameter.value) : 0;
          values[component.id] = {
            kind: "randomNumber",
            value: Number.isFinite(numeric) ? Math.floor(numeric) : 0,
            randomEnabled: false,
          };
        } else if (
          (component.type === "text" || component.type === "aiText") &&
          component.isPrompt
        ) {
          const parameter = component.parameterId
            ? paramById.get(component.parameterId)
            : undefined;
          values[component.id] = {
            kind: "prompt",
            text: parameter ? String(parameter.value ?? "") : "",
            prompts: [],
          };
        } else if (component.parameterId) {
          const parameter = paramById.get(component.parameterId);
          values[component.id] = {
            kind: "scalar",
            value: parameter ? parameter.value : "",
          };
        }
      }

      // 还原上次使用的默认参数（若有），实现「下次开启直接使用」
      let activePresetId: string | null = null;
      if (record.app.defaultValues) {
        values = applyPresetToRunnerValues(values, record.app.defaultValues);
        activePresetId = record.app.defaultPresetId ?? null;
        // 默认预设若已被删除则视为自定义
        if (activePresetId && !record.app.presets.some((preset) => preset.id === activePresetId)) {
          activePresetId = null;
        }
      }

      revokeResults(get().runners[scope].results);
      set((state) => ({
        runners: patchRunner(state, scope, {
          app: record.app,
          workflow: record.workflow,
          values,
          activePresetId,
          results: [],
          progress: initialRunProgress,
          error: null,
          running: false,
          editing: false,
        }),
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "打开应用失败");
    }
  },

  closeRunner: (scope) => {
    get().abortRunner(scope);
    const runner = get().runners[scope];
    const { app, workflow, values, activePresetId } = runner;
    if (app && workflow) {
      const nextApp: ComfyApp = {
        ...app,
        defaultPresetId: activePresetId ?? undefined,
        defaultValues: snapshotRunnerValues(values),
      };
      void writeRunnerApp(nextApp, workflow).then((saved) => {
        if (saved) {
          set((state) => ({ apps: state.apps.map((a) => (a.id === saved.id ? saved : a)) }));
        }
      });
    }
    revokeResults(runner.results);
    set((state) => ({
      runners: patchRunner(state, scope, {
        app: null,
        workflow: null,
        values: {},
        activePresetId: null,
        results: [],
        progress: initialRunProgress,
        error: null,
        editing: false,
      }),
    }));
  },

  setRunnerValue: (scope, componentId, value) =>
    set((state) => ({
      runners: patchRunner(state, scope, {
        values: { ...state.runners[scope].values, [componentId]: value },
        activePresetId: null,
      }),
    })),

  setRunnerEditing: (scope, editing) =>
    set((state) => ({
      runners: patchRunner(state, scope, { editing }),
    })),

  toggleRunnerComponentHidden: (scope, componentId) => {
    const { app, workflow } = get().runners[scope];
    if (!app) return;
    const current = app.hiddenComponentIds ?? [];
    const nextHidden = current.includes(componentId)
      ? current.filter((id) => id !== componentId)
      : [...current, componentId];
    const nextApp: ComfyApp = {
      ...app,
      hiddenComponentIds: nextHidden.length > 0 ? nextHidden : undefined,
    };
    set((state) => ({
      runners: patchRunner(state, scope, { app: nextApp }),
    }));
    void writeRunnerApp(nextApp, workflow).then((saved) => {
      if (saved) {
        set((state) => ({
          runners: patchRunner(state, scope, {
            app: state.runners[scope].app?.id === saved.id ? saved : state.runners[scope].app,
          }),
          apps: state.apps.map((a) => (a.id === saved.id ? saved : a)),
        }));
      }
    });
  },

  selectRunnerPreset: (scope, presetId) => {
    const { app, values, workflow } = get().runners[scope];
    if (!app) return;
    if (presetId === null) {
      set((state) => ({
        runners: patchRunner(state, scope, { activePresetId: null }),
      }));
      return;
    }
    const preset = app.presets.find((item) => item.id === presetId);
    if (!preset) return;
    const nextValues = applyPresetToRunnerValues(values, preset.values);
    set((state) => ({
      runners: patchRunner(state, scope, {
        values: nextValues,
        activePresetId: presetId,
      }),
    }));

    const nextApp: ComfyApp = {
      ...app,
      defaultPresetId: presetId,
      defaultValues: snapshotRunnerValues(nextValues),
    };
    void writeRunnerApp(nextApp, workflow).then((saved) => {
      if (saved) {
        set((state) => ({
          runners: patchRunner(state, scope, {
            app: state.runners[scope].app?.id === saved.id ? saved : state.runners[scope].app,
          }),
          apps: state.apps.map((a) => (a.id === saved.id ? saved : a)),
        }));
      }
    });
  },

  saveRunnerPreset: async (scope, name) => {
    const { app, workflow, values } = get().runners[scope];
    if (!app) return;
    const preset = createParameterPreset(name, snapshotRunnerValues(values));
    const nextApp: ComfyApp = {
      ...app,
      presets: [...app.presets, preset],
      defaultPresetId: preset.id,
      defaultValues: clonePresetValues(preset.values),
    };
    set((state) => ({
      runners: patchRunner(state, scope, { activePresetId: preset.id }),
    }));
    const saved = await writeRunnerApp(nextApp, workflow);
    if (saved) {
      set((state) => ({
        runners: patchRunner(state, scope, { app: saved }),
        apps: state.apps.map((a) => (a.id === saved.id ? saved : a)),
      }));
      toast.info(`已保存预设「${preset.name}」`);
    }
  },

  updateRunnerPreset: async (scope, presetId) => {
    const { app, workflow, values } = get().runners[scope];
    if (!app) return;
    const snapshot = snapshotRunnerValues(values);
    const presets = app.presets.map((preset) =>
      preset.id === presetId ? { ...preset, values: clonePresetValues(snapshot) } : preset,
    );
    const target = presets.find((preset) => preset.id === presetId);
    if (!target) return;
    const nextApp: ComfyApp = {
      ...app,
      presets,
      defaultPresetId: presetId,
      defaultValues: clonePresetValues(snapshot),
    };
    set((state) => ({
      runners: patchRunner(state, scope, { activePresetId: presetId }),
    }));
    const saved = await writeRunnerApp(nextApp, workflow);
    if (saved) {
      set((state) => ({
        runners: patchRunner(state, scope, { app: saved }),
        apps: state.apps.map((a) => (a.id === saved.id ? saved : a)),
      }));
      toast.info(`已更新预设「${target.name}」`);
    }
  },

  renameRunnerPreset: async (scope, presetId, name) => {
    const { app, workflow } = get().runners[scope];
    if (!app) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const presets = app.presets.map((preset) =>
      preset.id === presetId ? { ...preset, name: trimmed } : preset,
    );
    const nextApp: ComfyApp = { ...app, presets };
    const saved = await writeRunnerApp(nextApp, workflow);
    if (saved) {
      set((state) => ({
        runners: patchRunner(state, scope, { app: saved }),
        apps: state.apps.map((a) => (a.id === saved.id ? saved : a)),
      }));
    }
  },

  deleteRunnerPreset: async (scope, presetId) => {
    const { app, workflow, activePresetId } = get().runners[scope];
    if (!app) return;
    const presets = app.presets.filter((preset) => preset.id !== presetId);
    const stillActive = activePresetId === presetId ? null : activePresetId;
    const nextApp: ComfyApp = {
      ...app,
      presets,
      defaultPresetId: app.defaultPresetId === presetId ? undefined : app.defaultPresetId,
    };
    set((state) => ({
      runners: patchRunner(state, scope, { activePresetId: stillActive }),
    }));
    const saved = await writeRunnerApp(nextApp, workflow);
    if (saved) {
      set((state) => ({
        runners: patchRunner(state, scope, { app: saved }),
        apps: state.apps.map((a) => (a.id === saved.id ? saved : a)),
      }));
      toast.info("已删除预设");
    }
  },

  uploadRunnerImage: async (scope, componentId, bytes, filename, previewUrl) => {
    const serverConfig = useComfyUiStore.getState().serverConfig;
    try {
      const result = await uploadComfyImage(comfyUiClient, serverConfig, bytes, filename);
      const previous = get().runners[scope].values[componentId];
      if (previous && previous.kind === "image" && previous.previewUrl) {
        URL.revokeObjectURL(previous.previewUrl);
      }
      set((state) => ({
        runners: patchRunner(state, scope, {
          values: {
            ...state.runners[scope].values,
            [componentId]: { kind: "image", filename: result.filename, previewUrl },
          },
        }),
      }));
      toast.info(`已上传图片：${result.filename}`);
    } catch (error) {
      URL.revokeObjectURL(previewUrl);
      toast.error(comfyErrorMessage(error));
    }
  },

  runApp: async (scope) => {
    const runner = get().runners[scope];
    const { running, app, workflow, values, activePresetId } = runner;
    if (running) return;
    if (!app || !workflow) return;

    // 生成时把当前取值记为默认参数，下次开启自动使用
    const nextApp: ComfyApp = {
      ...app,
      defaultPresetId: activePresetId ?? undefined,
      defaultValues: snapshotRunnerValues(values),
    };
    void writeRunnerApp(nextApp, workflow).then((saved) => {
      if (saved) {
        set((state) => ({
          runners: patchRunner(state, scope, {
            app: state.runners[scope].app?.id === saved.id ? saved : state.runners[scope].app,
          }),
          apps: state.apps.map((a) => (a.id === saved.id ? saved : a)),
        }));
      }
    });

    const serverConfig = useComfyUiStore.getState().serverConfig;

    // 基础参数 + 组件取值覆盖
    let parameters = extractEditableParameters(workflow);
    for (const component of app.components) {
      const value = values[component.id];
      if (!value) continue;

      if (component.type === "ratioSize" && value.kind === "ratio") {
        let width: number;
        let height: number;
        if (value.ratioId === FREE_RATIO_ID) {
          width = Math.max(1, Math.round(value.width ?? 1));
          height = Math.max(1, Math.round(value.height ?? 1));
        } else {
          const preset = findAspectRatioPreset(value.ratioId);
          const config = component.ratio ?? DEFAULT_RATIO_SIZE_CONFIG;
          const size = computeRatioSize(
            preset ? { w: preset.w, h: preset.h } : { w: 1, h: 1 },
            value.maxEdge,
            value.orientation,
            config.step,
          );
          width = size.width;
          height = size.height;
        }
        if (component.widthParameterId) {
          parameters = setParameterValue(parameters, component.widthParameterId, width);
        }
        if (component.heightParameterId) {
          parameters = setParameterValue(parameters, component.heightParameterId, height);
        }
      } else if (component.type === "imageUpload" && value.kind === "image") {
        if (component.parameterId && value.filename) {
          parameters = setParameterValue(parameters, component.parameterId, value.filename);
        }
      } else if (component.type === "palette" && value.kind === "palette") {
        if (component.parameterId) {
          parameters = setParameterValue(
            parameters,
            component.parameterId,
            paletteItemsToValueString(value.colors),
          );
        }
      } else if (component.type === "randomNumber" && value.kind === "randomNumber") {
        if (component.parameterId) {
          parameters = setParameterValue(parameters, component.parameterId, value.value);
        }
      } else if (
        (component.type === "text" || component.type === "aiText") &&
        component.isPrompt &&
        value.kind === "prompt"
      ) {
        if (component.parameterId) {
          parameters = setParameterValue(
            parameters,
            component.parameterId,
            mergePromptValue(value.text, value.prompts),
          );
        }
      } else if (value.kind === "scalar" && component.parameterId) {
        parameters = setParameterValue(parameters, component.parameterId, value.value);
      }
    }

    // 随机数组件：本次任务沿用当前值，发送后用新随机正整数覆盖界面值
    const randomizedValues: Record<string, RunnerComponentValue> = {};
    for (const component of app.components) {
      const value = values[component.id];
      if (
        component.type === "randomNumber" &&
        value?.kind === "randomNumber" &&
        value.randomEnabled
      ) {
        randomizedValues[component.id] = { ...value, value: generateRandomPositiveInteger() };
      }
    }

    revokeResults(runner.results);
    const abortController = new AbortController();
    set((state) => ({
      runners: patchRunner(state, scope, {
        running: true,
        error: null,
        results: [],
        abortController,
        progress: { ...initialRunProgress, status: "queued" },
        values:
          Object.keys(randomizedValues).length > 0
            ? { ...state.runners[scope].values, ...randomizedValues }
            : state.runners[scope].values,
      }),
    }));

    const clientId = randomId("client");

    try {
      for await (const event of runComfyWorkflow(
        comfyUiClient,
        serverConfig,
        workflow,
        parameters,
        clientId,
        abortController.signal,
        { allowedOutputNodeIds: app.outputNodeIds },
      )) {
        if (event.kind === "progress") {
          set((state) => ({
            runners: patchRunner(state, scope, {
              progress: reduceProgress(state.runners[scope].progress, event.event),
            }),
          }));
        } else if (event.kind === "error") {
          set((state) => ({
            runners: patchRunner(state, scope, {
              error: event.message,
              progress: { ...state.runners[scope].progress, status: "error" },
            }),
          }));
        } else if (event.kind === "result") {
          const items: ComfyResultItem[] = event.images.map((image) => ({
            id: randomId("result"),
            ref: image.ref,
            blob: image.blob,
            objectUrl: URL.createObjectURL(image.blob),
          }));
          set((state) => ({
            runners: patchRunner(state, scope, {
              results: items,
              progress: { ...state.runners[scope].progress, status: "completed", percent: 100 },
            }),
          }));
        }
      }
    } catch (error) {
      const aborted = isComfyError(error) && error.code === "aborted";
      set((state) => ({
        runners: patchRunner(state, scope, {
          error: aborted ? null : comfyErrorMessage(error),
          progress: {
            ...state.runners[scope].progress,
            status: aborted ? "idle" : "error",
          },
        }),
      }));
    } finally {
      set((state) => ({
        runners: patchRunner(state, scope, {
          running: false,
          abortController: null,
        }),
      }));
    }
  },

  abortRunner: (scope) => {
    const { abortController } = get().runners[scope];
    if (abortController) {
      abortController.abort();
    }
    set((state) => ({
      runners: patchRunner(state, scope, {
        abortController: null,
        running: false,
      }),
    }));
  },

  savePromptPresetGroup: (name, prompts) => {
    const cleaned = prompts.map((p) => p.trim()).filter((p) => p.length > 0);
    if (cleaned.length === 0) {
      toast.error("请先添加提示词再保存预设");
      return;
    }
    const { library, preset } = addPromptPreset(get().promptPresetLibrary, cleaned, name);
    set({ promptPresetLibrary: library });
    void persistPromptPresetLibrary(library);
    toast.info(`已保存提示词预设「${preset.name}」`);
  },

  deletePromptPresetGroup: (id) => {
    const library = removePromptPreset(get().promptPresetLibrary, id);
    set({ promptPresetLibrary: library });
    void persistPromptPresetLibrary(library);
  },

  renamePromptPresetGroup: (id, name) => {
    const library = renamePromptPresetInLibrary(get().promptPresetLibrary, id, name);
    set({ promptPresetLibrary: library });
    void persistPromptPresetLibrary(library);
  },
}));
