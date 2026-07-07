export type PluginPageId = "pixelRestore" | "colorEdit" | "world" | "colorVariation";

export interface PluginPageDefinition {
  id: PluginPageId;
  label: string;
}

export const PLUGIN_PAGES: PluginPageDefinition[] = [
  { id: "pixelRestore", label: "像素还原" },
  { id: "colorEdit", label: "颜色编辑" },
  { id: "world", label: "世界创建器" },
  { id: "colorVariation", label: "颜色变化分析" },
];
