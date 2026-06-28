/** 提示词预设库的领域模型与纯函数：可跨参数复用的提示词组 */

export const PROMPT_PRESET_LIBRARY_VERSION = 1;

export interface PromptPreset {
  id: string;
  name: string;
  /** 预设中的提示词文本（导入时全部视为启用） */
  prompts: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptPresetLibrary {
  version: number;
  presets: PromptPreset[];
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `prompt-preset-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatDefaultName(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `提示词 ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function createEmptyPromptPresetLibrary(): PromptPresetLibrary {
  return { version: PROMPT_PRESET_LIBRARY_VERSION, presets: [] };
}

export function listPromptPresets(library: PromptPresetLibrary): PromptPreset[] {
  return [...library.presets].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getPromptPreset(
  library: PromptPresetLibrary,
  id: string,
): PromptPreset | null {
  return library.presets.find((preset) => preset.id === id) ?? null;
}

export function addPromptPreset(
  library: PromptPresetLibrary,
  prompts: readonly string[],
  name?: string,
): { library: PromptPresetLibrary; preset: PromptPreset } {
  const now = new Date().toISOString();
  const trimmed = name?.trim();
  const preset: PromptPreset = {
    id: randomId(),
    name: trimmed && trimmed.length > 0 ? trimmed : formatDefaultName(),
    prompts: prompts.map((text) => text.trim()).filter((text) => text.length > 0),
    createdAt: now,
    updatedAt: now,
  };
  return { library: { ...library, presets: [...library.presets, preset] }, preset };
}

export function removePromptPreset(
  library: PromptPresetLibrary,
  id: string,
): PromptPresetLibrary {
  return { ...library, presets: library.presets.filter((preset) => preset.id !== id) };
}

export function renamePromptPresetInLibrary(
  library: PromptPresetLibrary,
  id: string,
  name: string,
): PromptPresetLibrary {
  const trimmed = name.trim();
  if (!trimmed) return library;
  return {
    ...library,
    presets: library.presets.map((preset) =>
      preset.id === id ? { ...preset, name: trimmed, updatedAt: new Date().toISOString() } : preset,
    ),
  };
}

export function updatePromptPresetPrompts(
  library: PromptPresetLibrary,
  id: string,
  prompts: readonly string[],
): PromptPresetLibrary {
  return {
    ...library,
    presets: library.presets.map((preset) =>
      preset.id === id
        ? {
            ...preset,
            prompts: prompts.map((text) => text.trim()).filter((text) => text.length > 0),
            updatedAt: new Date().toISOString(),
          }
        : preset,
    ),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePreset(raw: unknown): PromptPreset | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.id !== "string" || typeof raw.name !== "string") return null;
  const prompts = Array.isArray(raw.prompts)
    ? raw.prompts.filter((text): text is string => typeof text === "string")
    : [];
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString();
  const updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt;
  return { id: raw.id, name: raw.name, prompts, createdAt, updatedAt };
}

/** 健壮解析提示词预设库；无法识别时返回空库 */
export function parsePromptPresetLibrary(raw: unknown): PromptPresetLibrary {
  if (!isRecord(raw)) return createEmptyPromptPresetLibrary();
  const presets = Array.isArray(raw.presets)
    ? raw.presets.map(parsePreset).filter((preset): preset is PromptPreset => preset !== null)
    : [];
  return { version: PROMPT_PRESET_LIBRARY_VERSION, presets };
}
