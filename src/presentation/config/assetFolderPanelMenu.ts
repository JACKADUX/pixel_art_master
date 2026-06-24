import {
  DocumentPlusIcon,
  FolderPlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { MenuItem } from "../components/MenuDropdown";

export interface AssetFolderPanelMenuActions {
  createMarkdownAsset: () => void;
  createFolder: () => void;
  requestDeleteFolder: () => void;
}

export function buildAssetFolderPanelMenuItems(
  actions: AssetFolderPanelMenuActions,
  options: { hasFolderSelected: boolean },
): MenuItem[] {
  return [
    {
      type: "action",
      label: "新建笔记",
      icon: DocumentPlusIcon,
      onClick: actions.createMarkdownAsset,
    },
    { type: "separator" },
    {
      type: "action",
      label: "新建子文件夹",
      icon: FolderPlusIcon,
      onClick: actions.createFolder,
    },
    {
      type: "action",
      label: "删除文件夹",
      icon: TrashIcon,
      disabled: !options.hasFolderSelected,
      onClick: actions.requestDeleteFolder,
    },
  ];
}
