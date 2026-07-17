import { PencilSquareIcon } from "@heroicons/react/24/outline";

export interface LuminancePalettePanelMenuState {
  editMode: boolean;
}

export interface LuminancePalettePanelMenuActions {
  toggleEditMode: () => void;
  closePanel: () => void;
}

export interface LuminancePalettePanelMenuEntry {
  id: string;
  label: string;
  icon?: typeof PencilSquareIcon;
  onClick: () => void;
  disabled?: boolean;
  checked?: boolean;
  type: "action" | "toggle" | "separator";
}

export function buildLuminancePalettePanelMenuEntries(
  state: LuminancePalettePanelMenuState,
  actions: LuminancePalettePanelMenuActions,
): LuminancePalettePanelMenuEntry[] {
  return [
    {
      id: "toggle-edit-mode",
      type: "toggle",
      label: "编辑模式",
      icon: PencilSquareIcon,
      checked: state.editMode,
      onClick: actions.toggleEditMode,
    },
  ];
}
