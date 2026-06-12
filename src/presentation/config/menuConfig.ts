import type { MenuGroup } from "../components/MenuDropdown";
import {
  ArrowDownTrayIcon,
  ComputerDesktopIcon,
  DocumentDuplicateIcon,
  DocumentPlusIcon,
  FolderOpenIcon,
  MapPinIcon,
  PhotoIcon,
  RectangleStackIcon,
} from "../icons/ActionIcons";

export const SHORTCUT_LABELS = {
  newProject: "Ctrl+N",
  openProject: "Ctrl+O",
  saveCurrentProject: "Ctrl+S",
  saveProjectAs: "Ctrl+Shift+S",
} as const;

export type ShortcutAction = keyof typeof SHORTCUT_LABELS;

export interface MenuActions {
  newProject: () => void;
  openProject: () => void;
  saveCurrentProject: () => void;
  saveProjectAs: () => void;
  importImage: () => void;
  openProjectManager: () => void;
  screenCapture: () => void;
  openWindowPicker: () => void;
  toggleAlwaysOnTop: () => void;
  alwaysOnTop: boolean;
}

export function buildMenuGroups(actions: MenuActions): MenuGroup[] {
  return [
    {
      id: "file",
      label: "文件",
      items: [
        {
          type: "action",
          label: "新建",
          icon: DocumentPlusIcon,
          shortcut: SHORTCUT_LABELS.newProject,
          onClick: actions.newProject,
        },
        {
          type: "action",
          label: "打开",
          icon: FolderOpenIcon,
          shortcut: SHORTCUT_LABELS.openProject,
          onClick: actions.openProject,
        },
        { type: "separator" },
        {
          type: "action",
          label: "保存",
          icon: ArrowDownTrayIcon,
          shortcut: SHORTCUT_LABELS.saveCurrentProject,
          onClick: actions.saveCurrentProject,
        },
        {
          type: "action",
          label: "另存为",
          icon: DocumentDuplicateIcon,
          shortcut: SHORTCUT_LABELS.saveProjectAs,
          onClick: actions.saveProjectAs,
        },
        { type: "separator" },
        {
          type: "action",
          label: "导入图片",
          icon: PhotoIcon,
          onClick: actions.importImage,
        },
        { type: "separator" },
        {
          type: "action",
          label: "项目管理",
          icon: RectangleStackIcon,
          onClick: actions.openProjectManager,
        },
      ],
    },
    {
      id: "capture",
      label: "捕获",
      items: [
        {
          type: "action",
          label: "屏幕截图",
          icon: ComputerDesktopIcon,
          onClick: actions.screenCapture,
        },
        {
          type: "action",
          label: "窗口截图",
          icon: RectangleStackIcon,
          onClick: actions.openWindowPicker,
        },
      ],
    },
    {
      id: "view",
      label: "视图",
      items: [
        {
          type: "toggle",
          label: "窗口置顶",
          icon: MapPinIcon,
          checked: actions.alwaysOnTop,
          onClick: actions.toggleAlwaysOnTop,
        },
      ],
    },
  ];
}
