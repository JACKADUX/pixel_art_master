import type { MenuItem } from "../components/MenuDropdown";
import { SHORTCUT_LABELS } from "./menuConfig";

export interface SelectionContextMenuState {
  hasSelection: boolean;
  hasFloatingSelection: boolean;
}

export interface SelectionContextMenuActions {
  selectAll: () => void;
  deselect: () => void;
  invertSelection: () => void;
  copySelection: () => void;
  cutSelection: () => void;
  pasteSelection: () => void;
  clearSelectionContent: () => void;
  commitSelection: () => void;
  cancelSelection: () => void;
  sendSelectionColorsToAnalysis: () => void;
}

export function buildSelectionContextMenuItems(
  state: SelectionContextMenuState,
  actions: SelectionContextMenuActions,
): MenuItem[] {
  const { hasSelection, hasFloatingSelection } = state;

  return [
    {
      type: "action",
      label: "全选",
      shortcut: SHORTCUT_LABELS.selectAll,
      onClick: actions.selectAll,
    },
    {
      type: "action",
      label: "取消选区",
      shortcut: SHORTCUT_LABELS.deselect,
      disabled: !hasSelection,
      onClick: actions.deselect,
    },
    {
      type: "action",
      label: "反选",
      shortcut: SHORTCUT_LABELS.invertSelection,
      disabled: !hasSelection,
      onClick: actions.invertSelection,
    },
    { type: "separator" },
    {
      type: "action",
      label: "复制",
      shortcut: SHORTCUT_LABELS.copy,
      disabled: !hasSelection,
      onClick: actions.copySelection,
    },
    {
      type: "action",
      label: "剪切",
      shortcut: SHORTCUT_LABELS.cut,
      disabled: !hasSelection,
      onClick: actions.cutSelection,
    },
    {
      type: "action",
      label: "粘贴",
      shortcut: SHORTCUT_LABELS.paste,
      onClick: actions.pasteSelection,
    },
    { type: "separator" },
    {
      type: "action",
      label: "发送选区颜色到分析工具",
      disabled: !hasSelection,
      onClick: actions.sendSelectionColorsToAnalysis,
    },
    { type: "separator" },
    {
      type: "action",
      label: "删除选区内容",
      shortcut: "Delete",
      disabled: !hasSelection,
      onClick: actions.clearSelectionContent,
    },
    {
      type: "action",
      label: "提交选区",
      shortcut: "Enter",
      disabled: !hasFloatingSelection,
      onClick: actions.commitSelection,
    },
    {
      type: "action",
      label: "取消浮动选区",
      shortcut: "Esc",
      disabled: !hasFloatingSelection,
      onClick: actions.cancelSelection,
    },
  ];
}
