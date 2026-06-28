import type { AppComponent } from "./ComfyAppComponent";
import { clonePresetValues, type ParameterPreset, type PresetValues } from "./ParameterPreset";

/** 封装后的应用：元数据 + 提取参数的组件配置（工作流以独立文件备份） */
export interface ComfyApp {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  components: AppComponent[];
  /**
   * 仅输出这些节点产生的结果图（节点 id）。
   * `undefined` 表示不限制，保留工作流全部输出。
   */
  outputNodeIds?: string[];
  /** 用户保存的参数预设列表 */
  presets: ParameterPreset[];
  /** 上次选中的预设 id（用于下次开启时高亮），未选则 undefined */
  defaultPresetId?: string;
  /** 上次使用的参数取值快照，下次开启运行弹窗时自动还原 */
  defaultValues?: PresetValues;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `app-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createComfyApp(params: {
  name: string;
  description?: string;
  components: AppComponent[];
  outputNodeIds?: string[];
  id?: string;
  presets?: ParameterPreset[];
  defaultPresetId?: string;
  defaultValues?: PresetValues;
}): ComfyApp {
  const now = Date.now();
  return {
    id: params.id ?? generateId(),
    name: params.name.trim() || "未命名应用",
    description: params.description?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
    components: params.components,
    outputNodeIds: params.outputNodeIds ? [...params.outputNodeIds] : undefined,
    presets: params.presets ? params.presets.map((preset) => ({ ...preset })) : [],
    defaultPresetId: params.defaultPresetId,
    defaultValues: params.defaultValues ? clonePresetValues(params.defaultValues) : undefined,
  };
}

/** 更新修改时间 */
export function touchComfyApp(app: ComfyApp): ComfyApp {
  return { ...app, updatedAt: Date.now() };
}

/** 生成副本：新 id、新时间戳、名称追加「副本」 */
export function duplicateComfyApp(app: ComfyApp): ComfyApp {
  const now = Date.now();
  return {
    ...app,
    id: generateId(),
    name: `${app.name} 副本`,
    createdAt: now,
    updatedAt: now,
    components: app.components.map((component) => ({ ...component })),
    outputNodeIds: app.outputNodeIds ? [...app.outputNodeIds] : undefined,
    presets: app.presets.map((preset) => ({ ...preset, values: clonePresetValues(preset.values) })),
    defaultPresetId: app.defaultPresetId,
    defaultValues: app.defaultValues ? clonePresetValues(app.defaultValues) : undefined,
  };
}
