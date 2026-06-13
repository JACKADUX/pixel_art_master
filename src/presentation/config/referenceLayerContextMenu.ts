import type { ReferenceLayer } from "@/domain/layer/Layer";
import type { MenuItem } from "../components/MenuDropdown";

export interface ReferenceLayerContextMenuActions {
  openCropEditor: (layerId: string) => void;
  toggleReferenceGrid: (layerId: string) => void;
  importImageToReferenceLayer: (layerId: string) => void;
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
  ];
}
