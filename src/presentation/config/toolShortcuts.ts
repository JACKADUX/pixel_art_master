import type { ToolType } from "@/domain/tool/ToolType";

export const TOOL_SHORTCUTS: Record<ToolType, string> = {
  brush: "B",
  fill: "G",
  eraser: "E",
  shape: "U",
  select: "M",
  transform: "V",
};

const SHORTCUT_CODE_TO_TOOL: Record<string, ToolType> = {
  KeyB: "brush",
  KeyG: "fill",
  KeyE: "eraser",
  KeyU: "shape",
  KeyM: "select",
  KeyV: "transform",
};

export function toolFromShortcutCode(code: string): ToolType | null {
  return SHORTCUT_CODE_TO_TOOL[code] ?? null;
}
