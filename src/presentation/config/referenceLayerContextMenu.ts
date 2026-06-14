import type { ReferenceColorImportScope } from "@/application/use-cases/ImportReferenceLayerColorsToPalette";
import type { ReferenceLayer } from "@/domain/layer/Layer";
import type { MenuItem } from "../components/MenuDropdown";

export interface ReferenceLayerContextMenuActions {
  openCropEditor: (layerId: string) => void;
  toggleReferenceGrid: (layerId: string) => void;
  importImageToReferenceLayer: (layerId: string) => void;
  importReferenceLayerColors: (layerId: string, scope: ReferenceColorImportScope) => void;
}

export function buildReferenceLayerContextMenuItems(
  layer: ReferenceLayer,
  actions: ReferenceLayerContextMenuActions,
): MenuItem[] {
  if (!layer.imageData) {
    return [
      {
        type: "action",
        label: "导入图片",
        onClick: () => actions.importImageToReferenceLayer(layer.id),
      },
    ];
  }

  return [
    {
      type: "action",
      label: "裁剪",
      onClick: () => actions.openCropEditor(layer.id),
    },
    {
      type: "toggle",
      label: "显示网格",
      checked: layer.grid.visible,
      onClick: () => actions.toggleReferenceGrid(layer.id),
    },
    { type: "separator" },
    {
      type: "submenu",
      label: "导入到色板",
      items: [
        {
          type: "action",
          label: "导入选框颜色",
          disabled: !layer.crop,
          onClick: () => actions.importReferenceLayerColors(layer.id, "crop"),
        },
        {
          type: "action",
          label: "导入全图颜色",
          onClick: () => actions.importReferenceLayerColors(layer.id, "full"),
        },
      ],
    },
  ];
}
