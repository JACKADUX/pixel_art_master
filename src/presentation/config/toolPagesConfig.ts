export type ToolPageId = "pixelRestore" | "colorEdit";

export interface ToolPageDefinition {
  id: ToolPageId;
  label: string;
}

export const TOOL_PAGES: ToolPageDefinition[] = [
  { id: "pixelRestore", label: "像素还原" },
  { id: "colorEdit", label: "颜色编辑" },
];
