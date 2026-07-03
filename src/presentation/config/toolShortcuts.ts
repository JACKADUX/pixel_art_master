import type { SelectionMode, ToolType } from "@/domain/tool/ToolType";

export const TOOL_SHORTCUTS: Record<ToolType, string> = {
  brush: "B",
  fill: "G",
  eraser: "E",
  shape: "U",
  select: "M",
  transform: "V",
  repeatTile: "T",
};

export const SELECTION_MODE_SHORTCUTS: Partial<Record<SelectionMode, string>> = {
  rectangle: "M",
  magicWand: "W",
};

const SHORTCUT_CODE_TO_TOOL: Record<string, ToolType> = {
  KeyB: "brush",
  KeyG: "fill",
  KeyE: "eraser",
  KeyU: "shape",
  KeyV: "transform",
  KeyT: "repeatTile",
};

const SHORTCUT_CODE_TO_SELECTION_MODE: Record<string, SelectionMode> = {
  KeyM: "rectangle",
  KeyW: "magicWand",
};

export function toolFromShortcutCode(code: string): ToolType | null {
  return SHORTCUT_CODE_TO_TOOL[code] ?? null;
}

export function selectionModeFromShortcutCode(code: string): SelectionMode | null {
  return SHORTCUT_CODE_TO_SELECTION_MODE[code] ?? null;
}
