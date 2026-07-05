import type { ComponentType } from "react";
import { AiSettingsSection } from "./AiSettingsSection";
import { CanvasSettingsSection } from "./CanvasSettingsSection";
import { ComfyUiSettingsSection } from "./ComfyUiSettingsSection";
import { GeneralSettingsSection } from "./GeneralSettingsSection";

export type SettingsSectionId = "general" | "canvas" | "ai" | "comfyui";

export interface SettingsSectionDefinition {
  id: SettingsSectionId;
  label: string;
  description: string;
  component: ComponentType;
}

export const SETTINGS_SECTIONS: readonly SettingsSectionDefinition[] = [
  {
    id: "general",
    label: "通用",
    description: "软件数据路径、自动保存与界面选项",
    component: GeneralSettingsSection,
  },
  {
    id: "canvas",
    label: "画布",
    description: "网格与透明背景棋盘格显示",
    component: CanvasSettingsSection,
  },
  {
    id: "ai",
    label: "AI",
    description: "LLM 提供商与连接配置",
    component: AiSettingsSection,
  },
  {
    id: "comfyui",
    label: "ComfyUI",
    description: "ComfyUI 服务器地址",
    component: ComfyUiSettingsSection,
  },
];
