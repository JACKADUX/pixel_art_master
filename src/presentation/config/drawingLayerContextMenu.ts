import type { MenuItem } from "../components/MenuDropdown";
import { SHORTCUT_LABELS } from "./menuConfig";

export interface DrawingLayerContextMenuState {
  canPaste: boolean;
  canMergeDown: boolean;
}

export interface DrawingLayerContextMenuActions {
  copyLayer: () => void;
  pasteLayer: () => void;
  mergeLayerDown: () => void;
}

export function buildDrawingLayerContextMenuItems(
  state: DrawingLayerContextMenuState,
  actions: DrawingLayerContextMenuActions,
): MenuItem[] {
  return [
    {
      type: "action",
      label: "复制",
      shortcut: SHORTCUT_LABELS.copy,
      onClick: actions.copyLayer,
    },
    {
      type: "action",
      label: "粘贴",
      shortcut: SHORTCUT_LABELS.paste,
      disabled: !state.canPaste,
      onClick: actions.pasteLayer,
    },
    { type: "separator" },
    {
      type: "action",
      label: "向下合并图层",
      disabled: !state.canMergeDown,
      onClick: actions.mergeLayerDown,
    },
  ];
}
