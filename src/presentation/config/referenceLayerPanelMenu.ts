import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import type { MenuItem } from "../components/MenuDropdown";

export interface ReferenceLayerPanelMenuActions {
  importFromClipboard: () => void;
}

export function buildReferenceLayerPanelMenuItems(
  actions: ReferenceLayerPanelMenuActions,
): MenuItem[] {
  return [
    {
      type: "action",
      label: "从剪贴板导入",
      icon: ClipboardDocumentIcon,
      shortcut: "Ctrl+V",
      onClick: actions.importFromClipboard,
    },
  ];
}
