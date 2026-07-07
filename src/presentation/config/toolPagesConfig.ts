export type ToolPageId = "pixelRestore" | "colorEdit" | "world" | "colorVariation";

export interface ToolPageDefinition {
  id: ToolPageId;
  label: string;
}

export const TOOL_PAGES: ToolPageDefinition[] = [
  { id: "pixelRestore", label: "像素还原" },
  { id: "colorEdit", label: "颜色编辑" },
  { id: "world", label: "世界创建器" },
  { id: "colorVariation", label: "颜色变化分析" },
];
