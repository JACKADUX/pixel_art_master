import type { AssetRecord } from "@/domain/asset/AssetRecord";
import { isImageAsset } from "@/domain/asset/AssetRecord";
import type { MenuItem } from "../components/MenuDropdown";
import { TOOL_PAGES, type ToolPageId } from "./toolPagesConfig";

export interface AssetContextMenuActions {
  onImportDrawingLayer: (assetId: string) => void;
  onImportReferenceLayer: (assetId: string) => void;
  onImportColors: (assetId: string) => void;
  onSendToToolPage: (assetId: string, toolPageId: ToolPageId) => void;
  onRevealInFolder: (assetId: string) => void;
}

export function buildAssetContextMenuItems(
  asset: AssetRecord,
  hasProject: boolean,
  actions: AssetContextMenuActions,
): MenuItem[] {
  const revealItem: MenuItem = {
    type: "action",
    label: "打开文件夹路径",
    onClick: () => actions.onRevealInFolder(asset.id),
  };

  if (!isImageAsset(asset)) {
    return [revealItem];
  }

  return [
    {
      type: "action",
      label: "新建图层并导入到项目",
      disabled: !hasProject,
      onClick: () => actions.onImportDrawingLayer(asset.id),
    },
    {
      type: "action",
      label: "新建参考图并导入到项目",
      disabled: !hasProject,
      onClick: () => actions.onImportReferenceLayer(asset.id),
    },
    {
      type: "action",
      label: "导入颜色到项目色板",
      disabled: !hasProject,
      onClick: () => actions.onImportColors(asset.id),
    },
    { type: "separator" },
    {
      type: "submenu",
      label: "发送到工具",
      items: TOOL_PAGES.map((tool) => ({
        type: "action" as const,
        label: tool.label,
        onClick: () => actions.onSendToToolPage(asset.id, tool.id),
      })),
    },
    { type: "separator" },
    revealItem,
  ];
}
