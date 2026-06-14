import type { ReferenceColorImportScope } from "@/application/use-cases/ImportReferenceLayerColorsToPalette";
import { TrashIcon } from "@heroicons/react/24/outline";
import type { MenuItem } from "../components/MenuDropdown";

export interface PalettePanelMenuState {
  paletteViewMode: "grid" | "oklabMap";
  colorsCount: number;
  canImportReference: boolean;
  removeMode: boolean;
}

export interface PalettePanelMenuActions {
  setPaletteViewMode: (mode: "grid" | "oklabMap") => void;
  importReferenceLayerColors: (scope: ReferenceColorImportScope) => void;
  enterRemoveMode: () => void;
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

  if (state.canImportReference) {
    if (items.length > 0) items.push({ type: "separator" });
    items.push({
      type: "submenu",
      label: "从参考层导入",
      items: [
        {
          type: "action",
          label: "导入选框颜色",
          onClick: () => actions.importReferenceLayerColors("crop"),
        },
        {
          type: "action",
          label: "导入全图颜色",
          onClick: () => actions.importReferenceLayerColors("full"),
        },
      ],
    });
  }

  if (state.colorsCount > 0 && !state.removeMode) {
    if (items.length > 0) items.push({ type: "separator" });
    items.push({
      type: "action",
      label: "移除颜色",
      icon: TrashIcon,
      onClick: actions.enterRemoveMode,
    });
  }

  return items;
}
