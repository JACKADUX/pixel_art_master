import type { PaletteColorItem } from "./PaletteComponent";
import type { PromptItem } from "./PromptComponent";
import type { RatioOrientation } from "./RatioSize";

/**
 * 参数预设：对应用运行时「暴露参数」当前取值的一次命名快照。
 * 仅保存可序列化的取值（图片只存服务器文件名，不含本地预览地址）。
 */

export interface ScalarPresetValue {
  kind: "scalar";
  value: string | number | boolean;
}

export interface RatioPresetValue {
  kind: "ratio";
  ratioId: string;
  maxEdge: number;
  orientation: RatioOrientation;
  /** ratioId 为 "free" 时使用的显式宽高 */
  width?: number;
  height?: number;
}

export interface ImagePresetValue {
  kind: "image";
  filename: string;
}

export interface PalettePresetValue {
  kind: "palette";
  colors: PaletteColorItem[];
}

export interface RandomNumberPresetValue {
  kind: "randomNumber";
  value: number;
  randomEnabled: boolean;
}

export interface PromptPresetValue {
  kind: "prompt";
  text: string;
  prompts: PromptItem[];
}

export type PresetComponentValue =
  | ScalarPresetValue
  | RatioPresetValue
  | ImagePresetValue
  | PalettePresetValue
  | RandomNumberPresetValue
  | PromptPresetValue;

/** 组件 id -> 取值 的映射 */
export type PresetValues = Record<string, PresetComponentValue>;

export interface ParameterPreset {
  id: string;
  name: string;
  values: PresetValues;
}

function generatePresetId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `preset-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createParameterPreset(name: string, values: PresetValues): ParameterPreset {
  return {
    id: generatePresetId(),
    name: name.trim() || "未命名预设",
    values: clonePresetValues(values),
  };
}

export function clonePresetValues(values: PresetValues): PresetValues {
  const next: PresetValues = {};
  for (const [key, value] of Object.entries(values)) {
    if (value.kind === "palette") {
      next[key] = { ...value, colors: value.colors.map((color) => ({ ...color })) };
    } else if (value.kind === "prompt") {
      next[key] = { ...value, prompts: value.prompts.map((prompt) => ({ ...prompt })) };
    } else {
      next[key] = { ...value };
    }
  }
  return next;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 解析单个组件取值，无法识别时返回 null */
export function parsePresetComponentValue(raw: unknown): PresetComponentValue | null {
  if (!isRecord(raw)) return null;
  if (raw.kind === "scalar") {
    const value = raw.value;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return { kind: "scalar", value };
    }
    return null;
  }
  if (raw.kind === "ratio") {
    if (typeof raw.ratioId !== "string") return null;
    const maxEdge =
      typeof raw.maxEdge === "number" && Number.isFinite(raw.maxEdge)
        ? Math.max(1, Math.round(raw.maxEdge))
        : 1024;
    const orientation: RatioOrientation = raw.orientation === "portrait" ? "portrait" : "landscape";
    const width =
      typeof raw.width === "number" && Number.isFinite(raw.width)
        ? Math.max(1, Math.round(raw.width))
        : undefined;
    const height =
      typeof raw.height === "number" && Number.isFinite(raw.height)
        ? Math.max(1, Math.round(raw.height))
        : undefined;
    return { kind: "ratio", ratioId: raw.ratioId, maxEdge, orientation, width, height };
  }
  if (raw.kind === "image") {
    return { kind: "image", filename: typeof raw.filename === "string" ? raw.filename : "" };
  }
  if (raw.kind === "palette") {
    if (!Array.isArray(raw.colors)) return null;
    const colors: PaletteColorItem[] = [];
    for (const item of raw.colors) {
      if (!isRecord(item) || typeof item.hex !== "string") continue;
      colors.push({ hex: item.hex, disabled: item.disabled === true });
    }
    return { kind: "palette", colors };
  }
  if (raw.kind === "randomNumber") {
    const value =
      typeof raw.value === "number" && Number.isFinite(raw.value) ? Math.floor(raw.value) : 0;
    return { kind: "randomNumber", value, randomEnabled: raw.randomEnabled === true };
  }
  if (raw.kind === "prompt") {
    const text = typeof raw.text === "string" ? raw.text : "";
    const prompts: PromptItem[] = [];
    if (Array.isArray(raw.prompts)) {
      for (const item of raw.prompts) {
        if (!isRecord(item) || typeof item.id !== "string" || typeof item.text !== "string") continue;
        prompts.push({ id: item.id, text: item.text, disabled: item.disabled === true });
      }
    }
    return { kind: "prompt", text, prompts };
  }
  return null;
}

/** 解析取值映射，跳过非法项 */
export function parsePresetValues(raw: unknown): PresetValues {
  if (!isRecord(raw)) return {};
  const values: PresetValues = {};
  for (const [key, item] of Object.entries(raw)) {
    const parsed = parsePresetComponentValue(item);
    if (parsed) values[key] = parsed;
  }
  return values;
}

/** 解析单个预设，无法识别时返回 null */
export function parseParameterPreset(raw: unknown, index: number): ParameterPreset | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || raw.id.trim() === "") return null;
  return {
    id: raw.id,
    name: typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name : `预设 ${index + 1}`,
    values: parsePresetValues(raw.values),
  };
}
