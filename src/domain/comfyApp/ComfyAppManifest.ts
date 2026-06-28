import type { ComfyApp } from "./ComfyApp";
import {
  DEFAULT_RATIO_SIZE_CONFIG,
  type AppComponent,
  type AppComponentType,
  type RatioSizeConfig,
} from "./ComfyAppComponent";
import {
  parseParameterPreset,
  parsePresetValues,
  type ParameterPreset,
  type PresetValues,
} from "./ParameterPreset";

export const COMFY_APP_MANIFEST_VERSION = 2;

interface SerializedManifest {
  version: number;
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  components: AppComponent[];
  outputNodeIds?: string[];
  presets: ParameterPreset[];
  defaultPresetId?: string;
  defaultValues?: PresetValues;
}

const COMPONENT_TYPES: AppComponentType[] = [
  "text",
  "aiText",
  "number",
  "boolean",
  "imageUpload",
  "ratioSize",
  "palette",
  "randomNumber",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRatioConfig(raw: unknown): RatioSizeConfig {
  if (!isRecord(raw)) return { ...DEFAULT_RATIO_SIZE_CONFIG };
  return {
    defaultRatioId:
      typeof raw.defaultRatioId === "string"
        ? raw.defaultRatioId
        : DEFAULT_RATIO_SIZE_CONFIG.defaultRatioId,
    defaultMaxEdge:
      typeof raw.defaultMaxEdge === "number" && Number.isFinite(raw.defaultMaxEdge)
        ? Math.max(1, Math.round(raw.defaultMaxEdge))
        : DEFAULT_RATIO_SIZE_CONFIG.defaultMaxEdge,
    step:
      typeof raw.step === "number" && Number.isFinite(raw.step)
        ? Math.max(1, Math.round(raw.step))
        : DEFAULT_RATIO_SIZE_CONFIG.step,
  };
}

function parseComponent(raw: unknown, index: number): AppComponent | null {
  if (!isRecord(raw)) return null;
  const type = raw.type;
  if (typeof type !== "string" || !COMPONENT_TYPES.includes(type as AppComponentType)) {
    return null;
  }
  const component: AppComponent = {
    id: typeof raw.id === "string" ? raw.id : `component-${index}`,
    type: type as AppComponentType,
    label: typeof raw.label === "string" ? raw.label : "",
    order: typeof raw.order === "number" && Number.isFinite(raw.order) ? raw.order : index,
  };
  if (typeof raw.parameterId === "string") component.parameterId = raw.parameterId;
  if (typeof raw.widthParameterId === "string") component.widthParameterId = raw.widthParameterId;
  if (typeof raw.heightParameterId === "string") {
    component.heightParameterId = raw.heightParameterId;
  }
  if (component.type === "ratioSize") {
    component.ratio = parseRatioConfig(raw.ratio);
  }
  if (typeof raw.isPrompt === "boolean") {
    component.isPrompt = raw.isPrompt;
  }
  return component;
}

export function serializeComfyApp(app: ComfyApp): string {
  const payload: SerializedManifest = {
    version: COMFY_APP_MANIFEST_VERSION,
    id: app.id,
    name: app.name,
    description: app.description,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    components: app.components,
    outputNodeIds: app.outputNodeIds,
    presets: app.presets,
    defaultPresetId: app.defaultPresetId,
    defaultValues: app.defaultValues,
  };
  return JSON.stringify(payload, null, 2);
}

/** 解析应用清单 JSON，做健壮校验并回退默认值；无法识别时返回 null */
export function parseComfyAppManifest(raw: unknown): ComfyApp | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || raw.id.trim() === "") return null;

  const now = Date.now();
  const componentsRaw = Array.isArray(raw.components) ? raw.components : [];
  const components = componentsRaw
    .map((item, index) => parseComponent(item, index))
    .filter((item): item is AppComponent => item !== null);

  const outputNodeIds = Array.isArray(raw.outputNodeIds)
    ? raw.outputNodeIds.filter((id): id is string => typeof id === "string")
    : undefined;

  const presets = Array.isArray(raw.presets)
    ? raw.presets
        .map((item, index) => parseParameterPreset(item, index))
        .filter((item): item is ParameterPreset => item !== null)
    : [];

  const defaultPresetId =
    typeof raw.defaultPresetId === "string" && raw.defaultPresetId.trim() !== ""
      ? raw.defaultPresetId
      : undefined;

  const defaultValues =
    raw.defaultValues === undefined ? undefined : parsePresetValues(raw.defaultValues);

  return {
    id: raw.id,
    name: typeof raw.name === "string" && raw.name.trim() !== "" ? raw.name : "未命名应用",
    description: typeof raw.description === "string" ? raw.description : "",
    createdAt:
      typeof raw.createdAt === "number" && Number.isFinite(raw.createdAt) ? raw.createdAt : now,
    updatedAt:
      typeof raw.updatedAt === "number" && Number.isFinite(raw.updatedAt) ? raw.updatedAt : now,
    components,
    outputNodeIds,
    presets,
    defaultPresetId,
    defaultValues,
  };
}

export function parseComfyAppManifestJson(json: string): ComfyApp | null {
  try {
    return parseComfyAppManifest(JSON.parse(json));
  } catch {
    return null;
  }
}
