import type { ComfyParameterType } from "@/domain/comfyui/ComfyParameter";

/**
 * 应用层组件类型。
 * - text       : 普通字符串输入
 * - aiText     : 支持 AI 优化的字符串输入（复用 AiTextField）
 * - number     : 数值输入
 * - boolean    : 开关
 * - imageUpload: 字符串参数，但允许用户选择本地图片并上传到 ComfyUI
 * - ratioSize  : 绑定宽、高两个数值参数，按预设比例 + 最大边自动计算
 * - palette    : 字符串参数，以网格色块展示一组 hex 颜色（.hex 文本，每行一个）
 * - randomNumber: 整数输入 + 「启用随机数」开关，开启后每次生成任务后用随机正整数覆盖当前值
 */
export type AppComponentType =
  | "text"
  | "aiText"
  | "number"
  | "boolean"
  | "imageUpload"
  | "ratioSize"
  | "palette"
  | "randomNumber";

/** 宽高比例组件配置 */
export interface RatioSizeConfig {
  /** 默认比例预设 id，如 "1:1" */
  defaultRatioId: string;
  /** 默认最大边 */
  defaultMaxEdge: number;
  /** 数值对齐步长（如 8，便于扩散模型对齐） */
  step: number;
}

export interface AppComponent {
  id: string;
  type: AppComponentType;
  /** 展示名称 */
  label: string;
  /** 在运行弹窗中的排序 */
  order: number;
  /** 单参数绑定（text / aiText / number / boolean / imageUpload） */
  parameterId?: string;
  /** ratioSize：宽参数绑定 */
  widthParameterId?: string;
  /** ratioSize：高参数绑定 */
  heightParameterId?: string;
  /** ratioSize 专属配置 */
  ratio?: RatioSizeConfig;
  /** text / aiText：是否作为提示词（启用提示词组件，运行时把启用提示词合并到输入末尾） */
  isPrompt?: boolean;
}

export const DEFAULT_RATIO_SIZE_CONFIG: RatioSizeConfig = {
  defaultRatioId: "1:1",
  defaultMaxEdge: 1024,
  step: 8,
};

/** 组件覆盖到的全部参数 id（用于在参数面板上标注「已提取」） */
export function componentParameterIds(component: AppComponent): string[] {
  const ids: string[] = [];
  if (component.parameterId) ids.push(component.parameterId);
  if (component.widthParameterId) ids.push(component.widthParameterId);
  if (component.heightParameterId) ids.push(component.heightParameterId);
  return ids;
}

/** 某参数类型默认采用的组件类型 */
export function defaultComponentTypeFor(parameterType: ComfyParameterType): AppComponentType {
  if (parameterType === "number") return "number";
  if (parameterType === "boolean") return "boolean";
  return "text";
}

/** 某参数类型可选的组件类型集合 */
export function availableComponentTypesFor(
  parameterType: ComfyParameterType,
): AppComponentType[] {
  if (parameterType === "number") return ["number", "ratioSize", "randomNumber"];
  if (parameterType === "boolean") return ["boolean"];
  return ["text", "aiText", "imageUpload", "palette"];
}

export function componentTypeLabel(type: AppComponentType): string {
  switch (type) {
    case "text":
      return "文本输入";
    case "aiText":
      return "AI 优化输入";
    case "number":
      return "数值输入";
    case "boolean":
      return "开关";
    case "imageUpload":
      return "图片加载";
    case "ratioSize":
      return "宽高比例";
    case "palette":
      return "色板";
    case "randomNumber":
      return "随机数";
  }
}
