import {
  ArrowDownOnSquareIcon,
  BookmarkSquareIcon,
  NoSymbolIcon,
  Squares2X2Icon,
  SunIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { MenuItem } from "../components/MenuDropdown";

export interface PalettePanelMenuPreset {
  id: string;
  name: string;
}

export interface PalettePanelMenuState {
  paletteViewMode: "grid" | "oklchMap";
  colorsCount: number;
  removeMode: boolean;
  presets: PalettePanelMenuPreset[];
  luminancePalettePresets: PalettePanelMenuPreset[];
  luminancePalettePanelVisible: boolean;
}

export interface PalettePanelMenuActions {
  setPaletteViewMode: (mode: "grid" | "oklchMap") => void;
  enterRemoveMode: () => void;
  requestClearPalette: () => void;
  saveAsPreset: () => void;
  importPresetMerge: (id: string) => void;
  openPresetManager: () => void;
  toggleLuminancePalettePanel: () => void;
  saveLuminancePaletteAsPreset: () => void;
  importLuminancePalettePreset: (id: string) => void;
  openLuminancePalettePresetManager: () => void;
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
        checked: state.paletteViewMode === "oklchMap",
        onClick: () => actions.setPaletteViewMode("oklchMap"),
      },
    );
  }

  if (!state.removeMode) {
    if (items.length > 0) items.push({ type: "separator" });

    if (state.colorsCount > 0) {
      items.push({
        type: "action",
        label: "保存为预设",
        icon: BookmarkSquareIcon,
        onClick: actions.saveAsPreset,
      });
    }

    items.push({
      type: "submenu",
      label: "从预设导入（合并）",
      icon: ArrowDownOnSquareIcon,
      items:
        state.presets.length > 0
          ? state.presets.map((preset) => ({
              type: "action" as const,
              label: preset.name,
              onClick: () => actions.importPresetMerge(preset.id),
            }))
          : [{ type: "action" as const, label: "暂无预设", onClick: () => {}, disabled: true }],
    });

    items.push({
      type: "action",
      label: "管理预设…",
      icon: Squares2X2Icon,
      onClick: actions.openPresetManager,
    });

    items.push({ type: "separator" });
    items.push({
      type: "action",
      label: state.luminancePalettePanelVisible ? "关闭明度色板" : "打开明度色板",
      icon: SunIcon,
      onClick: actions.toggleLuminancePalettePanel,
    });
    items.push({
      type: "action",
      label: "保存明度色板为预设",
      icon: BookmarkSquareIcon,
      onClick: actions.saveLuminancePaletteAsPreset,
    });
    items.push({
      type: "submenu",
      label: "从明度色板预设导入",
      icon: ArrowDownOnSquareIcon,
      items:
        state.luminancePalettePresets.length > 0
          ? state.luminancePalettePresets.map((preset) => ({
              type: "action" as const,
              label: preset.name,
              onClick: () => actions.importLuminancePalettePreset(preset.id),
            }))
          : [{ type: "action" as const, label: "暂无预设", onClick: () => {}, disabled: true }],
    });
    items.push({
      type: "action",
      label: "管理明度色板预设…",
      icon: Squares2X2Icon,
      onClick: actions.openLuminancePalettePresetManager,
    });
  }

  if (state.colorsCount > 0 && !state.removeMode) {
    items.push({ type: "separator" });
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
