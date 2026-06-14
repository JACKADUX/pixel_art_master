import { NoSymbolIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { MenuItem } from "../components/MenuDropdown";

export interface PalettePanelMenuState {
  paletteViewMode: "grid" | "oklabMap";
  colorsCount: number;
  removeMode: boolean;
}

export interface PalettePanelMenuActions {
  setPaletteViewMode: (mode: "grid" | "oklabMap") => void;
  enterRemoveMode: () => void;
  requestClearPalette: () => void;
}

export function buildPalettePanelMenuItems(
  state: PalettePanelMenuState,
  actions: PalettePanelMenuActions,
): MenuItem[] {
  const items: MenuItem[] = [];

  if (state.colorsCount > 0) {
    items.push(
      {
        type: "toggle",
        label: "网格",
        checked: state.paletteViewMode === "grid",
        onClick: () => actions.setPaletteViewMode("grid"),
      },
      {
        type: "toggle",
        label: "色域图",
        checked: state.paletteViewMode === "oklabMap",
        onClick: () => actions.setPaletteViewMode("oklabMap"),
      },
    );
  }

  if (state.colorsCount > 0 && !state.removeMode) {
    if (items.length > 0) items.push({ type: "separator" });
    items.push(
      {
        type: "action",
        label: "移除颜色",
        icon: TrashIcon,
        onClick: actions.enterRemoveMode,
      },
      {
        type: "action",
        label: "清空色板",
        icon: NoSymbolIcon,
        onClick: actions.requestClearPalette,
      },
    );
  }

  return items;
}
